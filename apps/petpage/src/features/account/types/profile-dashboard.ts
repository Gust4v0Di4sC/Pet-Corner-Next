import type { LucideIcon } from "lucide-react";

export type ProfileSession = {
  customerId: string;
  name?: string;
  email: string;
  issuedAt: string;
  expiresAt: string;
};

export type SectionId = "orders" | "appointments" | "favorites" | "pets" | "address";

export type SectionNavItem = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
};

export type PetFormState = {
  name: string;
  animalType: string;
  breedSelection: string;
  breed: string;
  age: string;
  weight: string;
};

export type AddressFormState = {
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
};
