export type AppointmentStatus = "requested" | "confirmed" | "canceled" | "completed";

export type Appointment = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  scheduledDateKey: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  status: AppointmentStatus;
  notes: string;
  lockIds: string[];
  googleCalendarAddUrl: string;
  calendarEmailStatus: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type DayAvailability = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type AppointmentSettings = {
  timezone: string;
  slotIntervalMinutes: number;
  minAdvanceHours: number;
  maxDaysAhead: number;
  weeklyAvailability: Record<string, DayAvailability>;
  updatedAtIso?: string;
};

export type AppointmentStatusFilter = AppointmentStatus | "all";
