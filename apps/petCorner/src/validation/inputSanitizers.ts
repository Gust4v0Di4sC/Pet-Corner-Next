import type { ZodError } from "zod";

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeZipCode(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length !== 8) {
    return "";
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizeStateCode(value: string): string {
  return value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2);
}

export function normalizePhoneNumber(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const digits = trimmedValue.startsWith("+")
    ? trimmedValue.slice(1).replace(/\D/g, "")
    : trimmedValue.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return `+${digits}`;
}

export function normalizeSmsCode(value: string): string {
  return digitsOnly(value).slice(0, 6);
}

export function normalizeProductCode(value: string): string {
  return value.trim().toUpperCase();
}

export function parseLocaleNumber(value: string): number {
  const normalizedValue = value.trim().replace(",", ".").replace(/[^\d.-]/g, "");
  return Number.parseFloat(normalizedValue);
}

export function getFirstZodErrorMessage(error: ZodError, fallbackMessage: string): string {
  const [firstIssue] = error.issues;
  return firstIssue?.message || fallbackMessage;
}
