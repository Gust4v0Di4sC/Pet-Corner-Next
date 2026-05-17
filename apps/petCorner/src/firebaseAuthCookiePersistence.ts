import type { Persistence } from "firebase/auth";

import { SESSION_TTL_MS } from "./config/sessionConfig";
import {
  getChunkedCookieValue,
  removeChunkedCookieValue,
  removeLegacyLocalStorageItem,
  setChunkedCookieValue,
} from "./utils/secureCookieStorage";

type FirebasePersistenceValue = Record<string, unknown> | string;
type FirebaseStorageListener = (value: FirebasePersistenceValue | null) => void;

type FirebaseCookiePersistence = Persistence & {
  _isAvailable: () => Promise<boolean>;
  _set: (key: string, value: FirebasePersistenceValue) => Promise<void>;
  _get: <T extends FirebasePersistenceValue>(key: string) => Promise<T | null>;
  _remove: (key: string) => Promise<void>;
  _addListener: (key: string, listener: FirebaseStorageListener) => void;
  _removeListener: (key: string, listener: FirebaseStorageListener) => void;
  _shouldAllowMigration: boolean;
};

const FIREBASE_AUTH_COOKIE_PREFIX = "petcorner.firebase.auth";
const FIREBASE_AUTH_INDEXED_DB = "firebaseLocalStorageDb";
const FIREBASE_AUTH_LOCAL_STORAGE_PREFIX = "firebase:";
const POLLING_INTERVAL_MS = 1000;
const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

let legacyStorageCleanupPromise: Promise<void> | null = null;

const canUseBrowserStorage = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined";

const toBase64Url = (value: string): string => {
  if (typeof btoa === "undefined") {
    return value.replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const toCookieName = (key: string): string =>
  `${FIREBASE_AUTH_COOKIE_PREFIX}.${toBase64Url(key)}`;

const serializeValue = (value: FirebasePersistenceValue): string => JSON.stringify(value);

const parseValue = <T extends FirebasePersistenceValue>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export function createFirebaseAuthCookiePersistence(): Persistence {
  const listenerIntervals = new Map<FirebaseStorageListener, number>();

  const persistence: FirebaseCookiePersistence = {
    type: "LOCAL",
    _shouldAllowMigration: false,
    _isAvailable: async () =>
      canUseBrowserStorage() && (typeof navigator === "undefined" || navigator.cookieEnabled),
    _set: async (key, value) => {
      setChunkedCookieValue(toCookieName(key), serializeValue(value), {
        maxAgeSeconds: SESSION_TTL_SECONDS,
      });
    },
    _get: async <T extends FirebasePersistenceValue>(key: string) => {
      const rawValue = getChunkedCookieValue(toCookieName(key));

      if (!rawValue) {
        return null;
      }

      return parseValue<T>(rawValue);
    },
    _remove: async (key) => {
      removeChunkedCookieValue(toCookieName(key));
    },
    _addListener: (key, listener) => {
      if (typeof window === "undefined") {
        return;
      }

      let lastValue = getChunkedCookieValue(toCookieName(key));
      const interval = window.setInterval(() => {
        const currentValue = getChunkedCookieValue(toCookieName(key));

        if (currentValue === lastValue) {
          return;
        }

        lastValue = currentValue;
        listener(currentValue ? parseValue(currentValue) : null);
      }, POLLING_INTERVAL_MS);

      listenerIntervals.set(listener, interval);
    },
    _removeListener: (_key, listener) => {
      const interval = listenerIntervals.get(listener);

      if (typeof interval !== "number") {
        return;
      }

      window.clearInterval(interval);
      listenerIntervals.delete(listener);
    },
  };

  return persistence;
}

export async function clearLegacyFirebaseAuthBrowserStorage(): Promise<void> {
  if (!canUseBrowserStorage()) {
    return;
  }

  if (!legacyStorageCleanupPromise) {
    legacyStorageCleanupPromise = Promise.resolve()
      .then(() => {
        if (typeof window.localStorage === "undefined") {
          return;
        }

        Object.keys(window.localStorage)
          .filter((key) => key.startsWith(FIREBASE_AUTH_LOCAL_STORAGE_PREFIX))
          .forEach(removeLegacyLocalStorageItem);
      })
      .then(
        () =>
          new Promise<void>((resolve) => {
            if (typeof indexedDB === "undefined") {
              resolve();
              return;
            }

            const request = indexedDB.deleteDatabase(FIREBASE_AUTH_INDEXED_DB);
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
            request.onblocked = () => resolve();
          })
      );
  }

  await legacyStorageCleanupPromise;
}
