import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function readOptionalEnv(name: string): string {
  return process.env[name]?.trim() || "";
}

function readProjectId(): string {
  const projectId =
    readOptionalEnv("FIREBASE_ADMIN_PROJECT_ID") ||
    readOptionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  if (!projectId) {
    throw new Error("FIREBASE_ADMIN_PROJECT_ID ou NEXT_PUBLIC_FIREBASE_PROJECT_ID precisa estar configurada.");
  }

  return projectId;
}

function readPrivateKey(): string {
  const privateKey = readOptionalEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");
  if (!privateKey) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY precisa estar configurada para rotas server-side.");
  }
  return privateKey;
}

function readClientEmail(): string {
  const clientEmail = readOptionalEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!clientEmail) {
    throw new Error("FIREBASE_ADMIN_CLIENT_EMAIL precisa estar configurada para rotas server-side.");
  }
  return clientEmail;
}

export function getFirebaseServerApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: readProjectId(),
      clientEmail: readClientEmail(),
      privateKey: readPrivateKey(),
    }),
  });
}

export function getFirebaseServerFirestore() {
  return getFirestore(getFirebaseServerApp());
}
