import "server-only";

import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirebaseServerApp, getFirebaseServerFirestore } from "@/lib/firebase/firebase-server";
import type {
  AppointmentAvailability,
  AppointmentSettings,
  AppointmentSlot,
  CustomerAppointment,
} from "@/features/scheduling/types/appointment";
import {
  DEFAULT_APPOINTMENT_SETTINGS,
  buildLockId,
  getDayAvailability,
  getRequiredSlotTimes,
  isValidDateKey,
  minutesToTime,
  timeToMinutes,
  toSaoPauloIso,
} from "@/features/scheduling/utils/appointment-time";
import { buildGoogleCalendarAddUrl } from "@/features/scheduling/utils/calendar-links";
import { sendAppointmentCalendarEmail } from "@/features/scheduling/services/appointment-email.server";

const APPOINTMENTS_COLLECTION = "appointments";
const APPOINTMENT_LOCKS_COLLECTION = "appointmentLocks";
const APPOINTMENT_SETTINGS_COLLECTION = "appointmentSettings";
const SERVICES_COLLECTION = "services";
const DEFAULT_SETTINGS_DOCUMENT_ID = "default";

const createAppointmentSchema = z.object({
  serviceId: z.string().trim().min(1),
  dateKey: z.string().trim().refine(isValidDateKey),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(500).optional().default(""),
});

type ServiceRecord = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

type CreateAppointmentInput = z.infer<typeof createAppointmentSchema> & {
  idToken: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number.parseFloat(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallback;
}

function toBooleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function normalizeSettings(payload: unknown): AppointmentSettings {
  if (!isRecord(payload)) {
    return DEFAULT_APPOINTMENT_SETTINGS;
  }

  const weeklyPayload = payload.weeklyAvailability;
  const weeklyAvailability = isRecord(weeklyPayload)
    ? Object.fromEntries(
        Object.entries(DEFAULT_APPOINTMENT_SETTINGS.weeklyAvailability).map(
          ([weekday, defaultValue]) => {
            const dayPayload = weeklyPayload[weekday];
            if (!isRecord(dayPayload)) {
              return [weekday, defaultValue];
            }

            return [
              weekday,
              {
                enabled: toBooleanValue(dayPayload.enabled, defaultValue.enabled),
                startTime: toStringValue(dayPayload.startTime, defaultValue.startTime),
                endTime: toStringValue(dayPayload.endTime, defaultValue.endTime),
              },
            ];
          }
        )
      )
    : DEFAULT_APPOINTMENT_SETTINGS.weeklyAvailability;

  return {
    timezone: toStringValue(payload.timezone, DEFAULT_APPOINTMENT_SETTINGS.timezone),
    slotIntervalMinutes: Math.max(
      5,
      Math.round(
        toNumberValue(
          payload.slotIntervalMinutes,
          DEFAULT_APPOINTMENT_SETTINGS.slotIntervalMinutes
        )
      )
    ),
    minAdvanceHours: Math.max(
      0,
      Math.round(toNumberValue(payload.minAdvanceHours, DEFAULT_APPOINTMENT_SETTINGS.minAdvanceHours))
    ),
    maxDaysAhead: Math.max(
      1,
      Math.round(toNumberValue(payload.maxDaysAhead, DEFAULT_APPOINTMENT_SETTINGS.maxDaysAhead))
    ),
    weeklyAvailability,
  };
}

function normalizeService(serviceId: string, payload: unknown): ServiceRecord | null {
  if (!isRecord(payload)) {
    return null;
  }

  const name = toStringValue(payload.name).trim();
  const durationMinutes = Math.max(Math.round(toNumberValue(payload.durationMinutes, 0)), 0);
  if (!name || durationMinutes <= 0) {
    return null;
  }

  return {
    id: serviceId,
    name,
    category: toStringValue(payload.category).trim(),
    durationMinutes,
    price: Math.max(toNumberValue(payload.price, 0), 0),
    isActive: toBooleanValue(payload.isActive, true),
  };
}

async function readSettings(): Promise<AppointmentSettings> {
  const db = getFirebaseServerFirestore();
  const snapshot = await db
    .collection(APPOINTMENT_SETTINGS_COLLECTION)
    .doc(DEFAULT_SETTINGS_DOCUMENT_ID)
    .get();

  return normalizeSettings(snapshot.exists ? snapshot.data() : null);
}

async function readService(serviceId: string): Promise<ServiceRecord | null> {
  const db = getFirebaseServerFirestore();
  const snapshot = await db.collection(SERVICES_COLLECTION).doc(serviceId).get();
  return normalizeService(snapshot.id, snapshot.exists ? snapshot.data() : null);
}

function isDateInsideWindow(dateKey: string, settings: AppointmentSettings): boolean {
  const selectedDate = new Date(`${dateKey}T12:00:00-03:00`);
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedLocalDate = new Date(
    selectedDate.getUTCFullYear(),
    selectedDate.getUTCMonth(),
    selectedDate.getUTCDate()
  );
  const maxDate = new Date(todayDate);
  maxDate.setDate(maxDate.getDate() + settings.maxDaysAhead);

  return selectedLocalDate >= todayDate && selectedLocalDate <= maxDate;
}

function isSlotAllowed(params: {
  dateKey: string;
  startTime: string;
  service: ServiceRecord;
  settings: AppointmentSettings;
}): boolean {
  if (!isDateInsideWindow(params.dateKey, params.settings)) {
    return false;
  }

  const dayAvailability = getDayAvailability(params.settings, params.dateKey);
  if (!dayAvailability.enabled) {
    return false;
  }

  const startMinutes = timeToMinutes(params.startTime);
  const openingMinutes = timeToMinutes(dayAvailability.startTime);
  const closingMinutes = timeToMinutes(dayAvailability.endTime);
  const endMinutes = startMinutes + params.service.durationMinutes;

  if (![startMinutes, openingMinutes, closingMinutes].every(Number.isFinite)) {
    return false;
  }

  if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
    return false;
  }

  const minStartDate = new Date(Date.now() + params.settings.minAdvanceHours * 60 * 60 * 1000);
  return new Date(toSaoPauloIso(params.dateKey, params.startTime)).getTime() >= minStartDate.getTime();
}

function buildSlots(params: {
  dateKey: string;
  service: ServiceRecord;
  settings: AppointmentSettings;
  lockedSlotIds: Set<string>;
}): AppointmentSlot[] {
  const dayAvailability = getDayAvailability(params.settings, params.dateKey);
  if (!dayAvailability.enabled || !isDateInsideWindow(params.dateKey, params.settings)) {
    return [];
  }

  const openingMinutes = timeToMinutes(dayAvailability.startTime);
  const closingMinutes = timeToMinutes(dayAvailability.endTime);
  if (!Number.isFinite(openingMinutes) || !Number.isFinite(closingMinutes)) {
    return [];
  }

  const slots: AppointmentSlot[] = [];
  const interval = params.settings.slotIntervalMinutes;

  for (
    let minute = openingMinutes;
    minute + params.service.durationMinutes <= closingMinutes;
    minute += interval
  ) {
    const startTime = minutesToTime(minute);
    const endTime = minutesToTime(minute + params.service.durationMinutes);
    const requiredSlotTimes = getRequiredSlotTimes({
      startTime,
      durationMinutes: params.service.durationMinutes,
      slotIntervalMinutes: interval,
    });
    const hasLock = requiredSlotTimes.some((time) =>
      params.lockedSlotIds.has(buildLockId(params.dateKey, time))
    );
    const isAllowed = isSlotAllowed({
      dateKey: params.dateKey,
      startTime,
      service: params.service,
      settings: params.settings,
    });

    slots.push({
      startTime,
      endTime,
      startIso: toSaoPauloIso(params.dateKey, startTime),
      endIso: toSaoPauloIso(params.dateKey, endTime),
      label: `${startTime} - ${endTime}`,
      available: isAllowed && !hasLock,
    });
  }

  return slots;
}

async function readLockedSlotIds(dateKey: string): Promise<Set<string>> {
  const db = getFirebaseServerFirestore();
  const snapshot = await db
    .collection(APPOINTMENT_LOCKS_COLLECTION)
    .where("scheduledDateKey", "==", dateKey)
    .get();

  return new Set(snapshot.docs.map((documentSnapshot) => documentSnapshot.id));
}

export async function getAppointmentAvailability(input: {
  serviceId: string;
  dateKey: string;
}): Promise<AppointmentAvailability> {
  const serviceId = input.serviceId.trim();
  const dateKey = input.dateKey.trim();
  if (!serviceId || !isValidDateKey(dateKey)) {
    throw new Error("Parâmetros de disponibilidade inválidos.");
  }

  const [settings, service, lockedSlotIds] = await Promise.all([
    readSettings(),
    readService(serviceId),
    readLockedSlotIds(dateKey),
  ]);

  if (!service || !service.isActive) {
    return {
      serviceId,
      dateKey,
      timezone: settings.timezone,
      slots: [],
    };
  }

  return {
    serviceId,
    dateKey,
    timezone: settings.timezone,
    slots: buildSlots({ dateKey, service, settings, lockedSlotIds }),
  };
}

export async function createAppointment(input: CreateAppointmentInput): Promise<CustomerAppointment> {
  const parsedInput = createAppointmentSchema.parse(input);
  const auth = getAuth(getFirebaseServerApp());
  const decodedToken = await auth.verifyIdToken(input.idToken);
  const customerId = decodedToken.uid.trim();
  const customerEmail = decodedToken.email?.trim() || "";
  const customerName = toStringValue(decodedToken.name).trim() || customerEmail || "Cliente Pet Corner";

  if (!customerId) {
    throw new Error("Sessão inválida para criar agendamento.");
  }

  const db = getFirebaseServerFirestore();
  const settings = await readSettings();
  const service = await readService(parsedInput.serviceId);

  if (!service || !service.isActive) {
    throw new Error("Serviço indisponível para agendamento.");
  }

  if (
    !isSlotAllowed({
      dateKey: parsedInput.dateKey,
      startTime: parsedInput.startTime,
      service,
      settings,
    })
  ) {
    throw new Error("Horário indisponível para este serviço.");
  }

  const endTime = minutesToTime(timeToMinutes(parsedInput.startTime) + service.durationMinutes);
  const scheduledStartIso = toSaoPauloIso(parsedInput.dateKey, parsedInput.startTime);
  const scheduledEndIso = toSaoPauloIso(parsedInput.dateKey, endTime);
  const googleCalendarAddUrl = buildGoogleCalendarAddUrl({
    serviceName: service.name,
    customerName,
    scheduledStartIso,
    scheduledEndIso,
    notes: parsedInput.notes,
  });
  const requiredSlotTimes = getRequiredSlotTimes({
    startTime: parsedInput.startTime,
    durationMinutes: service.durationMinutes,
    slotIntervalMinutes: settings.slotIntervalMinutes,
  });
  const lockIds = requiredSlotTimes.map((time) => buildLockId(parsedInput.dateKey, time));
  const appointmentRef = db.collection(APPOINTMENTS_COLLECTION).doc();
  const nowIso = new Date().toISOString();
  const appointmentPayload = {
    customerId,
    customerEmail,
    customerName,
    serviceId: service.id,
    serviceName: service.name,
    serviceCategory: service.category,
    serviceDurationMinutes: service.durationMinutes,
    servicePrice: service.price,
    scheduledDateKey: parsedInput.dateKey,
    scheduledStartTime: parsedInput.startTime,
    scheduledEndTime: endTime,
    scheduledStartIso,
    scheduledEndIso,
    status: "requested",
    notes: parsedInput.notes,
    lockIds,
    googleCalendarAddUrl,
    calendarEmailStatus: "disabled",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };

  await db.runTransaction(async (transaction) => {
    const lockRefs = lockIds.map((lockId) => db.collection(APPOINTMENT_LOCKS_COLLECTION).doc(lockId));
    const lockSnapshots = await Promise.all(lockRefs.map((lockRef) => transaction.get(lockRef)));
    const hasLockedSlot = lockSnapshots.some((snapshot) => snapshot.exists);
    if (hasLockedSlot) {
      throw new Error("Este horário acabou de ser reservado. Escolha outro horário.");
    }

    transaction.set(appointmentRef, appointmentPayload);
    lockRefs.forEach((lockRef, index) => {
      const slotTime = requiredSlotTimes[index];
      transaction.set(lockRef, {
        appointmentId: appointmentRef.id,
        customerId,
        serviceId: service.id,
        scheduledDateKey: parsedInput.dateKey,
        slotStartTime: slotTime,
        slotStartIso: toSaoPauloIso(parsedInput.dateKey, slotTime),
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        createdAtIso: nowIso,
      });
    });

    const adminNotificationRef = db.collection("adminNotifications").doc();
    transaction.set(adminNotificationRef, {
      title: "Novo agendamento solicitado",
      message: `${customerName} solicitou ${service.name} em ${parsedInput.dateKey} às ${parsedInput.startTime}.`,
      category: "appointment",
      source: "petpage",
      actorCustomerId: customerId,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      createdAtIso: nowIso,
    });
  });

  let calendarEmailStatus: CustomerAppointment["calendarEmailStatus"] = "disabled";
  try {
    calendarEmailStatus = await sendAppointmentCalendarEmail({
      customerEmail,
      customerName,
      serviceName: service.name,
      scheduledStartIso,
      scheduledEndIso,
      notes: parsedInput.notes,
    });

    await appointmentRef.set(
      {
        calendarEmailStatus,
        calendarEmailSentAt:
          calendarEmailStatus === "sent" ? FieldValue.serverTimestamp() : null,
        calendarEmailSentAtIso: calendarEmailStatus === "sent" ? new Date().toISOString() : "",
      },
      { merge: true }
    );
  } catch (error) {
    calendarEmailStatus = "error";
    await appointmentRef.set(
      {
        calendarEmailStatus,
        calendarEmailLastError:
          error instanceof Error && error.message.trim()
            ? error.message.slice(0, 500)
            : "Falha ao enviar e-mail do agendamento.",
      },
      { merge: true }
    );
  }

  return {
    id: appointmentRef.id,
    customerId,
    serviceId: service.id,
    serviceName: service.name,
    scheduledDateKey: parsedInput.dateKey,
    scheduledStartTime: parsedInput.startTime,
    scheduledEndTime: endTime,
    scheduledStartIso,
    scheduledEndIso,
    status: "requested",
    notes: parsedInput.notes,
    googleCalendarAddUrl,
    calendarEmailStatus,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

export function mapAppointmentTimestamp(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string" && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  return null;
}
