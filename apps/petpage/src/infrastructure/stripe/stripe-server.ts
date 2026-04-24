import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} precisa estar configurada.`);
  }
  return value;
}

export function assertStripeSecretKeyIsTestMode(secretKey: string): string {
  const normalizedSecretKey = secretKey.trim();

  if (normalizedSecretKey.startsWith("sk_live_")) {
    throw new Error("Chave Stripe live detectada. Use somente STRIPE_SECRET_KEY sk_test_ neste app.");
  }

  if (!normalizedSecretKey.startsWith("sk_test_")) {
    throw new Error("STRIPE_SECRET_KEY precisa comecar com sk_test_.");
  }

  return normalizedSecretKey;
}

export function assertStripePublishableKeyIsTestMode(publishableKey: string): string {
  const normalizedPublishableKey = publishableKey.trim();

  if (normalizedPublishableKey.startsWith("pk_live_")) {
    throw new Error("Chave publishable live detectada. Use somente pk_test_ neste app.");
  }

  if (!normalizedPublishableKey.startsWith("pk_test_")) {
    throw new Error("A chave publishable Stripe precisa comecar com pk_test_.");
  }

  return normalizedPublishableKey;
}

export function getStripeServerClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = assertStripeSecretKeyIsTestMode(readRequiredEnv("STRIPE_SECRET_KEY"));
  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const webhookSecret = readRequiredEnv("STRIPE_WEBHOOK_SECRET");

  if (!webhookSecret.startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET precisa comecar com whsec_.");
  }

  return webhookSecret;
}

export function getPublicAppUrl(): string {
  const appUrl = readRequiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
  const parsedUrl = new URL(appUrl);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("NEXT_PUBLIC_APP_URL precisa usar http ou https.");
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}
