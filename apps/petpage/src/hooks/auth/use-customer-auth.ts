"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type LoginMode,
  loginCustomerWithEmail,
  loginCustomerWithGoogle,
  loginCustomerWithMicrosoft,
  mapCustomerAuthError,
  registerCustomerWithEmail,
} from "@/services/auth/customer-auth.service";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<LoginMode | null>(null);

  const isBusy = loadingMode !== null;

  const finishAuthFlow = useCallback(
    (resultNextPath: string) => {
      router.replace(resultNextPath || nextPath);
      router.refresh();
    },
    [nextPath, router]
  );

  const loginWithEmail = useCallback(
    async (input: EmailLoginInput) => {
      setErrorMessage(null);
      setLoadingMode("email");

      try {
        const response = await loginCustomerWithEmail({
          email: input.email,
          password: input.password,
          nextPath,
        });
        finishAuthFlow(response.nextPath);
      } catch (error) {
        setErrorMessage(mapCustomerAuthError(error, "login"));
      } finally {
        setLoadingMode(null);
      }
    },
    [finishAuthFlow, nextPath]
  );

  const registerWithEmail = useCallback(
    async (input: EmailRegisterInput) => {
      setErrorMessage(null);
      setLoadingMode("email");

      try {
        const response = await registerCustomerWithEmail({
          name: input.name,
          email: input.email,
          password: input.password,
          nextPath,
        });
        finishAuthFlow(response.nextPath);
      } catch (error) {
        setErrorMessage(mapCustomerAuthError(error, "register"));
      } finally {
        setLoadingMode(null);
      }
    },
    [finishAuthFlow, nextPath]
  );

  const loginWithGoogle = useCallback(async () => {
    setErrorMessage(null);
    setLoadingMode("google");

    try {
      const response = await loginCustomerWithGoogle(nextPath);
      finishAuthFlow(response.nextPath);
    } catch (error) {
      setErrorMessage(mapCustomerAuthError(error, "login"));
    } finally {
      setLoadingMode(null);
    }
  }, [finishAuthFlow, nextPath]);

  const loginWithMicrosoft = useCallback(async () => {
    setErrorMessage(null);
    setLoadingMode("microsoft");

    try {
      const response = await loginCustomerWithMicrosoft(nextPath);
      finishAuthFlow(response.nextPath);
    } catch (error) {
      setErrorMessage(mapCustomerAuthError(error, "login"));
    } finally {
      setLoadingMode(null);
    }
  }, [finishAuthFlow, nextPath]);

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
