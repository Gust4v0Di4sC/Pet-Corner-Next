// firebase.ts
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let appPromise: Promise<FirebaseApp> | null = null;

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Variável ausente: ${name}`);
  return value;
}

function loadFirebaseConfig() {
  const env = import.meta.env;

  return Promise.resolve({
    apiKey: required("VITE_FIREBASE_API_KEY", env.VITE_FIREBASE_API_KEY),
    authDomain: required("VITE_FIREBASE_AUTH_DOMAIN", env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: required("VITE_FIREBASE_PROJECT_ID", env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: required("VITE_FIREBASE_STORAGE_BUCKET", env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: required("VITE_FIREBASE_MESSAGING_SENDER_ID", env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: required("VITE_FIREBASE_APP_ID", env.VITE_FIREBASE_APP_ID),
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID, // opcional
  });
}

export function getFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = loadFirebaseConfig().then((config) => initializeApp(config));
  }
  return appPromise;
}

// 🔥 Retorna Promise<Auth>
export async function getFirebaseAuth(): Promise<Auth> {
  const app = await getFirebaseApp();
  return getAuth(app);
}

// 🔥 Retorna Promise<Firestore>
export async function getFirestoreDB(): Promise<Firestore> {
  const app = await getFirebaseApp();
  return getFirestore(app);
}

export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");
