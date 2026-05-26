import {
  DEFAULT_APPOINTMENT_SETTINGS,
  getAppointmentStatusLabel,
} from "../../services/appointmentService";
import type {
  Appointment,
  AppointmentSettings,
  AppointmentStatus,
} from "../../types/appointment";

export const WEEKDAY_LABELS: Record<string, string> = {
  "0": "Domingo",
  "1": "Segunda",
  "2": "Terça",
  "3": "Quarta",
  "4": "Quinta",
  "5": "Sexta",
  "6": "Sábado",
};

const CALENDAR_EMAIL_STATUS_LABELS: Record<string, string> = {
  sent: "E-mail enviado",
  disabled: "Envio automático desativado",
  missing_config: "Configuração de e-mail pendente",
  missing_email: "Cliente sem e-mail",
  error: "Erro no envio",
};

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

export function getStatusClassName(status: AppointmentStatus): string {
  return `appointments__status appointments__status--${status}`;
}

export function getCustomerDisplayName(appointment: {
  customerName: string;
  customerEmail: string;
}): string {
  const name = appointment.customerName.trim();
  const email = appointment.customerEmail.trim();
  return name && name.toLowerCase() !== email.toLowerCase() ? name : "Nome não informado";
}

export function getCustomerListLabel(appointment: {
  customerName: string;
  customerEmail: string;
}): string {
  const name = appointment.customerName.trim();
  const email = appointment.customerEmail.trim();
  return name && name.toLowerCase() !== email.toLowerCase()
    ? name
    : email || "Cliente não identificado";
}

export function getCalendarEmailStatusLabel(status: string): string {
  return CALENDAR_EMAIL_STATUS_LABELS[status] || "Status não informado";
}

export function formatCountLabel(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function cloneSettings(settings: AppointmentSettings | null): AppointmentSettings {
  const source = settings || DEFAULT_APPOINTMENT_SETTINGS;
  return {
    timezone: source.timezone,
    slotIntervalMinutes: source.slotIntervalMinutes,
    minAdvanceHours: source.minAdvanceHours,
    maxDaysAhead: source.maxDaysAhead,
    weeklyAvailability: Object.fromEntries(
      Object.entries(source.weeklyAvailability).map(([weekday, day]) => [
        weekday,
        { ...day },
      ])
    ),
  };
}

export function countRequestedAppointments(appointments: Appointment[]): number {
  return appointments.filter((appointment) => appointment.status === "requested").length;
}

export function getReadableStatusLabel(status: AppointmentStatus): string {
  return getAppointmentStatusLabel(status);
}
