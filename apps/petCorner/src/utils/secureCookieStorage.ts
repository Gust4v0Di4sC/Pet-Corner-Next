import type { StateStorage } from "zustand/middleware";

type CookieSameSite = "Strict" | "Lax" | "None";

type CookieWriteOptions = {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: CookieSameSite;
};

type CookieStateStorageOptions = CookieWriteOptions & {
  chunked?: boolean;
  resolveMaxAgeSeconds?: (value: string) => number | undefined;
};

const DEFAULT_COOKIE_PATH = "/";
const DEFAULT_SAME_SITE: CookieSameSite = "Strict";
const COOKIE_CHUNK_SIZE = 3000;

const canUseDocumentCookie = (): boolean =>
  typeof document !== "undefined" && typeof document.cookie === "string";

const shouldUseSecureCookie = (): boolean =>
  typeof window !== "undefined" && window.location.protocol === "https:";

const encodeCookiePart = (value: string): string => encodeURIComponent(value);

const decodeCookiePart = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export function getCookieValue(name: string): string | null {
  if (!canUseDocumentCookie()) {
    return null;
  }

  const encodedName = `${encodeCookiePart(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(encodedName));

  if (!cookie) {
    return null;
  }

  return decodeCookiePart(cookie.slice(encodedName.length));
}

export function setCookieValue(
  name: string,
  value: string,
  options: CookieWriteOptions = {}
): void {
  if (!canUseDocumentCookie()) {
    return;
  }

  const attributes = [
    `${encodeCookiePart(name)}=${encodeCookiePart(value)}`,
    `Path=${options.path ?? DEFAULT_COOKIE_PATH}`,
    `SameSite=${options.sameSite ?? DEFAULT_SAME_SITE}`,
  ];

  if (typeof options.maxAgeSeconds === "number") {
    attributes.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`);
  }

  if (shouldUseSecureCookie()) {
    attributes.push("Secure");
  }

  document.cookie = attributes.join("; ");
}

export function removeCookieValue(name: string, path = DEFAULT_COOKIE_PATH): void {
  setCookieValue(name, "", { maxAgeSeconds: 0, path });
}

const getChunkCountCookieName = (name: string): string => `${name}.chunks`;
const getChunkCookieName = (name: string, index: number): string => `${name}.${index}`;

export function getChunkedCookieValue(name: string): string | null {
  const rawChunkCount = getCookieValue(getChunkCountCookieName(name));
  const chunkCount = rawChunkCount ? Number(rawChunkCount) : 0;

  if (!Number.isInteger(chunkCount) || chunkCount <= 0) {
    return getCookieValue(name);
  }

  const chunks: string[] = [];

  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = getCookieValue(getChunkCookieName(name, index));

    if (chunk === null) {
      removeChunkedCookieValue(name);
      return null;
    }

    chunks.push(chunk);
  }

  return chunks.join("");
}

export function setChunkedCookieValue(
  name: string,
  value: string,
  options: CookieWriteOptions = {}
): void {
  removeChunkedCookieValue(name, options.path);

  if (value.length <= COOKIE_CHUNK_SIZE) {
    setCookieValue(name, value, options);
    return;
  }

  const chunkCount = Math.ceil(value.length / COOKIE_CHUNK_SIZE);
  setCookieValue(getChunkCountCookieName(name), String(chunkCount), options);

  for (let index = 0; index < chunkCount; index += 1) {
    setCookieValue(
      getChunkCookieName(name, index),
      value.slice(index * COOKIE_CHUNK_SIZE, (index + 1) * COOKIE_CHUNK_SIZE),
      options
    );
  }
}

export function removeChunkedCookieValue(
  name: string,
  path = DEFAULT_COOKIE_PATH
): void {
  const rawChunkCount = getCookieValue(getChunkCountCookieName(name));
  const chunkCount = rawChunkCount ? Number(rawChunkCount) : 0;

  removeCookieValue(name, path);
  removeCookieValue(getChunkCountCookieName(name), path);

  if (!Number.isInteger(chunkCount) || chunkCount <= 0) {
    return;
  }

  for (let index = 0; index < chunkCount; index += 1) {
    removeCookieValue(getChunkCookieName(name, index), path);
  }
}

export function readJsonCookie<T>(name: string): T | null {
  const rawValue = getCookieValue(name);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    removeCookieValue(name);
    return null;
  }
}

export function writeJsonCookie(
  name: string,
  value: unknown,
  options: CookieWriteOptions = {}
): void {
  setCookieValue(name, JSON.stringify(value), options);
}

export function removeLegacyLocalStorageItem(key: string): void {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

export function readLegacyLocalStorageJson<T>(key: string): T | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    removeLegacyLocalStorageItem(key);
    return null;
  }
}

export function createCookieStateStorage(
  options: CookieStateStorageOptions = {}
): StateStorage {
  return {
    getItem: (name) => (options.chunked ? getChunkedCookieValue(name) : getCookieValue(name)),
    setItem: (name, value) => {
      const maxAgeSeconds = options.resolveMaxAgeSeconds?.(value) ?? options.maxAgeSeconds;

      if (typeof maxAgeSeconds === "number" && maxAgeSeconds <= 0) {
        if (options.chunked) {
          removeChunkedCookieValue(name, options.path);
          return;
        }

        removeCookieValue(name, options.path);
        return;
      }

      const writeCookieValue = options.chunked ? setChunkedCookieValue : setCookieValue;

      writeCookieValue(name, value, {
        maxAgeSeconds,
        path: options.path,
        sameSite: options.sameSite,
      });
    },
    removeItem: (name) =>
      options.chunked
        ? removeChunkedCookieValue(name, options.path)
        : removeCookieValue(name, options.path),
  };
}
