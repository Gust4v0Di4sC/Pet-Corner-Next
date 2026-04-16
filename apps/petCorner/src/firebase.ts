import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

import { getFirebaseRuntimeConfig } from "./config/runtimeConfig";

let appPromise: Promise<FirebaseApp> | null = null;

function loadFirebaseConfig() {
  return Promise.resolve(getFirebaseRuntimeConfig());
}

export function getFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = loadFirebaseConfig().then((config) => initializeApp(config));
  }

  return appPromise;
}

export async function getFirebaseAuth(): Promise<Auth> {
  const app = await getFirebaseApp();
  return getAuth(app);
}

export async function getFirestoreDB(): Promise<Firestore> {
  const app = await getFirebaseApp();
  return getFirestore(app);
}

export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");
