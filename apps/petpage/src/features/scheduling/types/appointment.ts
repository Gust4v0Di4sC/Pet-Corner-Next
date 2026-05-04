export type AppointmentStatus = "requested" | "confirmed" | "canceled" | "completed";

export type AppointmentSlot = {
  startTime: string;
  endTime: string;
  startIso: string;
  endIso: string;
  label: string;
  available: boolean;
};

export type AppointmentAvailability = {
  serviceId: string;
  dateKey: string;
  timezone: string;
  slots: AppointmentSlot[];
};

export type CustomerAppointment = {
  id: string;
  customerId: string;
  serviceId: string;
  serviceName: string;
  scheduledDateKey: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  status: AppointmentStatus;
  notes: string;
  googleCalendarAddUrl?: string;
  calendarEmailStatus?: "sent" | "disabled" | "missing_config" | "missing_email" | "error";
  createdAtIso: string;
  updatedAtIso: string;
};

export type AppointmentSettings = {
  timezone: string;
  slotIntervalMinutes: number;
  minAdvanceHours: number;
  maxDaysAhead: number;
  weeklyAvailability: Record<string, DayAvailability>;
};

export type DayAvailability = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};
