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
import { getFirebaseApp } from "@/lib/auth/firebase-auth.adapter";

export type FirebaseCustomerProfileAdapter = {
  provider: "firestore";
  customersCollection: "customers";
  adminClientsCollection: "clientes";
  adminDogsCollection: "dogs";
  petsCollection: "pets";
  ordersCollection: "orders";
  appointmentsCollection: "appointments";
  favoritesCollection: "favorites";
  addressesCollection: "addresses";
  defaultAddressDocId: "delivery";
};

export type FirebaseCustomerPet = {
  id: string;
  customerId: string;
  name: string;
  animalType: string;
  breed: string;
  age: number;
  weight: number;
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

export type FirebaseCustomerAppointment = {
  id: string;
  customerId: string;
  serviceName: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  scheduledDateKey: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
};

export type FirebaseCustomerFavorite = {
  id: string;
  customerId: string;
  name: string;
  category: string;
  priceLabel: string;
};

export type FirebaseCustomerAccountProfile = {
  customerId: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  updatedAtIso: string;
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
  animalType: string;
  breed: string;
  age: number;
  weight: number;
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
  appointmentsCollection: "appointments",
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

function toHttpImageUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") {
      return parsedUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function normalizePetWeight(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

function normalizeAnimalType(value: string): string {
  const normalizedValue = value.trim();
  const lowerCaseValue = normalizedValue.toLowerCase();

  if (lowerCaseValue === "cao") {
    return "Cachorro";
  }

  return normalizedValue;
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

async function mirrorPetToAdminDogsCollection(input: {
  customerId: string;
  petMirrorId: string;
  name: string;
  animalType: string;
  breed: string;
  age: number;
  weight: number;
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
      animalType: input.animalType,
      breed: input.breed,
      age: input.age,
      weight: normalizePetWeight(input.weight),
      source: "petpage",
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function mirrorAddressToAdminClientCollection(input: {
  customerId: string;
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement: string;
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
      zipCode: input.zipCode,
      street: input.street,
      number: input.number,
      district: input.district,
      city: input.city,
      state: input.state,
      complement: input.complement,
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
  const animalType = normalizeAnimalType(
    toStringValue(payload.animalType).trim() || toStringValue(payload.species).trim()
  );
  const breed = toStringValue(payload.breed).trim();
  const age = toNumberValue(payload.age, 0);
  const weight = normalizePetWeight(toNumberValue(payload.weight, 0));
  const createdAtIso =
    toIsoString(payload.createdAtIso) ||
    toIsoString(payload.createdAt) ||
    new Date().toISOString();
  const updatedAtIso =
    toIsoString(payload.updatedAtIso) ||
    toIsoString(payload.updatedAt) ||
    createdAtIso;

  if (!name || !animalType || !breed || age <= 0) {
    return null;
  }

  return {
    id,
    customerId,
    name,
    animalType,
    breed,
    age: Math.round(age),
    weight,
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

function mapAppointmentDocument(
  id: string,
  customerId: string,
  payload: Record<string, unknown>
): FirebaseCustomerAppointment | null {
  const appointmentCustomerId = toStringValue(payload.customerId).trim();
  const serviceName = toStringValue(payload.serviceName).trim();
  const scheduledStartIso =
    toIsoString(payload.scheduledStartIso) ||
    toIsoString(payload.scheduledStart) ||
    new Date().toISOString();
  const scheduledEndIso =
    toIsoString(payload.scheduledEndIso) ||
    toIsoString(payload.scheduledEnd) ||
    scheduledStartIso;

  if (appointmentCustomerId !== customerId || !serviceName) {
    return null;
  }

  return {
    id,
    customerId,
    serviceName,
    scheduledStartIso,
    scheduledEndIso,
    scheduledDateKey: toStringValue(payload.scheduledDateKey).trim(),
    scheduledStartTime: toStringValue(payload.scheduledStartTime).trim(),
    scheduledEndTime: toStringValue(payload.scheduledEndTime).trim(),
    status: toStringValue(payload.status).trim() || "requested",
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

function mapCustomerAccountProfileDocument(
  customerId: string,
  payload: Record<string, unknown>
): FirebaseCustomerAccountProfile {
  return {
    customerId,
    name: toStringValue(payload.name).trim(),
    email: toStringValue(payload.email).trim(),
    profileImageUrl: toHttpImageUrl(payload.profileImageUrl),
    updatedAtIso:
      toIsoString(payload.updatedAtIso) ||
      toIsoString(payload.updatedAt) ||
      new Date().toISOString(),
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

function mapAdminClientAddressDocument(
  customerId: string,
  payload: Record<string, unknown>
): FirebaseCustomerAddress | null {
  const address = mapAddressDocument(customerId, payload);
  const hasStructuredAddress = [
    address.zipCode,
    address.street,
    address.number,
    address.district,
    address.city,
    address.state,
    address.complement,
  ].some((value) => Boolean(value.trim()));

  if (!hasStructuredAddress) {
    return null;
  }

  return address;
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

async function readAdminDogsByCustomerId(customerId: string): Promise<FirebaseCustomerPet[]> {
  try {
    const adminDogsQuery = query(
      collection(getDb(), firebaseCustomerProfileAdapter.adminDogsCollection),
      where("ownerCustomerId", "==", customerId),
      limit(40)
    );
    const adminDogsSnapshot = await getDocs(adminDogsQuery);

    return adminDogsSnapshot.docs
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
          animalType: pet.animalType,
          species: pet.animalType,
          breed: pet.breed,
          age: pet.age,
          weight: normalizePetWeight(pet.weight),
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
    return rootPets;
  }

  const adminDogs = await readAdminDogsByCustomerId(customerId);
  if (adminDogs.length) {
    await migratePetsIntoCustomerSubcollection(customerId, adminDogs);
    return adminDogs;
  }

  return [];
}

export async function createCustomerPet(
  input: CreateCustomerPetInput
): Promise<FirebaseCustomerPet> {
  const nowIso = new Date().toISOString();
  const normalizedAnimalType = normalizeAnimalType(input.animalType);
  const normalizedWeight = normalizePetWeight(input.weight);
  const petCollectionRef = customerCollectionRef(
    input.customerId,
    firebaseCustomerProfileAdapter.petsCollection
  );

  const createdPetRef = await addDoc(petCollectionRef, {
    customerId: input.customerId,
    name: input.name.trim(),
    animalType: normalizedAnimalType,
    species: normalizedAnimalType,
    breed: input.breed.trim(),
    age: Math.round(input.age),
    weight: normalizedWeight,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  });

  await mirrorPetToAdminDogsCollection({
    customerId: input.customerId,
    petMirrorId: `${input.customerId}_${createdPetRef.id}`,
    name: input.name.trim(),
    animalType: normalizedAnimalType,
    breed: input.breed.trim(),
    age: Math.round(input.age),
    weight: normalizedWeight,
  });

  return {
    id: createdPetRef.id,
    customerId: input.customerId,
    name: input.name.trim(),
    animalType: normalizedAnimalType,
    breed: input.breed.trim(),
    age: Math.round(input.age),
    weight: normalizedWeight,
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

export async function readCustomerAppointments(
  customerId: string
): Promise<FirebaseCustomerAppointment[]> {
  const appointmentsSnapshot = await getDocs(
    query(
      collection(getDb(), firebaseCustomerProfileAdapter.appointmentsCollection),
      where("customerId", "==", customerId),
      limit(30)
    )
  );

  return appointmentsSnapshot.docs
    .map((snapshot) => {
      const payload = snapshot.data();
      if (!isRecord(payload)) {
        return null;
      }

      return mapAppointmentDocument(snapshot.id, customerId, payload);
    })
    .filter((appointment): appointment is FirebaseCustomerAppointment => appointment !== null)
    .sort((left, right) => right.scheduledStartIso.localeCompare(left.scheduledStartIso));
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

export async function readCustomerAccountProfile(
  customerId: string
): Promise<FirebaseCustomerAccountProfile | null> {
  const profileRef = doc(
    getDb(),
    firebaseCustomerProfileAdapter.customersCollection,
    customerId
  );

  try {
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      return null;
    }

    const payload = profileSnapshot.data();
    if (!isRecord(payload)) {
      return null;
    }

    return mapCustomerAccountProfileDocument(customerId, payload);
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return null;
    }

    throw error;
  }
}

export async function readCustomerAddress(
  customerId: string
): Promise<FirebaseCustomerAddress | null> {
  const db = getDb();
  const addressRef = doc(
    db,
    firebaseCustomerProfileAdapter.customersCollection,
    customerId,
    firebaseCustomerProfileAdapter.addressesCollection,
    firebaseCustomerProfileAdapter.defaultAddressDocId
  );

  const addressSnapshot = await getDoc(addressRef);
  if (addressSnapshot.exists()) {
    const payload = addressSnapshot.data();
    if (!isRecord(payload)) {
      return null;
    }

    return mapAddressDocument(customerId, payload);
  }

  try {
    const adminClientRef = doc(
      db,
      firebaseCustomerProfileAdapter.adminClientsCollection,
      customerId
    );
    const adminClientSnapshot = await getDoc(adminClientRef);
    if (!adminClientSnapshot.exists()) {
      return null;
    }

    const adminPayload = adminClientSnapshot.data();
    if (!isRecord(adminPayload)) {
      return null;
    }

    const mirroredAddress = mapAdminClientAddressDocument(customerId, adminPayload);
    if (!mirroredAddress) {
      return null;
    }

    await setDoc(
      addressRef,
      {
        customerId,
        zipCode: mirroredAddress.zipCode,
        street: mirroredAddress.street,
        number: mirroredAddress.number,
        district: mirroredAddress.district,
        city: mirroredAddress.city,
        state: mirroredAddress.state,
        complement: mirroredAddress.complement,
        updatedAt: serverTimestamp(),
        updatedAtIso: mirroredAddress.updatedAtIso,
        source: "admin-clients-mirror",
      },
      { merge: true }
    );

    return mirroredAddress;
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return null;
    }

    throw error;
  }
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
    zipCode: input.zipCode.trim(),
    street: input.street.trim(),
    number: input.number.trim(),
    district: input.district.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    complement: input.complement.trim(),
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
