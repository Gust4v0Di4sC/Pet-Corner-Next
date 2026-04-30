"use client";

import { FirebaseError } from "firebase/app";
import { upsertCustomerProfile } from "@/features/account/services/firebase-customer.adapter";
import {
  createCustomerWithEmail,
  signInCustomerWithEmail,
  signInCustomerWithGoogle,
  signInCustomerWithMicrosoft,
} from "@/lib/auth/firebase-auth.adapter";

export type LoginMode = "email" | "google" | "microsoft";

export type SessionResponse = {
  ok: boolean;
  nextPath: string;
  customerId: string;
};

type IdentityInput = {
  uid: string;
  email: string | null;
  displayName: string | null;
  providerId?: string;
};

type OpenSessionInput = {
  customerId: string;
  email: string;
  name?: string;
  nextPath: string;
};

type EmailLoginInput = {
  email: string;
  password: string;
  nextPath: string;
};

type EmailRegisterInput = {
  name: string;
  email: string;
  password: string;
  nextPath: string;
};

function mapProvider(providerId?: string): "password" | "google.com" | "microsoft.com" | "unknown" {
  if (providerId === "password") return "password";
  if (providerId === "google.com") return "google.com";
  if (providerId === "microsoft.com") return "microsoft.com";
  return "unknown";
}

function extractProviderId(identity: IdentityInput): string | undefined {
  if (identity.providerId) {
    return identity.providerId;
  }
  return identity.providerId;
}

async function openSession(input: OpenSessionInput): Promise<SessionResponse> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      customerId: input.customerId,
      email: input.email,
      name: input.name,
      next: input.nextPath,
    }),
  });

  if (!response.ok) {
    throw new Error("Falha ao abrir sessao do cliente.");
  }

  const payload = (await response.json()) as
    | (SessionResponse & { session?: { customerId?: string } })
    | { ok?: boolean; nextPath?: string; session?: { customerId?: string } };

  return {
    ok: Boolean(payload.ok),
    nextPath: payload.nextPath || input.nextPath,
    customerId: payload.session?.customerId || input.customerId,
  };
}

async function syncCustomerProfile(identity: IdentityInput, fallbackName: string): Promise<void> {
  const normalizedEmail = identity.email?.trim();
  if (!normalizedEmail) {
    return;
  }

  try {
    await upsertCustomerProfile({
      customerId: identity.uid,
      email: normalizedEmail,
      name: identity.displayName || fallbackName,
      provider: mapProvider(extractProviderId(identity)),
    });
  } catch (error) {
    // The profile sync must not block auth/session bootstrap.
    console.warn("Customer profile sync skipped:", error);
  }
}

async function completeAuthFlow(
  identity: IdentityInput,
  nextPath: string,
  fallbackEmail: string,
  fallbackName: string
): Promise<SessionResponse> {
  const normalizedEmail = (identity.email || fallbackEmail).trim();
  const normalizedName = identity.displayName || fallbackName;

  if (!normalizedEmail) {
    throw new Error("Nao foi possivel identificar o email da conta.");
  }

  await syncCustomerProfile(identity, normalizedName);

  return openSession({
    customerId: identity.uid,
    email: normalizedEmail,
    name: normalizedName,
    nextPath,
  });
}

export async function loginCustomerWithEmail(input: EmailLoginInput): Promise<SessionResponse> {
  const credential = await signInCustomerWithEmail(input.email.trim(), input.password);
  const providerId = credential.user.providerData[0]?.providerId || "password";
  return completeAuthFlow(
    {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      providerId,
    },
    input.nextPath,
    input.email,
    "Cliente Pet Corner"
  );
}

export async function registerCustomerWithEmail(input: EmailRegisterInput): Promise<SessionResponse> {
  const credential = await createCustomerWithEmail(input.email.trim(), input.password, input.name.trim());
  const providerId = credential.user.providerData[0]?.providerId || "password";
  return completeAuthFlow(
    {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      providerId,
    },
    input.nextPath,
    input.email,
    input.name
  );
}

export async function loginCustomerWithGoogle(nextPath: string): Promise<SessionResponse> {
  const credential = await signInCustomerWithGoogle();
  const providerId = credential.user.providerData[0]?.providerId || "google.com";
  return completeAuthFlow(
    {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      providerId,
    },
    nextPath,
    "",
    "Cliente Pet Corner"
  );
}

export async function loginCustomerWithMicrosoft(nextPath: string): Promise<SessionResponse> {
  const credential = await signInCustomerWithMicrosoft();
  const providerId = credential.user.providerData[0]?.providerId || "microsoft.com";
  return completeAuthFlow(
    {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      providerId,
    },
    nextPath,
    "",
    "Cliente Pet Corner"
  );
}

export function mapCustomerAuthError(error: unknown, context: "login" | "register"): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/user-not-found":
        return "Usuario nao encontrado.";
      case "auth/wrong-password":
        return "Senha incorreta.";
      case "auth/invalid-credential":
        return "Email ou senha invalidos.";
      case "auth/invalid-email":
        return "Informe um email valido.";
      case "auth/email-already-in-use":
        return "Este email ja esta em uso.";
      case "auth/weak-password":
        return "A senha precisa ter pelo menos 6 caracteres.";
      case "auth/account-exists-with-different-credential":
        return "Ja existe uma conta com outro metodo para este email.";
      case "auth/popup-blocked":
        return "O navegador bloqueou o popup. Libere popups para continuar.";
      case "auth/popup-closed-by-user":
        return context === "register"
          ? "Cadastro cancelado antes da conclusao."
          : "Login cancelado antes da conclusao.";
      case "auth/unauthorized-domain":
        return "Dominio nao autorizado para login.";
      case "auth/operation-not-allowed":
        return context === "register"
          ? "Metodo de cadastro nao habilitado no momento."
          : "Metodo de login nao habilitado no momento.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      default:
        return context === "register"
          ? "Nao foi possivel concluir o cadastro agora."
          : "Nao foi possivel autenticar agora.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return context === "register"
    ? "Nao foi possivel concluir o cadastro."
    : "Nao foi possivel concluir o login.";
}
