import type { RecordFormField, RecordFormMask } from "../Records/record.types";

import type { FormInputChangeEvent } from "./form.types";

const defaultMaskByType: Partial<Record<RecordFormField["type"], RecordFormMask>> = {
  phone: { mask: "(00) 00000-0000" },
};

export function parseDateFromString(value: string): Date | null {
  const parts = value.split("/");

  if (parts.length !== 3) {
    return null;
  }

  const [day, month, year] = parts.map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function getFieldMask(field: RecordFormField): RecordFormMask | undefined {
  return field.mask ?? defaultMaskByType[field.type];
}

export function createSyntheticInputChange(
  name: string,
  value: string
): FormInputChangeEvent {
  return {
    target: {
      name,
      value,
    },
  } as FormInputChangeEvent;
}
