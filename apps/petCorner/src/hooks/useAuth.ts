// useAuth.ts
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { useNavigate } from "react-router-dom"; // recomendo
import { DASHBOARD_ROUTE } from "../components/Dashboard/dashboard.domain";
import { getFirebaseAuth, googleProvider, microsoftProvider } from "../firebase";
import type { AuthHookReturn, AuthUser, EmailCredentials } from "../types/Auth";

const AUTH_QUERY_KEY = ["auth", "user"] as const;

const mapFirebaseUser = (user: FirebaseUser | null): AuthUser | null =>
  user ? { uid: user.uid, email: user.email } : null;

const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const auth = await getFirebaseAuth();
  const current = mapFirebaseUser(auth.currentUser);
  if (current) return current;

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribe();
      resolve(mapFirebaseUser(firebaseUser));
    });
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
    let unsubscribe: (() => void) | undefined;

    getFirebaseAuth().then((auth) => {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        queryClient.setQueryData<AuthUser | null>(
          AUTH_QUERY_KEY,
          mapFirebaseUser(firebaseUser)
        );
      });
    });

    return () => unsubscribe?.();
  }, [queryClient]);

  const loginMutation = useMutation<boolean, Error, EmailCredentials>({
    mutationFn: async ({ email, password }) => {
      const auth = await getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      navigate(DASHBOARD_ROUTE);
    },
  });

  const loginWithGoogleMutation = useMutation<boolean, Error, void>({
    mutationFn: async () => {
      const auth = await getFirebaseAuth();
      await signInWithPopup(auth, googleProvider);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      navigate(DASHBOARD_ROUTE);
    },
  });

  const loginWithMicrosoftMutation = useMutation<boolean, Error, void>({
    mutationFn: async () => {
      const auth = await getFirebaseAuth();
      await signInWithPopup(auth, microsoftProvider);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
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

  // ✅ ADAPTADORES com a assinatura pública dos seus types
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
