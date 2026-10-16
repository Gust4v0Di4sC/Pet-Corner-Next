"use client";

import { upsertCustomerProfile } from "@/features/account/services/firebase-customer.adapter";
import { waitForFirebaseUser } from "@/lib/auth/firebase-auth.adapter";
import { apiFetch } from "@/lib/http/client-api";
import {
  readCustomerAccountProfile,
  readCustomerAddress,
  readCustomerAppointments,
  readCustomerFavorites,
  readCustomerOrders,
  readCustomerPets,
  type FirebaseCustomerAccountProfile,
  type FirebaseCustomerAddress,
  type FirebaseCustomerAppointment,
  type FirebaseCustomerFavorite,
  type FirebaseCustomerOrder,
  type FirebaseCustomerPet,
} from "@/features/account/services/firebase-profile.adapter";

export type CustomerProfileIdentity = {
  customerId: string;
  name?: string;
  email: string;
};

export type CustomerPet = FirebaseCustomerPet;
export type CustomerOrder = FirebaseCustomerOrder;
export type CustomerAppointment = FirebaseCustomerAppointment;
export type CustomerFavorite = FirebaseCustomerFavorite;
export type CustomerDeliveryAddress = FirebaseCustomerAddress;
export type CustomerAccountProfile = FirebaseCustomerAccountProfile;

export type CreatePetInput = {
  name: string;
  animalType: string;
  breed: string;
  age: number;
  weight: number;
};

export type SaveDeliveryAddressInput = {
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
};

export type CustomerProfileDataBundle = {
  profile: CustomerAccountProfile | null;
  pets: CustomerPet[];
  orders: CustomerOrder[];
  appointments: CustomerAppointment[];
  favorites: CustomerFavorite[];
  address: CustomerDeliveryAddress | null;
};

function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  return maybeCode === "permission-denied";
}

function isSessionPlaceholderCustomerId(customerId: string): boolean {
  const normalizedCustomerId = customerId.trim().toLowerCase();
  return normalizedCustomerId.length === 0 || normalizedCustomerId === "customer-structural";
}

async function resolveIdentity(customerIdentity: CustomerProfileIdentity): Promise<CustomerProfileIdentity> {
  const firebaseUser = await waitForFirebaseUser();
  if (!firebaseUser?.uid) {
    return customerIdentity;
  }

  const authUid = firebaseUser.uid.trim();
  const sessionCustomerId = customerIdentity.customerId.trim();
  const useAuthUid =
    isSessionPlaceholderCustomerId(sessionCustomerId) || sessionCustomerId !== authUid;

  return {
    customerId: useAuthUid ? authUid : sessionCustomerId,
    email: firebaseUser.email?.trim() || customerIdentity.email,
    name: firebaseUser.displayName?.trim() || customerIdentity.name,
  };
}

async function syncCustomerProfile(identity: CustomerProfileIdentity): Promise<void> {
  try {
    await upsertCustomerProfile({
      customerId: identity.customerId,
      email: identity.email,
      name: identity.name || "Cliente Pet Corner",
      provider: "unknown",
    });
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return;
    }
    throw error;
  }
}

export async function getCustomerProfileDataBundle(
  identity: CustomerProfileIdentity
): Promise<CustomerProfileDataBundle> {
  const resolvedIdentity = await resolveIdentity(identity);
  await syncCustomerProfile(resolvedIdentity);

  const [
    profileResult,
    petsResult,
    ordersResult,
    appointmentsResult,
    favoritesResult,
    addressResult,
  ] = await Promise.allSettled([
    readCustomerAccountProfile(resolvedIdentity.customerId),
    readCustomerPets(resolvedIdentity.customerId),
    readCustomerOrders(resolvedIdentity.customerId),
    readCustomerAppointments(resolvedIdentity.customerId),
    readCustomerFavorites(resolvedIdentity.customerId),
    readCustomerAddress(resolvedIdentity.customerId),
  ]);

  return {
    profile: profileResult.status === "fulfilled" ? profileResult.value : null,
    pets: petsResult.status === "fulfilled" ? petsResult.value : [],
    orders: ordersResult.status === "fulfilled" ? ordersResult.value : [],
    appointments:
      appointmentsResult.status === "fulfilled" ? appointmentsResult.value : [],
    favorites: favoritesResult.status === "fulfilled" ? favoritesResult.value : [],
    address: addressResult.status === "fulfilled" ? addressResult.value : null,
  };
}

export async function registerCustomerPet(input: CreatePetInput): Promise<CustomerPet> {
  const response = await apiFetch("/api/profile/pets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      name: input.name,
      animalType: input.animalType,
      breed: input.breed,
      age: input.age,
      weight: input.weight,
    }),
  });
  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; pet?: CustomerPet; error?: string }
    | null;

  if (!response.ok || !result?.ok || !result.pet) {
    throw new Error(result?.error || "Nao foi possivel cadastrar o pet agora.");
  }

  return result.pet;
}

export async function saveCustomerDeliveryAddress(
  input: SaveDeliveryAddressInput
): Promise<CustomerDeliveryAddress> {
  const response = await apiFetch("/api/profile/address", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; address?: CustomerDeliveryAddress; error?: string }
    | null;

  if (!response.ok || !result?.ok || !result.address) {
    throw new Error(result?.error || "Nao foi possivel salvar o endereco agora.");
  }

  return result.address;
}
