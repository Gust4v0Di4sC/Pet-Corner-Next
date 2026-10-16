import "server-only";

import { createHash } from "node:crypto";

type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEY = /authorization|cookie|token|secret|password|email|phone|address|payload/i;

function sanitize(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (value instanceof Error) {
    const code = (value as Error & { code?: unknown }).code;
    return { name: value.name, code: typeof code === "string" ? code.slice(0, 120) : undefined };
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
        childKey,
        sanitize(childValue, childKey),
      ])
    );
  }
  return typeof value === "string" && value.length > 500 ? `${value.slice(0, 500)}…` : value;
}

export function sanitizeLogFields(fields: Record<string, unknown>) {
  return sanitize(fields) as Record<string, unknown>;
}

export function anonymizeUserId(userId: string | null | undefined): string | undefined {
  if (!userId) return undefined;
  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

export function logEvent(level: LogLevel, event: string, fields: Record<string, unknown> = {}) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    severity: level,
    event,
    service: "petcorner-next",
    ...sanitizeLogFields(fields),
  });
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  method(entry);
}
