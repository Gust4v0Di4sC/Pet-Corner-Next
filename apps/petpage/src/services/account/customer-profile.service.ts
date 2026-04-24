"use client";

import { upsertCustomerProfile } from "@/infrastructure/account/firebase-customer.adapter";
import { waitForFirebaseUser } from "@/infrastructure/auth/firebase-auth.adapter";
import {
  createCustomerPet,
  readCustomerAccountProfile,
  readCustomerAddress,
  readCustomerFavorites,
  readCustomerOrders,
  readCustomerPets,
  type FirebaseCustomerAccountProfile,
  type FirebaseCustomerAddress,
  type FirebaseCustomerFavorite,
  type FirebaseCustomerOrder,
  type FirebaseCustomerPet,
  upsertCustomerAddress,
} from "@/infrastructure/account/firebase-profile.adapter";
import {
  createAdminBroadcastNotification,
  createCustomerNotification,
} from "@/services/notifications/customer-notification.service";

export type CustomerProfileIdentity = {
  customerId: string;
  name?: string;
  email: string;
};

export type CustomerPet = FirebaseCustomerPet;
export type CustomerOrder = FirebaseCustomerOrder;
export type CustomerFavorite = FirebaseCustomerFavorite;
export type CustomerDeliveryAddress = FirebaseCustomerAddress;
export type CustomerAccountProfile = FirebaseCustomerAccountProfile;

export type CreatePetInput = {
  customerId: string;
  name: string;
  animalType: string;
  breed: string;
  age: number;
  weight: number;
};

export type SaveDeliveryAddressInput = {
  customerId: string;
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

async function resolveCustomerId(customerId: string): Promise<string> {
  const firebaseUser = await waitForFirebaseUser();
  const sessionCustomerId = customerId.trim();

  if (!firebaseUser?.uid) {
    return sessionCustomerId;
  }

  const authUid = firebaseUser.uid.trim();
  if (isSessionPlaceholderCustomerId(sessionCustomerId) || sessionCustomerId !== authUid) {
    return authUid;
  }

  return sessionCustomerId;
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

  const [profileResult, petsResult, ordersResult, favoritesResult, addressResult] = await Promise.allSettled([
    readCustomerAccountProfile(resolvedIdentity.customerId),
    readCustomerPets(resolvedIdentity.customerId),
    readCustomerOrders(resolvedIdentity.customerId),
    readCustomerFavorites(resolvedIdentity.customerId),
    readCustomerAddress(resolvedIdentity.customerId),
  ]);

  return {
    profile: profileResult.status === "fulfilled" ? profileResult.value : null,
    pets: petsResult.status === "fulfilled" ? petsResult.value : [],
    orders: ordersResult.status === "fulfilled" ? ordersResult.value : [],
    favorites: favoritesResult.status === "fulfilled" ? favoritesResult.value : [],
    address: addressResult.status === "fulfilled" ? addressResult.value : null,
  };
}

export async function registerCustomerPet(input: CreatePetInput): Promise<CustomerPet> {
  const resolvedCustomerId = await resolveCustomerId(input.customerId);
  const createdPet = await createCustomerPet({
    customerId: resolvedCustomerId,
    name: input.name,
    animalType: input.animalType,
    breed: input.breed,
    age: input.age,
    weight: input.weight,
  });

  void createCustomerNotification({
    customerId: resolvedCustomerId,
    title: "Pet cadastrado com sucesso",
    message: `${createdPet.name} foi adicionado ao seu perfil.`,
    category: "profile",
    linkHref: "/profile",
  }).catch(() => {
    return;
  });

  void createAdminBroadcastNotification({
    title: "Novo pet cadastrado",
    message: `Cliente ${resolvedCustomerId} cadastrou o pet ${createdPet.name}.`,
    category: "profile",
    actorCustomerId: resolvedCustomerId,
  }).catch(() => {
    return;
  });

  return createdPet;
}

export async function saveCustomerDeliveryAddress(
  input: SaveDeliveryAddressInput
): Promise<CustomerDeliveryAddress> {
  const resolvedCustomerId = await resolveCustomerId(input.customerId);
  const savedAddress = await upsertCustomerAddress({
    customerId: resolvedCustomerId,
    zipCode: input.zipCode,
    street: input.street,
    number: input.number,
    district: input.district,
    city: input.city,
    state: input.state,
    complement: input.complement,
  });

  void createCustomerNotification({
    customerId: resolvedCustomerId,
    title: "Endereco atualizado",
    message: "Seu endereco de entrega foi atualizado com sucesso.",
    category: "profile",
    linkHref: "/profile",
  }).catch(() => {
    return;
  });

  return savedAddress;
}
