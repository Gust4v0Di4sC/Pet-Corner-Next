"use client";

import { updateProfile } from "firebase/auth";
import { updateCustomerProfileImage } from "@/infrastructure/account/firebase-customer.adapter";
import { getFirebaseAuth, waitForFirebaseUser } from "@/infrastructure/auth/firebase-auth.adapter";
import { createCustomerNotification } from "@/services/notifications/customer-notification.service";

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

type WorkerErrorResponse = {
  message?: string;
};

export type CustomerProfileImageAsset = {
  imageUrl: string;
  key: string;
  contentType: string;
  size: number;
  source: "upload";
};

type SaveCustomerProfileImageInput = {
  customerId: string;
  file: File;
};

function getWorkerErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as WorkerErrorResponse).message === "string"
  ) {
    const message = (payload as WorkerErrorResponse).message?.trim();
    if (message) {
      return message;
    }
  }

  return fallback;
}

function sanitizeHttpUrl(value: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error("URL de imagem invalida.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new Error("URL de imagem invalida.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("A URL da imagem deve usar HTTP ou HTTPS.");
  }

  return parsedUrl.toString();
}

function getCloudflareWorkerBaseUrl(): string {
  const rawValue =
    process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL ||
    process.env.NEXT_PUBLIC_COSMOS_SYNC_URL ||
    process.env.NEXT_PUBLIC_CHAT_WORKER_URL;
  const normalizedValue = String(rawValue ?? "").trim();

  if (!normalizedValue) {
    throw new Error(
      "Configure NEXT_PUBLIC_CLOUDFLARE_WORKER_URL com a URL do seu Worker para enviar fotos de perfil."
    );
  }

  return normalizedValue
    .replace(/\/+$/, "")
    .replace(/\/cosmos\/sync$/i, "")
    .replace(/\/chat\/query$/i, "");
}

function resolveWorkerEndpoint(pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getCloudflareWorkerBaseUrl()}${normalizedPathname}`;
}

function assertValidProfileImageFile(file: File): void {
  if (!(file instanceof File)) {
    throw new Error("Selecione um arquivo de imagem valido.");
  }

  if (file.size <= 0) {
    throw new Error("A imagem selecionada esta vazia.");
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("A foto de perfil deve ter no maximo 5 MB.");
  }

  const normalizedMimeType = file.type.trim().toLowerCase();
  if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    throw new Error("Formato de imagem invalido. Use JPG, PNG, WEBP, GIF ou AVIF.");
  }
}

function isCustomerProfileImageAsset(payload: unknown): payload is CustomerProfileImageAsset {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<CustomerProfileImageAsset>;
  return (
    typeof candidate.imageUrl === "string" &&
    typeof candidate.key === "string" &&
    typeof candidate.contentType === "string" &&
    typeof candidate.size === "number" &&
    candidate.source === "upload"
  );
}

async function getCustomerAuthToken(customerId: string): Promise<string> {
  const normalizedCustomerId = customerId.trim();
  if (!normalizedCustomerId) {
    throw new Error("Sessao do cliente invalida para upload da foto de perfil.");
  }

  const firebaseUser = await waitForFirebaseUser();
  if (!firebaseUser?.uid) {
    throw new Error("Faca login para enviar sua foto de perfil.");
  }

  if (firebaseUser.uid.trim() !== normalizedCustomerId) {
    throw new Error("Sessao autenticada nao corresponde ao perfil ativo.");
  }

  return firebaseUser.getIdToken(true);
}

export async function uploadCustomerProfileImage(
  input: SaveCustomerProfileImageInput
): Promise<CustomerProfileImageAsset> {
  assertValidProfileImageFile(input.file);
  const idToken = await getCustomerAuthToken(input.customerId);

  const formData = new FormData();
  formData.append("file", input.file);

  let response: Response;

  try {
    response = await fetch(resolveWorkerEndpoint("/profile/image/upload"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });
  } catch {
    throw new Error(
      "Nao foi possivel conectar ao Worker de imagens. Verifique a URL publicada no ambiente."
    );
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      getWorkerErrorMessage(payload, "Nao foi possivel enviar a foto de perfil para o bucket.")
    );
  }

  if (!isCustomerProfileImageAsset(payload)) {
    throw new Error("O Worker retornou um payload invalido para foto de perfil.");
  }

  return {
    ...payload,
    imageUrl: sanitizeHttpUrl(payload.imageUrl),
  };
}

export async function saveCustomerProfileImage(
  input: SaveCustomerProfileImageInput
): Promise<CustomerProfileImageAsset> {
  const normalizedCustomerId = input.customerId.trim();
  const uploadResult = await uploadCustomerProfileImage({
    customerId: normalizedCustomerId,
    file: input.file,
  });

  await updateCustomerProfileImage({
    customerId: normalizedCustomerId,
    profileImageUrl: uploadResult.imageUrl,
  });

  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (currentUser && currentUser.uid.trim() === normalizedCustomerId) {
    try {
      await updateProfile(currentUser, { photoURL: uploadResult.imageUrl });
    } catch {
      // Profile image persistence in Firestore is the source of truth.
    }
  }

  void createCustomerNotification({
    customerId: normalizedCustomerId,
    title: "Foto de perfil atualizada",
    message: "Sua nova foto de perfil ja esta ativa na conta.",
    category: "profile",
    linkHref: "/profile",
  }).catch(() => {
    return;
  });

  return uploadResult;
}
