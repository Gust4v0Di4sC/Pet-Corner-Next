"use client";

import { doc, getFirestore, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { getFirebaseApp } from "@/infrastructure/auth/firebase-auth.adapter";

export type FirebaseCustomerAdapter = {
  provider: "firestore";
  collection: "customers";
  adminClientCollection: "clientes";
};

export type UpsertCustomerProfileInput = {
  customerId: string;
  email: string;
  name?: string;
  profileImageUrl?: string;
  provider?: "password" | "google.com" | "microsoft.com" | "unknown";
};

export const firebaseCustomerAdapter: FirebaseCustomerAdapter = {
  provider: "firestore",
  collection: "customers",
  adminClientCollection: "clientes",
};

type UpsertAdminClientMirrorInput = {
  customerId: string;
  name: string;
  email: string;
  profileImageUrl?: string;
};

type UpdateCustomerProfileImageInput = {
  customerId: string;
  profileImageUrl: string;
};

function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (error as { code?: unknown }).code === "permission-denied";
}

function normalizeHttpImageUrl(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error("Informe uma URL valida para a foto de perfil.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new Error("A URL da foto de perfil e invalida.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("A URL da foto de perfil deve usar HTTP ou HTTPS.");
  }

  return parsedUrl.toString();
}

async function upsertAdminClientMirror(input: UpsertAdminClientMirrorInput): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const mirrorRef = doc(db, firebaseCustomerAdapter.adminClientCollection, input.customerId);
  const payload: Record<string, unknown> = {
    ownerCustomerId: input.customerId,
    name: input.name,
    email: input.email,
    phone: 0,
    address: "",
    age: Timestamp.fromDate(new Date()),
    source: "petpage",
    updatedAt: serverTimestamp(),
    updatedAtIso: new Date().toISOString(),
  };

  if (typeof input.profileImageUrl === "string") {
    payload.profileImageUrl = normalizeHttpImageUrl(input.profileImageUrl);
  }

  await setDoc(mirrorRef, payload, { merge: true });
}

export async function upsertCustomerProfile(input: UpsertCustomerProfileInput): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const customerRef = doc(db, firebaseCustomerAdapter.collection, input.customerId);
  const now = new Date().toISOString();
  const normalizedName = input.name || "Cliente Pet Corner";
  const normalizedEmail = input.email.trim();
  const payload: Record<string, unknown> = {
    customerId: input.customerId,
    email: normalizedEmail,
    name: normalizedName,
    provider: input.provider || "unknown",
    updatedAt: serverTimestamp(),
    updatedAtIso: now,
  };

  if (typeof input.profileImageUrl === "string") {
    payload.profileImageUrl = normalizeHttpImageUrl(input.profileImageUrl);
  }

  await setDoc(customerRef, payload, { merge: true });

  await upsertAdminClientMirror({
    customerId: input.customerId,
    name: normalizedName,
    email: normalizedEmail,
    profileImageUrl: input.profileImageUrl,
  });
}

export async function updateCustomerProfileImage(
  input: UpdateCustomerProfileImageInput
): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const customerRef = doc(db, firebaseCustomerAdapter.collection, input.customerId);
  const mirrorRef = doc(db, firebaseCustomerAdapter.adminClientCollection, input.customerId);
  const normalizedProfileImageUrl = normalizeHttpImageUrl(input.profileImageUrl);
  const now = new Date().toISOString();

  await setDoc(
    customerRef,
    {
      customerId: input.customerId,
      profileImageUrl: normalizedProfileImageUrl,
      updatedAt: serverTimestamp(),
      updatedAtIso: now,
    },
    { merge: true }
  );

  try {
    await setDoc(
      mirrorRef,
      {
        ownerCustomerId: input.customerId,
        profileImageUrl: normalizedProfileImageUrl,
        source: "petpage",
        updatedAt: serverTimestamp(),
        updatedAtIso: now,
      },
      { merge: true }
    );
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return;
    }

    throw error;
  }
}
