import  { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tipagem para garantir que só inicialize uma vez
let appPromise: Promise<FirebaseApp> | null = null;

function loadFirebaseConfig() {
  return fetch("/api/env")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Erro ao carregar variáveis de ambiente do Firebase");
      }
      return res.json();
    })
    .then((env) => ({
      apiKey: env.FIREBASE_API_KEY,
      authDomain: env.FIREBASE_AUTH_DOMAIN,
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
      appId: env.FIREBASE_APP_ID,
      measurementId: env.FIREBASE_MEASUREMENT_ID,
    }));
}

export function getFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = loadFirebaseConfig().then((config) => initializeApp(config));
  }
  return appPromise;
}

// Helpers para usar auth e firestore
export async function getFirebaseAuth() {
  const app = await getFirebaseApp();
  return getAuth(app);
}

export async function getFirestoreDB() {
  const app = await getFirebaseApp();
  return getFirestore(app);
}

// Providers de login
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");
