"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type LoginMode,
  type SessionResponse,
  loginCustomerWithEmail,
  loginCustomerWithGoogle,
  loginCustomerWithMicrosoft,
  mapCustomerAuthError,
  registerCustomerWithEmail,
} from "@/features/auth/services/customer-auth.service";
import { syncGuestCartToCustomerCart } from "@/features/cart-checkout/services/customer-cart.service";

type UseCustomerAuthOptions = {
  nextPath: string;
};

type EmailLoginInput = {
  email: string;
  password: string;
};

type EmailRegisterInput = {
  name: string;
  email: string;
  password: string;
};

export function useCustomerAuth({ nextPath }: UseCustomerAuthOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const migrateGuestCartAfterAuth = useCallback(async (customerId: string) => {
    const normalizedCustomerId = customerId.trim();
    if (!normalizedCustomerId) {
      return;
    }

    try {
      await syncGuestCartToCustomerCart(normalizedCustomerId);
    } catch (error) {
      // The auth flow should not be blocked by cart sync failures.
      console.warn("Guest cart migration failed:", error);
    }
  }, []);

  const refreshCustomerCaches = useCallback(
    async (customerId: string) => {
      const normalizedCustomerId = customerId.trim();

      queryClient.removeQueries({ queryKey: ["customer-cart", "guest"], exact: true });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer-cart"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-orders-tracking"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-notifications"] }),
      ]);

      if (normalizedCustomerId) {
        await queryClient.invalidateQueries({
          queryKey: ["customer-cart", normalizedCustomerId],
        });
      }
    },
    [queryClient]
  );

  const finishAuthFlow = useCallback(
    (resultNextPath: string) => {
      router.replace(resultNextPath || nextPath);
      router.refresh();
    },
    [nextPath, router]
  );

  const completeSuccessfulAuth = useCallback(
    async (response: SessionResponse) => {
      await migrateGuestCartAfterAuth(response.customerId);
      await refreshCustomerCaches(response.customerId);
      finishAuthFlow(response.nextPath);
    },
    [finishAuthFlow, migrateGuestCartAfterAuth, refreshCustomerCaches]
  );

  const loginWithEmailMutation = useMutation({
    mutationFn: async (input: EmailLoginInput) =>
      loginCustomerWithEmail({
        email: input.email,
        password: input.password,
        nextPath,
      }),
    onSuccess: completeSuccessfulAuth,
    onError: (error) => {
      setErrorMessage(mapCustomerAuthError(error, "login"));
    },
  });

  const registerWithEmailMutation = useMutation({
    mutationFn: async (input: EmailRegisterInput) =>
      registerCustomerWithEmail({
        name: input.name,
        email: input.email,
        password: input.password,
        nextPath,
      }),
    onSuccess: completeSuccessfulAuth,
    onError: (error) => {
      setErrorMessage(mapCustomerAuthError(error, "register"));
    },
  });

  const loginWithGoogleMutation = useMutation({
    mutationFn: async () => loginCustomerWithGoogle(nextPath),
    onSuccess: completeSuccessfulAuth,
    onError: (error) => {
      setErrorMessage(mapCustomerAuthError(error, "login"));
    },
  });

  const loginWithMicrosoftMutation = useMutation({
    mutationFn: async () => loginCustomerWithMicrosoft(nextPath),
    onSuccess: completeSuccessfulAuth,
    onError: (error) => {
      setErrorMessage(mapCustomerAuthError(error, "login"));
    },
  });

  const loadingMode: LoginMode | null =
    loginWithEmailMutation.isPending || registerWithEmailMutation.isPending
      ? "email"
      : loginWithGoogleMutation.isPending
        ? "google"
        : loginWithMicrosoftMutation.isPending
          ? "microsoft"
          : null;
  const isBusy = loadingMode !== null;

  const loginWithEmail = useCallback(
    async (input: EmailLoginInput) => {
      setErrorMessage(null);

      try {
        await loginWithEmailMutation.mutateAsync(input);
      } catch {
        return;
      }
    },
    [loginWithEmailMutation]
  );

  const registerWithEmail = useCallback(
    async (input: EmailRegisterInput) => {
      setErrorMessage(null);

      try {
        await registerWithEmailMutation.mutateAsync(input);
      } catch {
        return;
      }
    },
    [registerWithEmailMutation]
  );

  const loginWithGoogle = useCallback(async () => {
    setErrorMessage(null);

    try {
      await loginWithGoogleMutation.mutateAsync();
    } catch {
      return;
    }
  }, [loginWithGoogleMutation]);

  const loginWithMicrosoft = useCallback(async () => {
    setErrorMessage(null);

    try {
      await loginWithMicrosoftMutation.mutateAsync();
    } catch {
      return;
    }
  }, [loginWithMicrosoftMutation]);

  return {
    errorMessage,
    loadingMode,
    isBusy,
    setErrorMessage,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithMicrosoft,
  };
}
