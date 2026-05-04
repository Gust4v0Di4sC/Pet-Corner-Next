"use client";

import { getFirebaseAuth, waitForFirebaseUser } from "@/lib/auth/firebase-auth.adapter";
import type {
  AppointmentAvailability,
  CustomerAppointment,
} from "@/features/scheduling/types/appointment";

type AvailabilityResponse =
  | { ok: true; availability: AppointmentAvailability }
  | { ok: false; error?: string };

type CreateAppointmentResponse =
  | { ok: true; appointment: CustomerAppointment }
  | { ok: false; error?: string };

export async function fetchAppointmentAvailability(input: {
  serviceId: string;
  dateKey: string;
}): Promise<AppointmentAvailability> {
  const params = new URLSearchParams({
    serviceId: input.serviceId,
    date: input.dateKey,
  });
  const response = await fetch(`/api/appointments/availability?${params.toString()}`, {
    method: "GET",
  });
  const payload = (await response.json().catch(() => ({}))) as AvailabilityResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(
      !payload.ok && payload.error ? payload.error : "Não foi possível carregar os horários."
    );
  }

  return payload.availability;
}

export async function createCustomerAppointment(input: {
  serviceId: string;
  dateKey: string;
  startTime: string;
  notes: string;
}): Promise<CustomerAppointment> {
  const user = await waitForFirebaseUser();
  const currentUser = user || getFirebaseAuth().currentUser;
  if (!currentUser) {
    throw new Error("Faça login novamente para criar um agendamento.");
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch("/api/appointments", {
    method: "POST",
    headers: {
      authorization: `Bearer ${idToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => ({}))) as CreateAppointmentResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(
      !payload.ok && payload.error ? payload.error : "Não foi possível criar o agendamento."
    );
  }

  return payload.appointment;
}
