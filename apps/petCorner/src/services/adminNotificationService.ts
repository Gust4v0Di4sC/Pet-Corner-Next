import {
  addDoc,
  collection,
  doc,
  getDocs,
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
} from "firebase/firestore";
import { getFirestoreDB } from "../firebase";

export type AdminNotificationCategory =
  | "records"
  | "catalog"
  | "order"
  | "chat"
  | "security"
  | "system";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  category: AdminNotificationCategory;
  isRead: boolean;
  createdAtIso: string;
};

type CreateAdminNotificationInput = {
  title: string;
  message: string;
  category?: AdminNotificationCategory;
  source?: "petCorner" | "petpage";
  actorCustomerId?: string;
};

type SubscribeAdminNotificationsHandlers = {
  onData: (notifications: AdminNotification[]) => void;
  onError?: (error: FirestoreError) => void;
};

type RawAdminNotificationRecord = {
  title?: unknown;
  message?: unknown;
  category?: unknown;
  isRead?: unknown;
  createdAt?: unknown;
  createdAtIso?: unknown;
};

const ADMIN_NOTIFICATIONS_COLLECTION = "adminNotifications";
const DEFAULT_CATEGORY: AdminNotificationCategory = "system";

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

function toCategory(value: unknown): AdminNotificationCategory {
  const normalizedValue = toStringValue(value).trim().toLowerCase();

  if (
    normalizedValue === "records" ||
    normalizedValue === "catalog" ||
    normalizedValue === "order" ||
    normalizedValue === "chat" ||
    normalizedValue === "security" ||
    normalizedValue === "system"
  ) {
    return normalizedValue;
  }

  return DEFAULT_CATEGORY;
}

function toSafeTitle(value: string): string {
  return value.trim().slice(0, 140);
}

function toSafeMessage(value: string): string {
  return value.trim().slice(0, 420);
}

function mapAdminNotificationRecord(
  notificationId: string,
  payload: unknown
): AdminNotification | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as RawAdminNotificationRecord;
  const title = toSafeTitle(toStringValue(record.title));
  const message = toSafeMessage(toStringValue(record.message));

  if (!title || !message) {
    return null;
  }

  return {
    id: notificationId,
    title,
    message,
    category: toCategory(record.category),
    isRead: Boolean(record.isRead),
    createdAtIso:
      toIsoString(record.createdAtIso) ||
      toIsoString(record.createdAt) ||
      new Date().toISOString(),
  };
}

export function subscribeAdminNotifications(
  handlers: SubscribeAdminNotificationsHandlers
): () => void {
  let isDisposed = false;
  let unsubscribe = () => {
    return;
  };

  void getFirestoreDB()
    .then((db) => {
      if (isDisposed) {
        return;
      }

      const notificationsQuery = query(
        collection(db, ADMIN_NOTIFICATIONS_COLLECTION),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      unsubscribe = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          const notifications = snapshot.docs
            .map((documentSnapshot) =>
              mapAdminNotificationRecord(documentSnapshot.id, documentSnapshot.data())
            )
            .filter((notification): notification is AdminNotification => notification !== null);

          handlers.onData(notifications);
        },
        (error) => {
          handlers.onError?.(error);
        }
      );
    })
    .catch((error) => {
      if (!isDisposed) {
        handlers.onError?.(error as FirestoreError);
      }
    });

  return () => {
    isDisposed = true;
    unsubscribe();
  };
}

export async function markAdminNotificationAsRead(notificationId: string): Promise<void> {
  const normalizedNotificationId = notificationId.trim();
  if (!normalizedNotificationId) {
    return;
  }

  const db = await getFirestoreDB();
  const notificationRef = doc(db, ADMIN_NOTIFICATIONS_COLLECTION, normalizedNotificationId);

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

export async function markAllAdminNotificationsAsRead(): Promise<void> {
  const db = await getFirestoreDB();
  const unreadNotificationsQuery = query(
    collection(db, ADMIN_NOTIFICATIONS_COLLECTION),
    where("isRead", "==", false),
    limit(80)
  );
  const unreadNotificationsSnapshot = await getDocs(unreadNotificationsQuery);

  if (!unreadNotificationsSnapshot.docs.length) {
    return;
  }

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

export async function createAdminNotification(
  input: CreateAdminNotificationInput
): Promise<void> {
  const title = toSafeTitle(input.title);
  const message = toSafeMessage(input.message);

  if (!title || !message) {
    return;
  }

  const db = await getFirestoreDB();

  await addDoc(collection(db, ADMIN_NOTIFICATIONS_COLLECTION), {
    title,
    message,
    category: input.category || DEFAULT_CATEGORY,
    isRead: false,
    source: input.source || "petCorner",
    actorCustomerId: toStringValue(input.actorCustomerId).trim(),
    createdAt: serverTimestamp(),
    createdAtIso: new Date().toISOString(),
  });
}
