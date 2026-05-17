import { useEffect } from "react";
import { onAuthStateChanged, type Auth, type User as FirebaseUser } from "firebase/auth";
import type { QueryClient } from "@tanstack/react-query";
import { getFirebaseAuth } from "../../firebase";
import {
  clearPersistedSession,
  getPersistedSessionStatus,
} from "../../services/adminAuthSessionService";
import {
  resolveAuthorizedUser,
  signOutAndClearSession,
} from "../../services/adminAuthorizationService";
import type { AuthUser } from "../../types/Auth";
import { AUTH_QUERY_KEY } from "./adminAuthQuery";

export function useAdminAuthStateSubscription(queryClient: QueryClient) {
  useEffect(() => {
    let isDisposed = false;
    let unsubscribe: (() => void) | undefined;

    getFirebaseAuth().then((auth: Auth) => {
      if (isDisposed) {
        return;
      }

      const syncAuthorizedUser = async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser && getPersistedSessionStatus() === "expired") {
            await signOutAndClearSession(auth);

            if (!isDisposed) {
              queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, null);
            }

            return;
          }

          if (!firebaseUser) {
            clearPersistedSession();
          }

          const nextUser = await resolveAuthorizedUser(auth, firebaseUser);

          if (!isDisposed) {
            queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, nextUser);
          }
        } catch {
          if (!isDisposed) {
            queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, null);
          }
        }
      };

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        void syncAuthorizedUser(firebaseUser);
      });
    });

    return () => {
      isDisposed = true;
      unsubscribe?.();
    };
  }, [queryClient]);
}
