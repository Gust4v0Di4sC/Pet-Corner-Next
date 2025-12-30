import axios from "axios";

const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

if (!firebaseApiKey) {
  throw new Error("VITE_FIREBASE_API_KEY is not set in the environment.");
}

const AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
const TOKEN_BASE_URL = "https://securetoken.googleapis.com/v1";

type AuthResponse = {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
  displayName?: string;
};

type RefreshTokenResponse = {
  access_token: string;
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
};

const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  params: { key: firebaseApiKey },
  headers: { "Content-Type": "application/json" },
});

const tokenApi = axios.create({
  baseURL: TOKEN_BASE_URL,
  params: { key: firebaseApiKey },
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await authApi.post<AuthResponse>("/accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
  return data;
}

export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await authApi.post<AuthResponse>("/accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });
  return data;
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  await authApi.post("/accounts:sendOobCode", {
    requestType: "PASSWORD_RESET",
    email,
  });
}

export async function refreshIdToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const { data } = await tokenApi.post<RefreshTokenResponse>("/token", body);
  return data;
}
