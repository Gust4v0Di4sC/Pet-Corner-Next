import { Timestamp } from "firebase/firestore";

import type { RecordFormData, RecordFormField } from "./record.types";

export function createInitialFormData(fields: RecordFormField[]): RecordFormData {
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

export function parseNumberField(value: string, label: string): number {
  const sanitizedValue = value.trim().replace(",", ".").replace(/[^\d.-]/g, "");
  const parsedValue = Number(sanitizedValue);

  if (!sanitizedValue || Number.isNaN(parsedValue)) {
    throw new Error(`Informe um valor valido para ${label.toLowerCase()}.`);
  }

  return parsedValue;
}

export function parsePhoneField(value: string): number {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Informe um telefone valido.");
  }

  return Number(digits);
}

export function parseDateField(value: string): Timestamp {
  const [day, month, year] = value.split("/").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (!day || !month || !year || Number.isNaN(parsedDate.getTime())) {
    throw new Error("Informe uma data valida.");
  }

  return Timestamp.fromDate(parsedDate);
}
