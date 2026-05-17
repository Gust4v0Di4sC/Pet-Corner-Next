import {
  LEGACY_SESSION_STORAGE_KEY,
  SESSION_COOKIE_KEY,
  SESSION_TTL_MS,
} from "../config/sessionConfig";
import {
  readJsonCookie,
  readLegacyLocalStorageJson,
  removeCookieValue,
  removeLegacyLocalStorageItem,
  writeJsonCookie,
} from "../utils/secureCookieStorage";

type PersistedAuthSession = {
  startedAt: number;
  expiresAt: number;
};

export type PersistedSessionStatus = "missing" | "valid" | "expired";

const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;
const LEGACY_AUTH_TOKENS_STORAGE_KEY = "auth-tokens";

function clearLegacyAuthTokenStorage() {
  removeLegacyLocalStorageItem(LEGACY_AUTH_TOKENS_STORAGE_KEY);
}

export function clearPersistedSession() {
  removeCookieValue(SESSION_COOKIE_KEY);
  removeLegacyLocalStorageItem(LEGACY_SESSION_STORAGE_KEY);
  clearLegacyAuthTokenStorage();
}

export function readPersistedSession(): PersistedAuthSession | null {
  const parsed =
    readJsonCookie<Partial<PersistedAuthSession>>(SESSION_COOKIE_KEY) ??
    readLegacyLocalStorageJson<Partial<PersistedAuthSession>>(LEGACY_SESSION_STORAGE_KEY);

  if (!parsed) {
    removeLegacyLocalStorageItem(LEGACY_SESSION_STORAGE_KEY);
    return null;
  }

  if (typeof parsed.startedAt !== "number" || typeof parsed.expiresAt !== "number") {
    clearPersistedSession();
    return null;
  }

  const session = {
    startedAt: parsed.startedAt,
    expiresAt: parsed.expiresAt,
  };

  writeJsonCookie(SESSION_COOKIE_KEY, session, { maxAgeSeconds: SESSION_TTL_SECONDS });
  removeLegacyLocalStorageItem(LEGACY_SESSION_STORAGE_KEY);

  return session;
}

export function persistSession(startTime = Date.now()) {
  const session: PersistedAuthSession = {
    startedAt: startTime,
    expiresAt: startTime + SESSION_TTL_MS,
  };

  writeJsonCookie(SESSION_COOKIE_KEY, session, { maxAgeSeconds: SESSION_TTL_SECONDS });
  clearLegacyAuthTokenStorage();
  removeLegacyLocalStorageItem(LEGACY_SESSION_STORAGE_KEY);
}

export function getPersistedSessionStatus(): PersistedSessionStatus {
  const persistedSession = readPersistedSession();

  if (!persistedSession) {
    return "missing";
  }

  return persistedSession.expiresAt > Date.now() ? "valid" : "expired";
}

