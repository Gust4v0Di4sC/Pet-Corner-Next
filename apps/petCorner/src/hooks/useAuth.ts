import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { DASHBOARD_ROUTE } from "../components/Dashboard/dashboard.domain";
import { getFirebaseAuth, googleProvider, microsoftProvider } from "../firebase";
import { AdminAccessError, hasAdminAccess } from "../services/adminService";
import type { AuthHookReturn, AuthUser, EmailCredentials } from "../types/Auth";

const AUTH_QUERY_KEY = ["auth", "user"] as const;

const mapFirebaseUser = (user: FirebaseUser | null): AuthUser | null =>
  user ? { uid: user.uid, email: user.email, isAdmin: true } : null;

async function resolveAuthorizedUser(
  auth: Auth,
  firebaseUser: FirebaseUser | null,
  options?: { forceRefresh?: boolean; throwOnDenied?: boolean }
): Promise<AuthUser | null> {
  if (!firebaseUser) {
    return null;
  }

  try {
    const isAdmin = await hasAdminAccess(firebaseUser, options?.forceRefresh === true);

    if (!isAdmin) {
      await signOut(auth);

      if (options?.throwOnDenied) {
        throw new AdminAccessError();
      }

      return null;
    }

    return mapFirebaseUser(firebaseUser);
  } catch (error) {
    await signOut(auth).catch(() => undefined);

    if (error instanceof AdminAccessError) {
      throw error;
    }

    throw error;
  }
}

const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const auth = await getFirebaseAuth();
  const current = await resolveAuthorizedUser(auth, auth.currentUser, {
    forceRefresh: true,
  });

  if (current) {
    return current;
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        unsubscribe();
        resolveAuthorizedUser(auth, firebaseUser).then(resolve).catch(reject);
      },
      reject
    );
  });
};

export const useAuth = (): AuthHookReturn => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });

  useEffect(() => {
    let isDisposed = false;
    let unsubscribe: (() => void) | undefined;

    getFirebaseAuth().then((auth) => {
      if (isDisposed) {
        return;
      }

      const syncAuthorizedUser = async (firebaseUser: FirebaseUser | null) => {
        try {
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

  const loginMutation = useMutation<boolean, Error, EmailCredentials>({
    mutationFn: async ({ email, password }) => {
      const auth = await getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const authorizedUser = await resolveAuthorizedUser(auth, credential.user, {
        forceRefresh: true,
        throwOnDenied: true,
      });

      queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, authorizedUser);
      return true;
    },
    onSuccess: () => {
      navigate(DASHBOARD_ROUTE);
    },
  });

  const loginWithGoogleMutation = useMutation<boolean, Error, void>({
    mutationFn: async () => {
      const auth = await getFirebaseAuth();
      const credential = await signInWithPopup(auth, googleProvider);
      const authorizedUser = await resolveAuthorizedUser(auth, credential.user, {
        forceRefresh: true,
        throwOnDenied: true,
      });

      queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, authorizedUser);
      return true;
    },
    onSuccess: () => {
      navigate(DASHBOARD_ROUTE);
    },
  });

  const loginWithMicrosoftMutation = useMutation<boolean, Error, void>({
    mutationFn: async () => {
      const auth = await getFirebaseAuth();
      const credential = await signInWithPopup(auth, microsoftProvider);
      const authorizedUser = await resolveAuthorizedUser(auth, credential.user, {
        forceRefresh: true,
        throwOnDenied: true,
      });

      queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, authorizedUser);
      return true;
    },
    onSuccess: () => {
      navigate(DASHBOARD_ROUTE);
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const auth = await getFirebaseAuth();
      await signOut(auth);
    },
    onSuccess: () => {
      queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, null);
      navigate("/");
    },
  });

  const login: AuthHookReturn["login"] = (email, password) =>
    loginMutation.mutateAsync({ email, password });

  const loginWithGoogle: AuthHookReturn["loginWithGoogle"] = () =>
    loginWithGoogleMutation.mutateAsync();

  const loginWithMicrosoft: AuthHookReturn["loginWithMicrosoft"] = () =>
    loginWithMicrosoftMutation.mutateAsync();

  const logout: AuthHookReturn["logout"] = () => logoutMutation.mutateAsync();

  const setUser: AuthHookReturn["setUser"] = (updater) => {
    queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, (current) =>
      typeof updater === "function" ? updater(current ?? null) : updater
    );
  };

  return {
    user: user ?? null,
    isLoading,
    login,
    loginWithGoogle,
    loginWithMicrosoft,
    logout,
    setUser,
  };
};
