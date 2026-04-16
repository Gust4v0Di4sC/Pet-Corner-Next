import axios from "axios";

import { getFirebaseRuntimeConfig } from "../config/runtimeConfig";

const firebaseConfig = getFirebaseRuntimeConfig();
const FIREBASE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

const api = axios.create({
  baseURL: FIREBASE_BASE_URL,
  params: { key: firebaseConfig.apiKey },
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
