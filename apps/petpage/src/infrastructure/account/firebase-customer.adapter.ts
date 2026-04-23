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
};

async function upsertAdminClientMirror(input: UpsertAdminClientMirrorInput): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const mirrorRef = doc(db, firebaseCustomerAdapter.adminClientCollection, input.customerId);

  await setDoc(
    mirrorRef,
    {
      ownerCustomerId: input.customerId,
      name: input.name,
      email: input.email,
      phone: 0,
      address: "",
      age: Timestamp.fromDate(new Date()),
      source: "petpage",
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function upsertCustomerProfile(input: UpsertCustomerProfileInput): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const customerRef = doc(db, firebaseCustomerAdapter.collection, input.customerId);
  const now = new Date().toISOString();
  const normalizedName = input.name || "Cliente Pet Corner";
  const normalizedEmail = input.email.trim();

  await setDoc(
    customerRef,
    {
      customerId: input.customerId,
      email: normalizedEmail,
      name: normalizedName,
      provider: input.provider || "unknown",
      updatedAt: serverTimestamp(),
      updatedAtIso: now,
    },
    { merge: true }
  );

  await upsertAdminClientMirror({
    customerId: input.customerId,
    name: normalizedName,
    email: normalizedEmail,
  });
}
