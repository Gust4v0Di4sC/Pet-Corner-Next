import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDB } from "../firebase";
import type {
  Appointment,
  AppointmentSettings,
  AppointmentStatus,
  AppointmentStatusFilter,
  DayAvailability,
} from "../types/appointment";

const APPOINTMENTS_COLLECTION = "appointments";
const APPOINTMENT_SETTINGS_COLLECTION = "appointmentSettings";
const APPOINTMENT_LOCKS_COLLECTION = "appointmentLocks";
const CUSTOMERS_COLLECTION = "customers";
const CUSTOMER_NOTIFICATIONS_SUBCOLLECTION = "notifications";
const DEFAULT_SETTINGS_DOCUMENT_ID = "default";

export const APPOINTMENT_STATUS_OPTIONS: AppointmentStatus[] = [
  "requested",
  "confirmed",
  "canceled",
  "completed",
];

export const DEFAULT_APPOINTMENT_SETTINGS: AppointmentSettings = {
  timezone: "America/Sao_Paulo",
  slotIntervalMinutes: 30,
  minAdvanceHours: 2,
  maxDaysAhead: 30,
  weeklyAvailability: {
    "0": { enabled: false, startTime: "09:00", endTime: "13:00" },
    "1": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "2": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "3": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "4": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "5": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "6": { enabled: true, startTime: "09:00", endTime: "13:00" },
  },
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  requested: "Solicitado",
  confirmed: "Confirmado",
  canceled: "Cancelado",
  completed: "Concluído",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
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
  return typeof value === "boolean" ? value : fallback;
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  return null;
}

function normalizeStatus(value: unknown): AppointmentStatus {
  const normalizedValue = toStringValue(value).trim();
  return APPOINTMENT_STATUS_OPTIONS.includes(normalizedValue as AppointmentStatus)
    ? (normalizedValue as AppointmentStatus)
    : "requested";
}

function normalizeWeeklyAvailability(payload: unknown): Record<string, DayAvailability> {
  if (!isRecord(payload)) {
    return DEFAULT_APPOINTMENT_SETTINGS.weeklyAvailability;
  }

  return Object.fromEntries(
    Object.entries(DEFAULT_APPOINTMENT_SETTINGS.weeklyAvailability).map(
      ([weekday, defaultValue]) => {
        const dayPayload = payload[weekday];
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
  );
}

function mapSettings(payload: unknown): AppointmentSettings {
  if (!isRecord(payload)) {
    return DEFAULT_APPOINTMENT_SETTINGS;
  }

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
    weeklyAvailability: normalizeWeeklyAvailability(payload.weeklyAvailability),
    updatedAtIso: toIsoString(payload.updatedAtIso) || toIsoString(payload.updatedAt) || undefined,
  };
}

function mapAppointment(id: string, payload: unknown): Appointment | null {
  if (!isRecord(payload)) {
    return null;
  }

  const serviceName = toStringValue(payload.serviceName).trim();
  const customerId = toStringValue(payload.customerId).trim();
  if (!serviceName || !customerId) {
    return null;
  }

  const lockIds = Array.isArray(payload.lockIds)
    ? payload.lockIds.map((item) => toStringValue(item).trim()).filter(Boolean)
    : [];
  const createdAtIso =
    toIsoString(payload.createdAtIso) || toIsoString(payload.createdAt) || new Date().toISOString();
  const updatedAtIso =
    toIsoString(payload.updatedAtIso) || toIsoString(payload.updatedAt) || createdAtIso;

  return {
    id,
    customerId,
    customerName: toStringValue(payload.customerName).trim(),
    customerEmail: toStringValue(payload.customerEmail).trim(),
    serviceId: toStringValue(payload.serviceId).trim(),
    serviceName,
    serviceCategory: toStringValue(payload.serviceCategory).trim(),
    serviceDurationMinutes: Math.max(Math.round(toNumberValue(payload.serviceDurationMinutes, 0)), 0),
    servicePrice: Math.max(toNumberValue(payload.servicePrice, 0), 0),
    scheduledDateKey: toStringValue(payload.scheduledDateKey).trim(),
    scheduledStartTime: toStringValue(payload.scheduledStartTime).trim(),
    scheduledEndTime: toStringValue(payload.scheduledEndTime).trim(),
    scheduledStartIso:
      toIsoString(payload.scheduledStartIso) || toIsoString(payload.scheduledStart) || createdAtIso,
    scheduledEndIso:
      toIsoString(payload.scheduledEndIso) || toIsoString(payload.scheduledEnd) || createdAtIso,
    status: normalizeStatus(payload.status),
    notes: toStringValue(payload.notes).trim(),
    lockIds,
    googleCalendarAddUrl: toStringValue(payload.googleCalendarAddUrl).trim(),
    calendarEmailStatus: toStringValue(payload.calendarEmailStatus).trim() || "disabled",
    createdAtIso,
    updatedAtIso,
  };
}

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return STATUS_LABELS[status];
}

export async function listAppointments(options: {
  status: AppointmentStatusFilter;
  dateKey?: string;
  maxResults?: number;
}): Promise<Appointment[]> {
  const db = await getFirestoreDB();
  const maxResults = Math.max(20, Math.min(options.maxResults ?? 200, 300));

  const filters = [];
  if (options.status !== "all") {
    filters.push(where("status", "==", options.status));
  }
  if (options.dateKey?.trim()) {
    filters.push(where("scheduledDateKey", "==", options.dateKey.trim()));
  }

  const appointmentsQuery = query(
    collection(db, APPOINTMENTS_COLLECTION),
    ...filters,
    orderBy("scheduledStartIso", "desc"),
    limit(maxResults)
  );

  const snapshot = await getDocs(appointmentsQuery);
  return snapshot.docs
    .map((item) => mapAppointment(item.id, item.data()))
    .filter((item): item is Appointment => item !== null);
}

export async function getAppointmentSettings(): Promise<AppointmentSettings> {
  const db = await getFirestoreDB();
  const settingsSnapshot = await getDoc(
    doc(db, APPOINTMENT_SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOCUMENT_ID)
  );

  return mapSettings(settingsSnapshot.exists() ? settingsSnapshot.data() : null);
}

export async function saveAppointmentSettings(settings: AppointmentSettings): Promise<void> {
  const db = await getFirestoreDB();
  await setDoc(
    doc(db, APPOINTMENT_SETTINGS_COLLECTION, DEFAULT_SETTINGS_DOCUMENT_ID),
    {
      timezone: settings.timezone,
      slotIntervalMinutes: Math.max(5, Math.round(settings.slotIntervalMinutes)),
      minAdvanceHours: Math.max(0, Math.round(settings.minAdvanceHours)),
      maxDaysAhead: Math.max(1, Math.round(settings.maxDaysAhead)),
      weeklyAvailability: settings.weeklyAvailability,
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function updateAppointmentStatus(input: {
  appointment: Appointment;
  nextStatus: AppointmentStatus;
}): Promise<void> {
  if (input.appointment.status === "canceled" && input.nextStatus !== "canceled") {
    throw new Error("Agendamentos cancelados liberam o horário e não podem ser reativados.");
  }

  const db = await getFirestoreDB();
  const nowIso = new Date().toISOString();
  const batch = writeBatch(db);
  const appointmentRef = doc(db, APPOINTMENTS_COLLECTION, input.appointment.id);

  batch.set(
    appointmentRef,
    {
      status: input.nextStatus,
      updatedAt: serverTimestamp(),
      updatedAtIso: nowIso,
    },
    { merge: true }
  );

  if (input.nextStatus === "canceled") {
    input.appointment.lockIds.forEach((lockId) => {
      batch.delete(doc(db, APPOINTMENT_LOCKS_COLLECTION, lockId));
    });
  }

  if (input.appointment.customerId) {
    const notificationRef = doc(
      collection(
        db,
        CUSTOMERS_COLLECTION,
        input.appointment.customerId,
        CUSTOMER_NOTIFICATIONS_SUBCOLLECTION
      )
    );
    batch.set(notificationRef, {
      customerId: input.appointment.customerId,
      title: "Atualização do agendamento",
      message: `${input.appointment.serviceName} foi atualizado para ${STATUS_LABELS[input.nextStatus]}.`,
      category: "system",
      linkHref: "/profile",
      isRead: false,
      createdAt: serverTimestamp(),
      createdAtIso: nowIso,
    });
  }

  await batch.commit();

}

export async function deleteAppointmentLock(lockId: string): Promise<void> {
  const normalizedLockId = lockId.trim();
  if (!normalizedLockId) {
    return;
  }

  const db = await getFirestoreDB();
  await deleteDoc(doc(db, APPOINTMENT_LOCKS_COLLECTION, normalizedLockId));
}
