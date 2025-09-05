import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app: FirebaseApp | null = null;

function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: import.meta.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const config = getFirebaseConfig();
    app = initializeApp(config);
  }
  return app;
}

// Helpers
export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return getAuth(app);
}

export function getFirestoreDB() {
  const app = getFirebaseApp();
  return getFirestore(app);
}

// Providers
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider("microsoft.com");
