import {
  confirmPasswordReset as firebaseConfirmPasswordReset,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  type ActionCodeSettings,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase";

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const auth = await getFirebaseAuth();
  auth.languageCode = "pt-BR";
  const basePath = String(import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "").trim();
  const appPrefix = basePath && basePath !== "/" ? basePath : "";
  const continueUrl = new URL(`${appPrefix}/reset-password`, window.location.origin);
  continueUrl.searchParams.set("source", "password-reset-email");
  const settings: ActionCodeSettings = { url: continueUrl.toString(), handleCodeInApp: true };
  await firebaseSendPasswordResetEmail(auth, email, settings);
}

export async function verifyPasswordResetActionCode(code: string, languageCode?: string) {
  const auth = await getFirebaseAuth();
  if (languageCode) auth.languageCode = languageCode;
  return firebaseVerifyPasswordResetCode(auth, code);
}

export async function confirmPasswordResetWithCode(code: string, newPassword: string, languageCode?: string) {
  const auth = await getFirebaseAuth();
  if (languageCode) auth.languageCode = languageCode;
  await firebaseConfirmPasswordReset(auth, code, newPassword);
}
