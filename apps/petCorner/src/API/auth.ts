import axios from "axios";
import {
  confirmPasswordReset as firebaseConfirmPasswordReset,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type ActionCodeSettings,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
} from "firebase/auth";

import { getFirebaseRuntimeConfig } from "../config/runtimeConfig";
import { getFirebaseAuth } from "../firebase";

const AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
const TOKEN_BASE_URL = "https://securetoken.googleapis.com/v1";

type AuthResponse = {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
  displayName?: string;
};

type RefreshTokenResponse = {
  access_token: string;
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
};

function createAuthApi() {
  return axios.create({
    baseURL: AUTH_BASE_URL,
    params: { key: getFirebaseRuntimeConfig().apiKey },
    headers: { "Content-Type": "application/json" },
  });
}

function createTokenApi() {
  return axios.create({
    baseURL: TOKEN_BASE_URL,
    params: { key: getFirebaseRuntimeConfig().apiKey },
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await createAuthApi().post<AuthResponse>("/accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });

  return data;
}

export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await createAuthApi().post<AuthResponse>("/accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });

  return data;
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const auth = await getFirebaseAuth();
  auth.languageCode = "pt-BR";

  const basePath = String(import.meta.env.BASE_URL ?? "/")
    .replace(/\/+$/, "")
    .trim();
  const appPrefix = basePath && basePath !== "/" ? basePath : "";
  const continueUrl = new URL(`${appPrefix}/`, window.location.origin);
  continueUrl.searchParams.set("source", "password-reset-email");

  const actionCodeSettings: ActionCodeSettings = {
    url: continueUrl.toString(),
    handleCodeInApp: false,
  };

  await firebaseSendPasswordResetEmail(auth, email, actionCodeSettings);
}

export async function verifyPasswordResetActionCode(
  code: string,
  languageCode?: string
): Promise<string> {
  const auth = await getFirebaseAuth();

  if (languageCode) {
    auth.languageCode = languageCode;
  }

  return firebaseVerifyPasswordResetCode(auth, code);
}

export async function confirmPasswordResetWithCode(
  code: string,
  newPassword: string,
  languageCode?: string
): Promise<void> {
  const auth = await getFirebaseAuth();

  if (languageCode) {
    auth.languageCode = languageCode;
  }

  await firebaseConfirmPasswordReset(auth, code, newPassword);
}

export async function refreshIdToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const { data } = await createTokenApi().post<RefreshTokenResponse>("/token", body);
  return data;
}
