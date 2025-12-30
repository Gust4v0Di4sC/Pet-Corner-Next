import type { Dispatch, SetStateAction } from "react";

export type AuthUser = {
  uid: string;
  email: string | null;
};

export type EmailCredentials = {
  email: string;
  password: string;
};

// Third-party providers already supported by the app; extend as needed.
export type ThirdPartyProvider = "google" | "microsoft";

export type EmailLoginFn = (email: string, password: string) => Promise<boolean>;

export type ProviderLoginFn = () => Promise<boolean>;

export type LogoutFn = () => Promise<void>;

export type AuthHookReturn = {
  user: AuthUser | null;
  login: EmailLoginFn;
  loginWithGoogle: ProviderLoginFn;
  loginWithMicrosoft: ProviderLoginFn;
  logout: LogoutFn;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  isLoading: boolean;
};

export type TokenPayload = {
  idToken: string;
  refreshToken: string;
  expiresIn: number | string;
};

export type AuthTokens = {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type AuthStoreState = {
  tokens: AuthTokens | null;
  isRefreshing: boolean;
  setSession: (payload: TokenPayload) => void;
  clearSession: () => void;
  setRefreshing: (value: boolean) => void;
  hasValidToken: () => boolean;
};
