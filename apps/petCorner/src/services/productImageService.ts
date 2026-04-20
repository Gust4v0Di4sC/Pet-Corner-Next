import { getChatWorkerUrl, getCosmosSyncUrl } from "../config/runtimeConfig";
import { getFirebaseAuth } from "../firebase";

type ProductImageWorkerErrorResponse = {
  message?: string;
};

export type ProductImageAsset = {
  imageUrl: string;
  key: string;
  contentType: string;
  size: number;
  source: "upload" | "remote";
  originalUrl?: string;
};

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as ProductImageWorkerErrorResponse).message === "string"
  ) {
    const message = (payload as ProductImageWorkerErrorResponse).message?.trim();

    if (message) {
      return message;
    }
  }

  return fallback;
}

function getWorkerBaseUrl(): string {
  let configuredUrl = "";

  try {
    configuredUrl = getCosmosSyncUrl();
  } catch {
    configuredUrl = "";
  }

  if (!configuredUrl) {
    configuredUrl = getChatWorkerUrl();
  }

  return configuredUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/cosmos\/sync$/i, "")
    .replace(/\/chat\/query$/i, "");
}

function resolveEndpoint(pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getWorkerBaseUrl()}${normalizedPathname}`;
}

function isProductImageAsset(payload: unknown): payload is ProductImageAsset {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<ProductImageAsset>;

  return (
    typeof candidate.imageUrl === "string" &&
    typeof candidate.key === "string" &&
    typeof candidate.contentType === "string" &&
    typeof candidate.size === "number" &&
    (candidate.source === "upload" || candidate.source === "remote")
  );
}

async function getAdminAuthToken(): Promise<string> {
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Faca login como administrador para enviar imagens de produtos.");
  }

  return user.getIdToken(true);
}

export async function uploadProductImage(
  file: File,
  options?: { code?: string }
): Promise<ProductImageAsset> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("Selecione uma imagem valida para upload.");
  }

  const idToken = await getAdminAuthToken();
  const formData = new FormData();
  formData.append("file", file);

  if (options?.code?.trim()) {
    formData.append("code", options.code.trim());
  }

  let response: Response;

  try {
    response = await fetch(resolveEndpoint("/products/image/upload"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao Worker de upload de imagens. Verifique a publicação e a URL configurada."
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
      getErrorMessage(payload, "Não foi possível enviar a imagem para o bucket de produtos.")
    );
  }

  if (!isProductImageAsset(payload)) {
    throw new Error("O Worker retornou um payload inválido ao enviar a imagem.");
  }

  return payload;
}

export async function importProductImageFromUrl(
  sourceUrl: string,
  options?: { code?: string }
): Promise<ProductImageAsset> {
  const normalizedSourceUrl = sourceUrl.trim();

  if (!normalizedSourceUrl) {
    throw new Error("Informe uma URL de imagem valida para importar.");
  }

  const idToken = await getAdminAuthToken();
  let response: Response;

  try {
    response = await fetch(resolveEndpoint("/products/image/import-url"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        sourceUrl: normalizedSourceUrl,
        code: options?.code?.trim() || undefined,
      }),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao Worker para importar a imagem do catálogo."
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
      getErrorMessage(payload, "Não foi possível importar a imagem para o bucket de produtos.")
    );
  }

  if (!isProductImageAsset(payload)) {
    throw new Error("O Worker retornou um payload inválido ao importar a imagem.");
  }

  return payload;
}
