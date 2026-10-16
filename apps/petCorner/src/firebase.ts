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
import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";

import { getFirebaseRuntimeConfig } from "./config/runtimeConfig";

let appPromise: Promise<FirebaseApp> | null = null;
let authPromise: Promise<Auth> | null = null;
let appCheckPromise: Promise<AppCheck | null> | null = null;

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

export function getFirebaseAppCheck(): Promise<AppCheck | null> {
  if (!appCheckPromise) {
    appCheckPromise = getFirebaseApp().then((app) => {
      const siteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY?.trim();
      return siteKey
        ? initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(siteKey),
            isTokenAutoRefreshEnabled: true,
          })
        : null;
    });
  }
  return appCheckPromise;
}

export async function getAppCheckHeaders(): Promise<Record<string, string>> {
  const instance = await getFirebaseAppCheck();
  if (!instance) return {};
  const result = await getToken(instance, false).catch(() => null);
  return result?.token ? { "X-Firebase-AppCheck": result.token } : {};
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
