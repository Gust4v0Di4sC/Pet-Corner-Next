"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseApp } from "@/infrastructure/auth/firebase-auth.adapter";

export type FirebaseCustomerProfileAdapter = {
  provider: "firestore";
  customersCollection: "customers";
  adminClientsCollection: "clientes";
  adminDogsCollection: "dogs";
  petsCollection: "pets";
  ordersCollection: "orders";
  favoritesCollection: "favorites";
  addressesCollection: "addresses";
  defaultAddressDocId: "delivery";
};

export type FirebaseCustomerPet = {
  id: string;
  customerId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  createdAtIso: string;
  updatedAtIso: string;
};

export type FirebaseCustomerOrder = {
  id: string;
  customerId: string;
  label: string;
  dateIso: string;
  status: string;
  totalLabel: string;
};

export type FirebaseCustomerFavorite = {
  id: string;
  customerId: string;
  name: string;
  category: string;
  priceLabel: string;
};

export type FirebaseCustomerAddress = {
  customerId: string;
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
  updatedAtIso: string;
};

export type CreateCustomerPetInput = {
  customerId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
};

export type UpsertCustomerAddressInput = {
  customerId: string;
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
};

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const firebaseCustomerProfileAdapter: FirebaseCustomerProfileAdapter = {
  provider: "firestore",
  customersCollection: "customers",
  adminClientsCollection: "clientes",
  adminDogsCollection: "dogs",
  petsCollection: "pets",
  ordersCollection: "orders",
  favoritesCollection: "favorites",
  addressesCollection: "addresses",
  defaultAddressDocId: "delivery",
};

function getDb() {
  return getFirestore(getFirebaseApp());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  return null;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedNumber = Number.parseFloat(value);
    if (Number.isFinite(parsedNumber)) {
      return parsedNumber;
    }
  }

  return fallback;
}

function customerCollectionRef(
  customerId: string,
  collectionName:
    | FirebaseCustomerProfileAdapter["petsCollection"]
    | FirebaseCustomerProfileAdapter["ordersCollection"]
    | FirebaseCustomerProfileAdapter["favoritesCollection"]
    | FirebaseCustomerProfileAdapter["addressesCollection"]
) {
  return collection(
    getDb(),
    firebaseCustomerProfileAdapter.customersCollection,
    customerId,
    collectionName
  );
}

function formatAddressLabel(input: {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  complement: string;
}): string {
  const baseAddress = [input.street.trim(), input.number.trim()]
    .filter(Boolean)
    .join(", ");
  const districtAddress = input.district.trim();
  const cityState = [input.city.trim(), input.state.trim()].filter(Boolean).join(" - ");
  const zipCode = input.zipCode.trim();
  const complement = input.complement.trim();

  return [baseAddress, districtAddress, cityState, zipCode, complement]
    .filter(Boolean)
    .join(" | ");
}

function mapSpeciesToAdminAnimalType(species: string): string {
  const normalizedSpecies = species.trim().toLowerCase();

  if (normalizedSpecies === "cao" || normalizedSpecies === "cachorro") {
    return "Cachorro";
  }

  if (normalizedSpecies === "gato") {
    return "Gato";
  }

  return species.trim() || "Cachorro";
}

async function mirrorPetToAdminDogsCollection(input: {
  customerId: string;
  petMirrorId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
}): Promise<void> {
  const mirrorRef = doc(
    getDb(),
    firebaseCustomerProfileAdapter.adminDogsCollection,
    input.petMirrorId
  );

  await setDoc(
    mirrorRef,
    {
      ownerCustomerId: input.customerId,
      name: input.name,
      animalType: mapSpeciesToAdminAnimalType(input.species),
      breed: input.breed,
      age: input.age,
      weight: 0,
      source: "petpage",
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function mirrorAddressToAdminClientCollection(input: {
  customerId: string;
  address: string;
}): Promise<void> {
  const mirrorRef = doc(
    getDb(),
    firebaseCustomerProfileAdapter.adminClientsCollection,
    input.customerId
  );

  await setDoc(
    mirrorRef,
    {
      ownerCustomerId: input.customerId,
      address: input.address,
      source: "petpage",
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    },
    { merge: true }
  );
}

function mapPetDocument(
  id: string,
  customerId: string,
  payload: Record<string, unknown>
): FirebaseCustomerPet | null {
  const name = toStringValue(payload.name).trim();
  const species = toStringValue(payload.species).trim();
  const breed = toStringValue(payload.breed).trim();
  const age = toNumberValue(payload.age, 0);
  const createdAtIso =
    toIsoString(payload.createdAtIso) ||
    toIsoString(payload.createdAt) ||
    new Date().toISOString();
  const updatedAtIso =
    toIsoString(payload.updatedAtIso) ||
    toIsoString(payload.updatedAt) ||
    createdAtIso;

  if (!name || !species || !breed || age <= 0) {
    return null;
  }

  return {
    id,
    customerId,
    name,
    species,
    breed,
    age: Math.round(age),
    createdAtIso,
    updatedAtIso,
  };
}

function formatCurrencyLabel(value: unknown): string {
  const numericValue = toNumberValue(value, Number.NaN);
  if (Number.isFinite(numericValue)) {
    return BRL_FORMATTER.format(numericValue);
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "R$ 0,00";
}

function mapOrderDocument(
  id: string,
  customerId: string,
  payload: Record<string, unknown>
): FirebaseCustomerOrder {
  const dateIso =
    toIsoString(payload.dateIso) ||
    toIsoString(payload.createdAtIso) ||
    toIsoString(payload.createdAt) ||
    new Date().toISOString();

  const label = toStringValue(payload.label).trim() || id;
  const status = toStringValue(payload.status).trim() || "Em processamento";
  const totalLabel =
    toStringValue(payload.totalLabel).trim() || formatCurrencyLabel(payload.total);

  return {
    id,
    customerId,
    label,
    dateIso,
    status,
    totalLabel,
  };
}

function mapFavoriteDocument(
  id: string,
  customerId: string,
  payload: Record<string, unknown>
): FirebaseCustomerFavorite {
  const name = toStringValue(payload.name).trim() || "Favorito sem nome";
  const category = toStringValue(payload.category).trim() || "Categoria";
  const priceLabel =
    toStringValue(payload.priceLabel).trim() || formatCurrencyLabel(payload.price);

  return {
    id,
    customerId,
    name,
    category,
    priceLabel,
  };
}

function mapAddressDocument(
  customerId: string,
  payload: Record<string, unknown>
): FirebaseCustomerAddress {
  return {
    customerId,
    zipCode: toStringValue(payload.zipCode).trim(),
    street: toStringValue(payload.street).trim(),
    number: toStringValue(payload.number).trim(),
    district: toStringValue(payload.district).trim(),
    city: toStringValue(payload.city).trim(),
    state: toStringValue(payload.state).trim(),
    complement: toStringValue(payload.complement).trim(),
    updatedAtIso:
      toIsoString(payload.updatedAtIso) ||
      toIsoString(payload.updatedAt) ||
      new Date().toISOString(),
  };
}

function isPermissionDeniedError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  return error.code === "permission-denied";
}

async function readRootPetsByCustomerId(customerId: string): Promise<FirebaseCustomerPet[]> {
  try {
    const rootPetsQuery = query(
      collection(getDb(), firebaseCustomerProfileAdapter.petsCollection),
      where("customerId", "==", customerId),
      limit(40)
    );
    const rootPetsSnapshot = await getDocs(rootPetsQuery);

    return rootPetsSnapshot.docs
      .map((snapshot) => {
        const payload = snapshot.data();
        if (!isRecord(payload)) {
          return null;
        }

        return mapPetDocument(snapshot.id, customerId, payload);
      })
      .filter((pet): pet is FirebaseCustomerPet => pet !== null)
      .sort((left, right) => right.createdAtIso.localeCompare(left.createdAtIso));
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return [];
    }

    throw error;
  }
}

async function migratePetsIntoCustomerSubcollection(
  customerId: string,
  pets: FirebaseCustomerPet[]
): Promise<void> {
  if (!pets.length) {
    return;
  }

  await Promise.all(
    pets.map((pet) =>
      setDoc(
        doc(
          getDb(),
          firebaseCustomerProfileAdapter.customersCollection,
          customerId,
          firebaseCustomerProfileAdapter.petsCollection,
          pet.id
        ),
        {
          customerId,
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.age,
          createdAtIso: pet.createdAtIso,
          updatedAtIso: new Date().toISOString(),
          migratedAt: serverTimestamp(),
        },
        { merge: true }
      )
    )
  );
}

export async function readCustomerPets(customerId: string): Promise<FirebaseCustomerPet[]> {
  const petsSnapshot = await getDocs(
    query(customerCollectionRef(customerId, firebaseCustomerProfileAdapter.petsCollection), limit(50))
  );

  const pets = petsSnapshot.docs
    .map((snapshot) => {
      const payload = snapshot.data();
      if (!isRecord(payload)) {
        return null;
      }

      return mapPetDocument(snapshot.id, customerId, payload);
    })
    .filter((pet): pet is FirebaseCustomerPet => pet !== null)
    .sort((left, right) => right.createdAtIso.localeCompare(left.createdAtIso));

  if (pets.length) {
    return pets;
  }

  const rootPets = await readRootPetsByCustomerId(customerId);
  if (rootPets.length) {
    await migratePetsIntoCustomerSubcollection(customerId, rootPets);
  }
  return rootPets;
}

export async function createCustomerPet(
  input: CreateCustomerPetInput
): Promise<FirebaseCustomerPet> {
  const nowIso = new Date().toISOString();
  const petCollectionRef = customerCollectionRef(
    input.customerId,
    firebaseCustomerProfileAdapter.petsCollection
  );

  const createdPetRef = await addDoc(petCollectionRef, {
    customerId: input.customerId,
    name: input.name.trim(),
    species: input.species.trim(),
    breed: input.breed.trim(),
    age: Math.round(input.age),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  });

  await mirrorPetToAdminDogsCollection({
    customerId: input.customerId,
    petMirrorId: `${input.customerId}_${createdPetRef.id}`,
    name: input.name.trim(),
    species: input.species.trim(),
    breed: input.breed.trim(),
    age: Math.round(input.age),
  });

  return {
    id: createdPetRef.id,
    customerId: input.customerId,
    name: input.name.trim(),
    species: input.species.trim(),
    breed: input.breed.trim(),
    age: Math.round(input.age),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

export async function readCustomerOrders(customerId: string): Promise<FirebaseCustomerOrder[]> {
  const ordersSnapshot = await getDocs(
    query(
      customerCollectionRef(customerId, firebaseCustomerProfileAdapter.ordersCollection),
      limit(30)
    )
  );

  return ordersSnapshot.docs
    .map((snapshot) => {
      const payload = snapshot.data();
      if (!isRecord(payload)) {
        return null;
      }

      return mapOrderDocument(snapshot.id, customerId, payload);
    })
    .filter((order): order is FirebaseCustomerOrder => order !== null)
    .sort((left, right) => right.dateIso.localeCompare(left.dateIso));
}

export async function readCustomerFavorites(
  customerId: string
): Promise<FirebaseCustomerFavorite[]> {
  const favoritesSnapshot = await getDocs(
    query(
      customerCollectionRef(customerId, firebaseCustomerProfileAdapter.favoritesCollection),
      limit(40)
    )
  );

  return favoritesSnapshot.docs
    .map((snapshot) => {
      const payload = snapshot.data();
      if (!isRecord(payload)) {
        return null;
      }

      return mapFavoriteDocument(snapshot.id, customerId, payload);
    })
    .filter((favorite): favorite is FirebaseCustomerFavorite => favorite !== null);
}

export async function readCustomerAddress(
  customerId: string
): Promise<FirebaseCustomerAddress | null> {
  const addressRef = doc(
    getDb(),
    firebaseCustomerProfileAdapter.customersCollection,
    customerId,
    firebaseCustomerProfileAdapter.addressesCollection,
    firebaseCustomerProfileAdapter.defaultAddressDocId
  );

  const addressSnapshot = await getDoc(addressRef);
  if (!addressSnapshot.exists()) {
    return null;
  }

  const payload = addressSnapshot.data();
  if (!isRecord(payload)) {
    return null;
  }

  return mapAddressDocument(customerId, payload);
}

export async function upsertCustomerAddress(
  input: UpsertCustomerAddressInput
): Promise<FirebaseCustomerAddress> {
  const nowIso = new Date().toISOString();
  const addressRef = doc(
    getDb(),
    firebaseCustomerProfileAdapter.customersCollection,
    input.customerId,
    firebaseCustomerProfileAdapter.addressesCollection,
    firebaseCustomerProfileAdapter.defaultAddressDocId
  );

  await setDoc(
    addressRef,
    {
      customerId: input.customerId,
      zipCode: input.zipCode.trim(),
      street: input.street.trim(),
      number: input.number.trim(),
      district: input.district.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      complement: input.complement.trim(),
      updatedAt: serverTimestamp(),
      updatedAtIso: nowIso,
    },
    { merge: true }
  );

  await mirrorAddressToAdminClientCollection({
    customerId: input.customerId,
    address: formatAddressLabel({
      zipCode: input.zipCode,
      street: input.street,
      number: input.number,
      district: input.district,
      city: input.city,
      state: input.state,
      complement: input.complement,
    }),
  });

  return {
    customerId: input.customerId,
    zipCode: input.zipCode.trim(),
    street: input.street.trim(),
    number: input.number.trim(),
    district: input.district.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    complement: input.complement.trim(),
    updatedAtIso: nowIso,
  };
}
