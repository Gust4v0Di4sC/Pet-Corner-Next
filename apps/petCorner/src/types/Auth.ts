import type { ConfirmationResult } from "firebase/auth";
import type { Dispatch, SetStateAction } from "react";

export type AuthUser = {
  uid: string;
  email: string | null;
  isAdmin: boolean;
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

export type PhoneCodeRequestFn = (
  phoneNumber: string,
  recaptchaContainerId: string
) => Promise<ConfirmationResult>;

export type PhoneCodeConfirmFn = (
  confirmationResult: ConfirmationResult,
  verificationCode: string
) => Promise<boolean>;

export type ClearPhoneVerifierFn = () => void;

export type AuthHookReturn = {
  user: AuthUser | null;
  login: EmailLoginFn;
  loginWithGoogle: ProviderLoginFn;
  loginWithMicrosoft: ProviderLoginFn;
  sendPhoneLoginCode: PhoneCodeRequestFn;
  confirmPhoneLoginCode: PhoneCodeConfirmFn;
  clearPhoneLoginVerifier: ClearPhoneVerifierFn;
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
