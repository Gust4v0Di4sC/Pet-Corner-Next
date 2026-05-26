import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  initializeAuth,
  type Auth,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import type { Firestore } from "firebase/firestore";

import { getFirebaseRuntimeConfig } from "./config/runtimeConfig";

let appPromise: Promise<FirebaseApp> | null = null;
let authPromise: Promise<Auth> | null = null;

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
  if (!authPromise) {
    authPromise = getFirebaseApp().then((app) => {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
        popupRedirectResolver: browserPopupRedirectResolver,
      });
    });
  }

  return authPromise;
}

export async function getFirestoreDB(): Promise<Firestore> {
  const [{ getFirestore }, app] = await Promise.all([
    import("firebase/firestore"),
    getFirebaseApp(),
  ]);

  return getFirestore(app);
}

export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");
