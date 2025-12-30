import axios from "axios";

const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

if (!firebaseProjectId) {
  throw new Error("VITE_FIREBASE_PROJECT_ID is not set in the environment.");
}

if (!firebaseApiKey) {
  throw new Error("VITE_FIREBASE_API_KEY is not set in the environment.");
}

const FIREBASE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents`;

const api = axios.create({
  baseURL: FIREBASE_BASE_URL,
  params: { key: firebaseApiKey },
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
