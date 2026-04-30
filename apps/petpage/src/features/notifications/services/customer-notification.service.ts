"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseApp } from "@/lib/auth/firebase-auth.adapter";

export type CustomerNotificationCategory =
  | "cart"
  | "profile"
  | "order"
  | "security"
  | "system";

export type CustomerNotification = {
  id: string;
  title: string;
  message: string;
  category: CustomerNotificationCategory;
  linkHref?: string;
  isRead: boolean;
  createdAtIso: string;
};

type CreateCustomerNotificationInput = {
  customerId: string;
  title: string;
  message: string;
  category?: CustomerNotificationCategory;
  linkHref?: string;
};

type CreateAdminBroadcastNotificationInput = {
  title: string;
  message: string;
  category?: CustomerNotificationCategory;
  actorCustomerId?: string;
  actorEmail?: string;
};

type RawCustomerNotificationRecord = {
  title?: unknown;
  message?: unknown;
  category?: unknown;
  linkHref?: unknown;
  isRead?: unknown;
  createdAt?: unknown;
  createdAtIso?: unknown;
};

type NotificationSubscriptionHandlers = {
  onData: (notifications: CustomerNotification[]) => void;
  onError?: (error: FirestoreError) => void;
};

const CUSTOMER_NOTIFICATIONS_SUBCOLLECTION = "notifications";
const ADMIN_NOTIFICATIONS_COLLECTION = "adminNotifications";
const DEFAULT_CATEGORY: CustomerNotificationCategory = "system";

function getDb() {
  return getFirestore(getFirebaseApp());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
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

function normalizeHttpPath(value: string): string | undefined {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedValue.startsWith("/")) {
    return normalizedValue;
  }

  return undefined;
}

function toCategory(value: unknown): CustomerNotificationCategory {
  const normalizedValue = toStringValue(value).trim().toLowerCase();

  if (
    normalizedValue === "cart" ||
    normalizedValue === "profile" ||
    normalizedValue === "order" ||
    normalizedValue === "security" ||
    normalizedValue === "system"
  ) {
    return normalizedValue;
  }

  return DEFAULT_CATEGORY;
}

function mapCustomerNotificationRecord(
  notificationId: string,
  payload: unknown
): CustomerNotification | null {
  if (!isRecord(payload)) {
    return null;
  }

  const record = payload as RawCustomerNotificationRecord;
  const title = toStringValue(record.title).trim();
  const message = toStringValue(record.message).trim();

  if (!title || !message) {
    return null;
  }

  return {
    id: notificationId,
    title,
    message,
    category: toCategory(record.category),
    linkHref: normalizeHttpPath(toStringValue(record.linkHref)),
    isRead: Boolean(record.isRead),
    createdAtIso:
      toIsoString(record.createdAtIso) ||
      toIsoString(record.createdAt) ||
      new Date().toISOString(),
  };
}

function customerNotificationsCollectionRef(customerId: string) {
  return collection(
    getDb(),
    "customers",
    customerId,
    CUSTOMER_NOTIFICATIONS_SUBCOLLECTION
  );
}

function normalizeCustomerId(customerId: string): string {
  return customerId.trim();
}

function toSafeTitle(value: string): string {
  return value.trim().slice(0, 140);
}

function toSafeMessage(value: string): string {
  return value.trim().slice(0, 420);
}

export function subscribeCustomerNotifications(
  customerId: string,
  handlers: NotificationSubscriptionHandlers
): Unsubscribe {
  const normalizedCustomerId = normalizeCustomerId(customerId);
  if (!normalizedCustomerId) {
    handlers.onData([]);
    return () => {
      return;
    };
  }

  const notificationsQuery = query(
    customerNotificationsCollectionRef(normalizedCustomerId),
    orderBy("createdAt", "desc"),
    limit(30)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((documentSnapshot) =>
          mapCustomerNotificationRecord(documentSnapshot.id, documentSnapshot.data())
        )
        .filter((notification): notification is CustomerNotification => notification !== null);

      handlers.onData(notifications);
    },
    (error) => {
      handlers.onError?.(error);
    }
  );
}

export async function listCustomerNotifications(customerId: string): Promise<CustomerNotification[]> {
  const normalizedCustomerId = normalizeCustomerId(customerId);
  if (!normalizedCustomerId) {
    return [];
  }

  const notificationsQuery = query(
    customerNotificationsCollectionRef(normalizedCustomerId),
    orderBy("createdAt", "desc"),
    limit(30)
  );
  const snapshot = await getDocs(notificationsQuery);

  return snapshot.docs
    .map((documentSnapshot) =>
      mapCustomerNotificationRecord(documentSnapshot.id, documentSnapshot.data())
    )
    .filter((notification): notification is CustomerNotification => notification !== null);
}

export async function markCustomerNotificationAsRead(
  customerId: string,
  notificationId: string
): Promise<void> {
  const normalizedCustomerId = normalizeCustomerId(customerId);
  const normalizedNotificationId = notificationId.trim();

  if (!normalizedCustomerId || !normalizedNotificationId) {
    return;
  }

  const notificationRef = doc(
    getDb(),
    "customers",
    normalizedCustomerId,
    CUSTOMER_NOTIFICATIONS_SUBCOLLECTION,
    normalizedNotificationId
  );

  await setDoc(
    notificationRef,
    {
      isRead: true,
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedAtIso: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function markAllCustomerNotificationsAsRead(customerId: string): Promise<void> {
  const normalizedCustomerId = normalizeCustomerId(customerId);
  if (!normalizedCustomerId) {
    return;
  }

  const unreadNotificationsQuery = query(
    customerNotificationsCollectionRef(normalizedCustomerId),
    where("isRead", "==", false),
    limit(50)
  );
  const unreadNotificationsSnapshot = await getDocs(unreadNotificationsQuery);

  if (!unreadNotificationsSnapshot.docs.length) {
    return;
  }

  const db = getDb();
  const batch = writeBatch(db);
  const nowIso = new Date().toISOString();

  unreadNotificationsSnapshot.docs.forEach((documentSnapshot) => {
    batch.set(
      documentSnapshot.ref,
      {
        isRead: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedAtIso: nowIso,
      },
      { merge: true }
    );
  });

  await batch.commit();
}

export async function createCustomerNotification(
  input: CreateCustomerNotificationInput
): Promise<void> {
  const normalizedCustomerId = normalizeCustomerId(input.customerId);
  const title = toSafeTitle(input.title);
  const message = toSafeMessage(input.message);

  if (!normalizedCustomerId || !title || !message) {
    return;
  }

  await addDoc(customerNotificationsCollectionRef(normalizedCustomerId), {
    customerId: normalizedCustomerId,
    title,
    message,
    category: input.category || DEFAULT_CATEGORY,
    linkHref: normalizeHttpPath(input.linkHref || "") || "",
    isRead: false,
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString(),
  });
}

export async function createAdminBroadcastNotification(
  input: CreateAdminBroadcastNotificationInput
): Promise<void> {
  const title = toSafeTitle(input.title);
  const message = toSafeMessage(input.message);

  if (!title || !message) {
    return;
  }

  await addDoc(collection(getDb(), ADMIN_NOTIFICATIONS_COLLECTION), {
    title,
    message,
    category: input.category || DEFAULT_CATEGORY,
    isRead: false,
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString(),
    actorCustomerId: toStringValue(input.actorCustomerId).trim(),
    actorEmail: toStringValue(input.actorEmail).trim(),
    source: "petpage",
  });
}
