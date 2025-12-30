import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { useNavigate } from "react-router";
import {
  getFirebaseAuth,
  googleProvider,
  microsoftProvider,
} from "../firebase";
import type { AuthHookReturn, AuthUser, EmailCredentials } from "../types/Auth";
import type { SetStateAction } from "react";

const AUTH_QUERY_KEY = ["auth", "user"];

const mapFirebaseUser = (user: FirebaseUser | null): AuthUser | null =>
  user
    ? {
        uid: user.uid,
        email: user.email,
      }
    : null;

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

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [queryClient]);

  const loginMutation = useMutation<boolean, Error, EmailCredentials>({
    mutationFn: async ({ email, password }: EmailCredentials) => {
      const auth = await getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      navigate("/clientes");
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
      navigate("/clientes");
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
      navigate("/clientes");
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

  const setUser = (updater: SetStateAction<AuthUser | null>) => {
    queryClient.setQueryData<AuthUser | null>(AUTH_QUERY_KEY, (current) =>
      typeof updater === "function"
        ? (updater as (prev: AuthUser | null) => AuthUser | null)(
            current ?? null
          )
        : updater
    );
  };

  return {
    user: user ?? null,
    isLoading,
    login: loginMutation.mutateAsync,
    loginWithGoogle: loginWithGoogleMutation.mutateAsync,
    loginWithMicrosoft: loginWithMicrosoftMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    setUser,
  };
};
