// types/client.ts
import type { Timestamp } from "firebase/firestore";

/**
 * DOMÍNIO (o que sua app considera um Client válido e normalizado)
 */
export type Client = {
  id: string;
  name: string;
  age: Timestamp;
  email: string;
  phone: number;
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
  address: string;
};

/**
 * INPUTS (form/requests)
 * - no create não tem id
 * - age pode vir como Date (ex: input de calendário) ou Timestamp
 */
export type CreateClientInput = Omit<Client, "id"> & {
  age: Timestamp | Date;
};

export type UpdateClientInput = Omit<Client, "id"> & {
  age: Timestamp | Date;
};

/**
 * RAW (o que pode vir do Firestore antes de normalizar)
 * doc.data() é "unknown-ish", então aceita variações
 */
export type RawClientData = Omit<Partial<Client>, "age"> & {
  id?: string;
  age?: Timestamp | Date | unknown;
};
/**
 * VIEW MODEL (UI)
 */
export type ClientDisplay = {
  id?: string;
  name: string;
  age: string; // dd/MM/yyyy
  email: string;
  phone: number;
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
  address: string;
};

export type UseClientReturn = {
  items: Client[];
  selected: ClientDisplay | null;
  setSelected: (client: ClientDisplay | null) => void;
  fetchAll: () => Promise<void>;
  create: (data: Omit<Client, "id">) => Promise<void>;
  update: (id: string, data: Omit<Client, "id">) => Promise<void>;
  remove: (id: string) => Promise<void>;
  searchByName: (name: string) => Promise<void>;
  isLoading: boolean;
};
