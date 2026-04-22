"use client";

import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseApp } from "@/infrastructure/auth/firebase-auth.adapter";

export type FirebaseCustomerAdapter = {
  provider: "firestore";
  collection: "customers";
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
};

export async function upsertCustomerProfile(input: UpsertCustomerProfileInput): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const customerRef = doc(db, firebaseCustomerAdapter.collection, input.customerId);
  const now = new Date().toISOString();

  await setDoc(
    customerRef,
    {
      customerId: input.customerId,
      email: input.email,
      name: input.name || "Cliente Pet Corner",
      provider: input.provider || "unknown",
      updatedAt: serverTimestamp(),
      updatedAtIso: now,
    },
    { merge: true }
  );
}
