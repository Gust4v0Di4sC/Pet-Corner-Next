import type { RawDogData,Dog } from "../../types/dog";

export const dogKeys = (rota: string) => ["dogs", rota] as const;

export const normalizeDog = (item: RawDogData): Dog => ({
  id: typeof item.id === "string" ? item.id : undefined,
  name: typeof item.name === "string" ? item.name : "",
  age: typeof item.age === "number" ? item.age : Number(item.age ?? 0),
  breed: typeof item.breed === "string" ? item.breed : "",
  weight: typeof item.weight === "number" ? item.weight : Number(item.weight ?? 0),
});