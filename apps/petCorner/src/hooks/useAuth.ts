import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { DASHBOARD_ROUTE } from "../components/Dashboard/dashboard.domain";
import { getFirebaseAuth, googleProvider, microsoftProvider } from "../firebase";
import { AUTH_QUERY_KEY } from "./auth/adminAuthQuery";
import { useAdminAuthStateSubscription } from "./auth/useAdminAuthStateSubscription";
import { useAdminSessionExpiryWatcher } from "./auth/useAdminSessionExpiryWatcher";
import { persistSession } from "../services/adminAuthSessionService";
import {
  fetchCurrentAdminUser,
  resolveAuthorizedUser,
  signOutAndClearSession,
} from "../services/adminAuthorizationService";
import type { AuthHookReturn, AuthUser, EmailCredentials } from "../types/Auth";

export const useAuth = (): AuthHookReturn => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const phoneRecaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentAdminUser,
    staleTime: Infinity,
  });

  useAdminAuthStateSubscription(queryClient);
  useAdminSessionExpiryWatcher(queryClient, navigate);

  const clearPhoneLoginVerifier = useCallback(() => {
    phoneRecaptchaVerifierRef.current?.clear();
    phoneRecaptchaVerifierRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearPhoneLoginVerifier();
    };
  }, [clearPhoneLoginVerifier]);

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
      await signOutAndClearSession(auth);
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
