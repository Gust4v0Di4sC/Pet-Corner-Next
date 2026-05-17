import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SESSION_TTL_MS } from "../config/sessionConfig";
import type { AuthStoreState, TokenPayload } from "../types/Auth";
import {
  createCookieStateStorage,
  removeLegacyLocalStorageItem,
} from "../utils/secureCookieStorage";

const toMillis = (expiresIn: number | string) => Number(expiresIn) * 1000;
const AUTH_TOKENS_STORAGE_KEY = "auth-tokens";
const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

const resolveAuthTokenMaxAgeSeconds = (value: string): number | undefined => {
  try {
    const persisted = JSON.parse(value) as {
      state?: { tokens?: { expiresAt?: unknown } | null };
    };
    const expiresAt = persisted.state?.tokens?.expiresAt;

    if (typeof expiresAt !== "number") {
      return 0;
    }

    return Math.ceil((expiresAt - Date.now()) / 1000);
  } catch {
    return 0;
  }
};

removeLegacyLocalStorageItem(AUTH_TOKENS_STORAGE_KEY);

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      tokens: null,
      isRefreshing: false,
      setSession: ({ idToken, refreshToken, expiresIn }: TokenPayload) =>
        set({
          tokens: {
            idToken,
            refreshToken,
            expiresAt: Date.now() + toMillis(expiresIn),
          },
          isRefreshing: false,
        }),
      clearSession: () => set({ tokens: null, isRefreshing: false }),
      setRefreshing: (value) => set({ isRefreshing: value }),
      hasValidToken: () => {
        const tokens = get().tokens;
        if (!tokens) return false;
        return tokens.expiresAt > Date.now();
      },
    }),
    {
      name: AUTH_TOKENS_STORAGE_KEY,
      storage: createJSONStorage(() =>
        createCookieStateStorage({
          chunked: true,
          maxAgeSeconds: SESSION_TTL_SECONDS,
          resolveMaxAgeSeconds: resolveAuthTokenMaxAgeSeconds,
        })
      ),
      // Persist only the tokens; flags are recreated in memory.
      partialize: (state) => ({ tokens: state.tokens }),
    }
  )
);
