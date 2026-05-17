import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { NavigateFunction } from "react-router-dom";
import { getFirebaseAuth } from "../../firebase";
import {
  clearPersistedSession,
  getPersistedSessionStatus,
} from "../../services/adminAuthSessionService";
import { signOutAndClearSession } from "../../services/adminAuthorizationService";
import type { AuthUser } from "../../types/Auth";
import { AUTH_QUERY_KEY } from "./adminAuthQuery";

const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

export function useAdminSessionExpiryWatcher(
  queryClient: QueryClient,
  navigate: NavigateFunction
) {
  useEffect(() => {
    let isDisposed = false;
    const intervalId = window.setInterval(() => {
      void (async () => {
        const auth = await getFirebaseAuth();

        if (!auth.currentUser) {
          clearPersistedSession();
          return;
        }

        if (getPersistedSessionStatus() !== "expired") {
          return;
        }

        await signOutAndClearSession(auth);

        if (!isDisposed) {
          queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, null);
          navigate("/", { replace: true });
        }
      })();
    }, SESSION_CHECK_INTERVAL_MS);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, [navigate, queryClient]);
}
