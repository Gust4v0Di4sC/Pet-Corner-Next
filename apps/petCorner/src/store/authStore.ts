import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthStoreState, TokenPayload } from "../types/Auth";

const toMillis = (expiresIn: number | string) => Number(expiresIn) * 1000;

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
      name: "auth-tokens",
      storage: createJSONStorage(() => localStorage),
      // Persist only the tokens; flags are recreated in memory
      partialize: (state) => ({ tokens: state.tokens }),
    }
  )
);
