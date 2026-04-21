import type { PetService, RawPetServiceData } from "../../types/petService";

export const serviceKeys = (rota: string) => ["services", rota] as const;

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === "true" || normalizedValue === "1";
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return false;
}

export const normalizePetService = (item: RawPetServiceData): PetService => ({
  id: typeof item.id === "string" ? item.id : undefined,
  name: typeof item.name === "string" ? item.name : "",
  category: typeof item.category === "string" ? item.category : "",
  description: typeof item.description === "string" ? item.description : "",
  durationMinutes: toNumber(item.durationMinutes),
  price: toNumber(item.price),
  isActive: toBoolean(item.isActive),
});
