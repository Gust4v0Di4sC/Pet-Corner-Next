"use client";

import {
  createCustomerWithEmail,
  signInCustomerWithEmail,
  signInCustomerWithGoogle,
  signInCustomerWithMicrosoft,
} from "@/lib/auth/firebase-auth.adapter";
import { mapCustomerAuthError } from "@/features/auth/services/customer-auth-errors";
import {
  syncCustomerProfile,
  type CustomerIdentityInput,
} from "@/features/auth/services/customer-profile-sync.service";
import {
  openCustomerSession,
  type SessionResponse,
} from "@/features/auth/services/customer-session.service";

export type { SessionResponse };
export { mapCustomerAuthError };

export type LoginMode = "email" | "google" | "microsoft";

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

async function completeAuthFlow(
  identity: CustomerIdentityInput,
  nextPath: string,
  fallbackEmail: string,
  fallbackName: string
): Promise<SessionResponse> {
  const normalizedEmail = (identity.email || fallbackEmail).trim();
  const normalizedName = identity.displayName || fallbackName;

  if (!normalizedEmail) {
    throw new Error("Não foi possível identificar o email da conta.");
  }

  await syncCustomerProfile(identity, normalizedName);

  const idToken = await identity.getIdToken(true);

  return openCustomerSession({
    name: normalizedName,
    nextPath,
    idToken,
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
      getIdToken: credential.user.getIdToken.bind(credential.user),
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
      getIdToken: credential.user.getIdToken.bind(credential.user),
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
      getIdToken: credential.user.getIdToken.bind(credential.user),
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
      getIdToken: credential.user.getIdToken.bind(credential.user),
    },
    nextPath,
    "",
    "Cliente Pet Corner"
  );
}
