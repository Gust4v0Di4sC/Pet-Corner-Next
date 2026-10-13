import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirebaseServerFirestore } from "@/lib/firebase/firebase-server";

const createCustomerPetSchema = z.object({
  name: z.string().trim().min(1).max(120),
  animalType: z.string().trim().min(1).max(80),
  breed: z.string().trim().min(1).max(120),
  age: z.number().int().positive().max(99),
  weight: z.number().finite().nonnegative().max(999.9),
});

export type CreateCustomerPetServerInput = z.infer<typeof createCustomerPetSchema>;

export type RegisteredCustomerPet = CreateCustomerPetServerInput & {
  id: string;
  customerId: string;
  createdAtIso: string;
  updatedAtIso: string;
};

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumberValue(value: unknown): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function mapRegisteredPet(
  id: string,
  customerId: string,
  payload: FirebaseFirestore.DocumentData
): RegisteredCustomerPet | null {
  const name = toStringValue(payload.name);
  const animalType = normalizeAnimalType(
    toStringValue(payload.animalType) || toStringValue(payload.species)
  );
  const breed = toStringValue(payload.breed);
  const age = Math.round(toNumberValue(payload.age));
  const weight = normalizeWeight(toNumberValue(payload.weight));

  if (!name || !animalType || !breed || age <= 0) {
    return null;
  }

  return {
    id,
    customerId,
    name,
    animalType,
    breed,
    age,
    weight,
    createdAtIso: toStringValue(payload.createdAtIso) || new Date().toISOString(),
    updatedAtIso:
      toStringValue(payload.updatedAtIso) ||
      toStringValue(payload.createdAtIso) ||
      new Date().toISOString(),
  };
}

function normalizeAnimalType(value: string): string {
  const normalizedValue = value.trim();
  return normalizedValue.toLowerCase() === "cao" ? "Cachorro" : normalizedValue;
}

function normalizeWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

export function parseCreateCustomerPetInput(input: unknown): CreateCustomerPetServerInput {
  return createCustomerPetSchema.parse(input);
}

export async function listCustomerPetsOnServer(
  customerIdInput: string
): Promise<RegisteredCustomerPet[]> {
  const customerId = customerIdInput.trim();
  if (!customerId) {
    return [];
  }

  const db = getFirebaseServerFirestore();
  const snapshots = await Promise.all([
    db.collection("customers").doc(customerId).collection("pets").limit(50).get(),
    db.collection("pets").where("customerId", "==", customerId).limit(50).get(),
    db.collection("dogs").where("ownerCustomerId", "==", customerId).limit(50).get(),
  ]);
  const firstAvailablePetSource = snapshots
    .map((snapshot) =>
      snapshot.docs
        .map((documentSnapshot) =>
          mapRegisteredPet(documentSnapshot.id, customerId, documentSnapshot.data())
        )
        .filter((pet): pet is RegisteredCustomerPet => pet !== null)
    )
    .find((pets) => pets.length > 0);

  return (firstAvailablePetSource || []).sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR")
  );
}

export async function createCustomerPetOnServer(input: {
  customerId: string;
  customerName: string;
  pet: CreateCustomerPetServerInput;
}): Promise<RegisteredCustomerPet> {
  const customerId = input.customerId.trim();
  if (!customerId) {
    throw new Error("Sessao invalida para cadastrar o pet.");
  }

  const pet = createCustomerPetSchema.parse(input.pet);
  const db = getFirebaseServerFirestore();
  const petRef = db.collection("customers").doc(customerId).collection("pets").doc();
  const adminDogRef = db.collection("dogs").doc(`${customerId}_${petRef.id}`);
  const customerNotificationRef = db
    .collection("customers")
    .doc(customerId)
    .collection("notifications")
    .doc();
  const adminNotificationRef = db.collection("adminNotifications").doc();
  const nowIso = new Date().toISOString();
  const animalType = normalizeAnimalType(pet.animalType);
  const age = Math.round(pet.age);
  const weight = normalizeWeight(pet.weight);
  const customerName = input.customerName.trim() || customerId;
  const batch = db.batch();

  batch.set(petRef, {
    customerId,
    name: pet.name,
    animalType,
    species: animalType,
    breed: pet.breed,
    age,
    weight,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  });
  batch.set(adminDogRef, {
    ownerCustomerId: customerId,
    name: pet.name,
    animalType,
    breed: pet.breed,
    age,
    weight,
    source: "petpage",
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtIso: nowIso,
  });
  batch.set(customerNotificationRef, {
    customerId,
    title: "Pet cadastrado com sucesso",
    message: `${pet.name} foi adicionado ao seu perfil.`,
    category: "profile",
    linkHref: "/profile",
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso,
  });
  batch.set(adminNotificationRef, {
    title: "Novo pet cadastrado",
    message: `Cliente ${customerName} cadastrou o pet ${pet.name}.`,
    category: "profile",
    actorCustomerId: customerId,
    isRead: false,
    source: "petpage",
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso,
  });

  await batch.commit();

  return {
    id: petRef.id,
    customerId,
    name: pet.name,
    animalType,
    breed: pet.breed,
    age,
    weight,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}
