import { Timestamp } from "firebase/firestore";
import type { Client, RawClientData, ClientDisplay } from "../../types/client";

export function isTimestampLike(v: unknown): v is Timestamp {
  const candidate = v as { toDate?: unknown } | null;

  return (
    typeof v === "object" &&
    v !== null &&
    "toDate" in v &&
    typeof candidate?.toDate === "function"
  );
}

export function toTimestamp(value: unknown): Timestamp {
  if (!value) return new Timestamp(0, 0);
  if (isTimestampLike(value)) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  return new Timestamp(0, 0);
}

export function normalizeClient(item: RawClientData): Client {
  return {
    id: typeof item.id === "string" ? item.id : "",
    name: typeof item.name === "string" ? item.name : "",
    age: toTimestamp(item.age),
    email: typeof item.email === "string" ? item.email : "",
    phone: typeof item.phone === "number" ? item.phone : Number(item.phone ?? 0),
    address: typeof item.address === "string" ? item.address : "",
  };
}

export function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function toClientDisplay(raw: RawClientData | null | undefined): ClientDisplay | null {
  if (!raw) return null;

  const ageDate = toTimestamp(raw.age).toDate();

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    name: typeof raw.name === "string" ? raw.name : "",
    age: formatDateToString(ageDate),
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "number" ? raw.phone : Number(raw.phone ?? 0),
    address: typeof raw.address === "string" ? raw.address : "",
  };
}

export const clientKeys = {
  list: (rota: string) => ["clients", rota, "list"] as const,
};

