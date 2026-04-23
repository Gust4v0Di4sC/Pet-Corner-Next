"use client";

import { collection, doc, getDoc, getDocs, getFirestore, limit, query } from "firebase/firestore";
import { getFirebaseApp } from "@/infrastructure/auth/firebase-auth.adapter";

type FirestoreRecord = Record<string, unknown>;

type LandingProductRecord = {
  id: string;
  name: string;
  price: number;
  code: string;
  quantity: number;
  imageUrl: string;
  category: string;
  description: string;
  badge: string;
  isActive: boolean;
};

type LandingServiceRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

type LandingTestimonialRecord = {
  id: string;
  author: string;
  role: string;
  content: string;
  rating: number;
  isActive: boolean;
};

function getDb() {
  return getFirestore(getFirebaseApp());
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

function toBooleanValue(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "true" || normalizedValue === "1") {
      return true;
    }
    if (normalizedValue === "false" || normalizedValue === "0") {
      return false;
    }
  }

  return fallback;
}

function mapLandingProduct(id: string, payload: FirestoreRecord): LandingProductRecord {
  return {
    id,
    name: toStringValue(payload.name, ""),
    price: toNumberValue(payload.price, 0),
    code: toStringValue(payload.code, ""),
    quantity: toNumberValue(payload.quantity, 0),
    imageUrl: toStringValue(payload.imageUrl, ""),
    category: toStringValue(payload.category, "Loja"),
    description: toStringValue(payload.description, ""),
    badge: toStringValue(payload.badge, ""),
    isActive: toBooleanValue(payload.isActive, true),
  };
}

function mapLandingService(id: string, payload: FirestoreRecord): LandingServiceRecord {
  return {
    id,
    name: toStringValue(payload.name, ""),
    category: toStringValue(payload.category, ""),
    description: toStringValue(payload.description, ""),
    durationMinutes: toNumberValue(payload.durationMinutes, 0),
    price: toNumberValue(payload.price, 0),
    isActive: toBooleanValue(payload.isActive, true),
  };
}

function mapLandingTestimonial(id: string, payload: FirestoreRecord): LandingTestimonialRecord {
  return {
    id,
    author: toStringValue(payload.author, ""),
    role: toStringValue(payload.role, ""),
    content: toStringValue(payload.content, ""),
    rating: Math.max(1, Math.min(Math.round(toNumberValue(payload.rating, 5)), 5)),
    isActive: toBooleanValue(payload.isActive, true),
  };
}

function isFirestoreRecord(payload: unknown): payload is FirestoreRecord {
  return typeof payload === "object" && payload !== null;
}

type ReadCollectionOptions = {
  limitCount?: number;
};

function normalizeLimit(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const roundedValue = Math.round(value);
  if (roundedValue <= 0) {
    return null;
  }

  return roundedValue;
}

export async function readLandingProducts(
  options: ReadCollectionOptions = {}
): Promise<LandingProductRecord[]> {
  const productsCollection = collection(getDb(), "prods");
  const normalizedLimit = normalizeLimit(options.limitCount);
  const snapshot = normalizedLimit
    ? await getDocs(query(productsCollection, limit(normalizedLimit)))
    : await getDocs(productsCollection);

  return snapshot.docs
    .map((document) => {
      const payload = document.data();
      if (!isFirestoreRecord(payload)) {
        return null;
      }

      return mapLandingProduct(document.id, payload);
    })
    .filter((item): item is LandingProductRecord => item !== null)
    .filter((item) => item.isActive !== false && item.name.trim().length > 0);
}

export async function readLandingProductById(
  productId: string
): Promise<LandingProductRecord | null> {
  const normalizedId = productId.trim();
  if (!normalizedId) {
    return null;
  }

  const snapshot = await getDoc(doc(getDb(), "prods", normalizedId));
  if (!snapshot.exists()) {
    return null;
  }

  const payload = snapshot.data();
  if (!isFirestoreRecord(payload)) {
    return null;
  }

  const mappedProduct = mapLandingProduct(snapshot.id, payload);
  if (mappedProduct.isActive === false || mappedProduct.name.trim().length === 0) {
    return null;
  }

  return mappedProduct;
}

export async function readLandingServices(
  options: ReadCollectionOptions = {}
): Promise<LandingServiceRecord[]> {
  const servicesCollection = collection(getDb(), "services");
  const normalizedLimit = normalizeLimit(options.limitCount);
  const snapshot = normalizedLimit
    ? await getDocs(query(servicesCollection, limit(normalizedLimit)))
    : await getDocs(servicesCollection);

  return snapshot.docs
    .map((document) => {
      const payload = document.data();
      if (!isFirestoreRecord(payload)) {
        return null;
      }

      return mapLandingService(document.id, payload);
    })
    .filter((item): item is LandingServiceRecord => item !== null)
    .filter((item) => item.isActive !== false && item.name.trim().length > 0);
}

export async function readLandingServiceById(
  serviceId: string
): Promise<LandingServiceRecord | null> {
  const normalizedId = serviceId.trim();
  if (!normalizedId) {
    return null;
  }

  const snapshot = await getDoc(doc(getDb(), "services", normalizedId));
  if (!snapshot.exists()) {
    return null;
  }

  const payload = snapshot.data();
  if (!isFirestoreRecord(payload)) {
    return null;
  }

  const mappedService = mapLandingService(snapshot.id, payload);
  if (mappedService.isActive === false || mappedService.name.trim().length === 0) {
    return null;
  }

  return mappedService;
}

export async function readLandingTestimonials(): Promise<LandingTestimonialRecord[]> {
  const snapshot = await getDocs(query(collection(getDb(), "testimonials"), limit(20)));

  return snapshot.docs
    .map((document) => {
      const payload = document.data();
      if (!isFirestoreRecord(payload)) {
        return null;
      }

      return mapLandingTestimonial(document.id, payload);
    })
    .filter((item): item is LandingTestimonialRecord => item !== null)
    .filter(
      (item) =>
        item.isActive !== false &&
        item.author.trim().length > 0 &&
        item.content.trim().length > 0
    );
}

export type {
  LandingProductRecord,
  LandingServiceRecord,
  LandingTestimonialRecord,
};
