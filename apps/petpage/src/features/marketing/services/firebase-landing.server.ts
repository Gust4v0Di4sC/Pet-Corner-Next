import "server-only";

import { getFirebaseServerFirestore } from "@/lib/firebase/firebase-server";
import type {
  LandingProductRecord,
  LandingServiceRecord,
  LandingTestimonialRecord,
} from "@/features/marketing/services/landing-content.mapper";

type FirestoreRecord = Record<string, unknown>;

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

function isFirestoreRecord(payload: unknown): payload is FirestoreRecord {
  return typeof payload === "object" && payload !== null;
}

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

type ReadCollectionOptions = {
  limitCount?: number;
};

export async function readLandingProductsServer(
  options: ReadCollectionOptions = {}
): Promise<LandingProductRecord[]> {
  const normalizedLimit = normalizeLimit(options.limitCount);
  const productsQuery = normalizedLimit
    ? getFirebaseServerFirestore().collection("prods").limit(normalizedLimit)
    : getFirebaseServerFirestore().collection("prods");
  const snapshot = await productsQuery.get();

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

export async function readLandingProductByIdServer(
  productId: string
): Promise<LandingProductRecord | null> {
  const normalizedId = productId.trim();
  if (!normalizedId) {
    return null;
  }

  const snapshot = await getFirebaseServerFirestore().collection("prods").doc(normalizedId).get();
  if (!snapshot.exists) {
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

export async function readLandingServicesServer(
  options: ReadCollectionOptions = {}
): Promise<LandingServiceRecord[]> {
  const normalizedLimit = normalizeLimit(options.limitCount);
  const servicesQuery = normalizedLimit
    ? getFirebaseServerFirestore().collection("services").limit(normalizedLimit)
    : getFirebaseServerFirestore().collection("services");
  const snapshot = await servicesQuery.get();

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

export async function readLandingServiceByIdServer(
  serviceId: string
): Promise<LandingServiceRecord | null> {
  const normalizedId = serviceId.trim();
  if (!normalizedId) {
    return null;
  }

  const snapshot = await getFirebaseServerFirestore().collection("services").doc(normalizedId).get();
  if (!snapshot.exists) {
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

export async function readLandingTestimonialsServer(): Promise<LandingTestimonialRecord[]> {
  const snapshot = await getFirebaseServerFirestore()
    .collection("testimonials")
    .limit(20)
    .get();

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
