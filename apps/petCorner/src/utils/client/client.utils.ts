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

type ClientAddressInput = {
  zipCode?: string;
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
  complement?: string;
};

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function buildClientAddressLabel(input: ClientAddressInput): string {
  const baseAddress = [input.street?.trim() || "", input.number?.trim() || ""]
    .filter(Boolean)
    .join(", ");
  const districtAddress = input.district?.trim() || "";
  const cityState = [input.city?.trim() || "", input.state?.trim() || ""]
    .filter(Boolean)
    .join(" - ");
  const zipCode = input.zipCode?.trim() || "";
  const complement = input.complement?.trim() || "";

  return [baseAddress, districtAddress, cityState, zipCode, complement]
    .filter(Boolean)
    .join(" | ");
}

export function normalizeClient(item: RawClientData): Client {
  const zipCode = toStringValue(item.zipCode);
  const street = toStringValue(item.street);
  const number = toStringValue(item.number);
  const district = toStringValue(item.district);
  const city = toStringValue(item.city);
  const state = toStringValue(item.state);
  const complement = toStringValue(item.complement);
  const address =
    toStringValue(item.address) ||
    buildClientAddressLabel({
      zipCode,
      street,
      number,
      district,
      city,
      state,
      complement,
    });

  return {
    id: typeof item.id === "string" ? item.id : "",
    name: typeof item.name === "string" ? item.name : "",
    age: toTimestamp(item.age),
    email: typeof item.email === "string" ? item.email : "",
    phone: typeof item.phone === "number" ? item.phone : Number(item.phone ?? 0),
    zipCode,
    street,
    number,
    district,
    city,
    state,
    complement,
    address,
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
  const zipCode = toStringValue(raw.zipCode);
  const street = toStringValue(raw.street);
  const number = toStringValue(raw.number);
  const district = toStringValue(raw.district);
  const city = toStringValue(raw.city);
  const state = toStringValue(raw.state);
  const complement = toStringValue(raw.complement);
  const address =
    toStringValue(raw.address) ||
    buildClientAddressLabel({
      zipCode,
      street,
      number,
      district,
      city,
      state,
      complement,
    });

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    name: typeof raw.name === "string" ? raw.name : "",
    age: formatDateToString(ageDate),
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "number" ? raw.phone : Number(raw.phone ?? 0),
    zipCode,
    street,
    number,
    district,
    city,
    state,
    complement,
    address,
  };
}

export const clientKeys = {
  list: (rota: string) => ["clients", rota, "list"] as const,
};

