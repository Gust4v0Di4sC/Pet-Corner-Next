import type { AppointmentSettings, DayAvailability } from "@/features/scheduling/types/appointment";

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

const SAO_PAULO_OFFSET = "-03:00";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function dateToDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);
  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
}

export function timeToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return Number.NaN;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
}

export function minutesToTime(value: number): string {
  const safeValue = Math.max(0, Math.round(value));
  return `${pad(Math.floor(safeValue / 60))}:${pad(safeValue % 60)}`;
}

export function toSaoPauloIso(dateKey: string, time: string): string {
  return `${dateKey}T${time}:00${SAO_PAULO_OFFSET}`;
}

export function getWeekdayKey(dateKey: string): string {
  return String(new Date(`${dateKey}T12:00:00${SAO_PAULO_OFFSET}`).getDay());
}

export function getDayAvailability(
  settings: AppointmentSettings,
  dateKey: string
): DayAvailability {
  return settings.weeklyAvailability[getWeekdayKey(dateKey)] || {
    enabled: false,
    startTime: "09:00",
    endTime: "18:00",
  };
}

export function buildLockId(dateKey: string, time: string): string {
  return `${dateKey}_${time.replace(":", "")}`;
}

export function getRequiredSlotTimes(params: {
  startTime: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
}): string[] {
  const startMinutes = timeToMinutes(params.startTime);
  const durationMinutes = Math.max(1, Math.round(params.durationMinutes));
  const interval = Math.max(5, Math.round(params.slotIntervalMinutes));
  const endMinutes = startMinutes + durationMinutes;
  const slotTimes: string[] = [];

  for (let minute = startMinutes; minute < endMinutes; minute += interval) {
    slotTimes.push(minutesToTime(minute));
  }

  return slotTimes;
}
