import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type ConfirmationResult,
  type User as FirebaseUser,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { DASHBOARD_ROUTE } from "../components/Dashboard/dashboard.domain";
import { SESSION_STORAGE_KEY, SESSION_TTL_MS } from "../config/sessionConfig";
import { getFirebaseAuth, googleProvider, microsoftProvider } from "../firebase";
import { AdminAccessError, hasAdminAccess } from "../services/adminService";
import type { AuthHookReturn, AuthUser, EmailCredentials } from "../types/Auth";

const AUTH_QUERY_KEY = ["auth", "user"] as const;
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

type PersistedAuthSession = {
  startedAt: number;
  expiresAt: number;
};
type PersistedSessionStatus = "missing" | "valid" | "expired";

const canUseStorage = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const clearPersistedSession = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
};

const readPersistedSession = (): PersistedAuthSession | null => {
  if (!canUseStorage()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as Partial<PersistedAuthSession>;
    if (typeof parsed.startedAt !== "number" || typeof parsed.expiresAt !== "number") {
      clearPersistedSession();
      return null;
    }

    return {
      startedAt: parsed.startedAt,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    clearPersistedSession();
    return null;
  }
};

const persistSession = (startTime = Date.now()) => {
  if (!canUseStorage()) {
    return;
  }

  const session: PersistedAuthSession = {
    startedAt: startTime,
    expiresAt: startTime + SESSION_TTL_MS,
  };

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const getPersistedSessionStatus = (): PersistedSessionStatus => {
  const persistedSession = readPersistedSession();

  if (!persistedSession) {
    return "missing";
  }

  return persistedSession.expiresAt > Date.now() ? "valid" : "expired";
};

async function signOutAndClearSession(auth: Auth): Promise<void> {
  await signOut(auth).catch(() => undefined);
  clearPersistedSession();
}

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
      await signOutAndClearSession(auth);

      if (options?.throwOnDenied) {
        throw new AdminAccessError();
      }

      return null;
    }

    return mapFirebaseUser(firebaseUser);
  } catch (error) {
    await signOutAndClearSession(auth);

    if (error instanceof AdminAccessError) {
      throw error;
    }

    throw error;
  }
}

const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const auth = await getFirebaseAuth();

  if (!auth.currentUser) {
    clearPersistedSession();
  } else if (getPersistedSessionStatus() !== "valid") {
    await signOutAndClearSession(auth);
    return null;
  }

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

        if (firebaseUser && getPersistedSessionStatus() === "expired") {
          void signOutAndClearSession(auth).then(() => resolve(null));
          return;
        }

        if (!firebaseUser) {
          clearPersistedSession();
        }

        resolveAuthorizedUser(auth, firebaseUser).then(resolve).catch(reject);
      },
      reject
    );
  });
};

export const useAuth = (): AuthHookReturn => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const phoneRecaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });

  const clearPhoneLoginVerifier = useCallback(() => {
    phoneRecaptchaVerifierRef.current?.clear();
    phoneRecaptchaVerifierRef.current = null;
  }, []);

  useEffect(() => {
    let isDisposed = false;
    let unsubscribe: (() => void) | undefined;

    getFirebaseAuth().then((auth) => {
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

  useEffect(() => {
    return () => {
      clearPhoneLoginVerifier();
    };
  }, [clearPhoneLoginVerifier]);

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

  const loginMutation = useMutation<boolean, Error, EmailCredentials>({
    mutationFn: async ({ email, password }) => {
      const auth = await getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      persistSession();

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
      persistSession();

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
      persistSession();

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

  const sendPhoneLoginCodeMutation = useMutation<
    ConfirmationResult,
    Error,
    { phoneNumber: string; recaptchaContainerId: string }
  >({
    mutationFn: async ({ phoneNumber, recaptchaContainerId }) => {
      const auth = await getFirebaseAuth();
      clearPhoneLoginVerifier();

      const recaptchaContainer = document.getElementById(recaptchaContainerId);

      if (!recaptchaContainer) {
        throw new Error("Nao foi possivel iniciar a verificacao por SMS.");
      }

      recaptchaContainer.innerHTML = "";

      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: "normal",
        theme: "dark",
      });

      phoneRecaptchaVerifierRef.current = verifier;
      await verifier.render();

      return signInWithPhoneNumber(auth, phoneNumber, verifier);
    },
  });

  const confirmPhoneLoginCodeMutation = useMutation<
    boolean,
    Error,
    { confirmationResult: ConfirmationResult; verificationCode: string }
  >({
    mutationFn: async ({ confirmationResult, verificationCode }) => {
      const auth = await getFirebaseAuth();
      const credential = await confirmationResult.confirm(verificationCode);
      persistSession();

      const authorizedUser = await resolveAuthorizedUser(auth, credential.user, {
        forceRefresh: true,
        throwOnDenied: true,
      });

      queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, authorizedUser);
      return true;
    },
    onSuccess: () => {
      clearPhoneLoginVerifier();
      navigate(DASHBOARD_ROUTE);
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const auth = await getFirebaseAuth();
      await signOut(auth);
      clearPersistedSession();
    },
    onSuccess: () => {
      queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, null);
      navigate("/", { replace: true });
    },
  });

  const login: AuthHookReturn["login"] = (email, password) =>
    loginMutation.mutateAsync({ email, password });

  const loginWithGoogle: AuthHookReturn["loginWithGoogle"] = () =>
    loginWithGoogleMutation.mutateAsync();

  const loginWithMicrosoft: AuthHookReturn["loginWithMicrosoft"] = () =>
    loginWithMicrosoftMutation.mutateAsync();

  const sendPhoneLoginCode: AuthHookReturn["sendPhoneLoginCode"] = (
    phoneNumber,
    recaptchaContainerId
  ) =>
    sendPhoneLoginCodeMutation.mutateAsync({
      phoneNumber,
      recaptchaContainerId,
    });

  const confirmPhoneLoginCode: AuthHookReturn["confirmPhoneLoginCode"] = (
    confirmationResult,
    verificationCode
  ) =>
    confirmPhoneLoginCodeMutation.mutateAsync({
      confirmationResult,
      verificationCode,
    });

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
    sendPhoneLoginCode,
    confirmPhoneLoginCode,
    clearPhoneLoginVerifier,
    logout,
    setUser,
  };
};
