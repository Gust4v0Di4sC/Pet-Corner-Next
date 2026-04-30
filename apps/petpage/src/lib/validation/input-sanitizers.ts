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

export function normalizeStateCode(value: string): string {
  return value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2);
}

export function applyZipCodeMask(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizeZipCode(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length !== 8) {
    return "";
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizeCpfCnpjDocument(value: string): string {
  return digitsOnly(value).slice(0, 14);
}

export function formatCpfCnpjMask(value: string): string {
  const digits = normalizeCpfCnpjDocument(value);

  if (digits.length <= 11) {
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 9);
    const part4 = digits.slice(9, 11);

    if (!part2) return part1;
    if (!part3) return `${part1}.${part2}`;
    if (!part4) return `${part1}.${part2}.${part3}`;
    return `${part1}.${part2}.${part3}-${part4}`;
  }

  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 8);
  const part4 = digits.slice(8, 12);
  const part5 = digits.slice(12, 14);

  if (!part2) return part1;
  if (!part3) return `${part1}.${part2}`;
  if (!part4) return `${part1}.${part2}.${part3}`;
  if (!part5) return `${part1}.${part2}.${part3}/${part4}`;
  return `${part1}.${part2}.${part3}/${part4}-${part5}`;
}

export function parseLocaleDecimal(value: string): number {
  const normalizedValue = value.trim().replace(",", ".").replace(/[^\d.-]/g, "");
  return Number.parseFloat(normalizedValue);
}

export function getFirstZodErrorMessage(error: ZodError, fallback: string): string {
  const [firstIssue] = error.issues;
  return firstIssue?.message || fallback;
}
