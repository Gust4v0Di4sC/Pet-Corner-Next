import { getCosmosSyncUrl } from "../config/runtimeConfig";
import { getFirebaseAuth } from "../firebase";
import type { ProductCatalogImportInput } from "../types/productCatalog";

export type CosmosCatalogSyncPayload = {
  items: ProductCatalogImportInput[];
  totalRows: number;
  validRows: number;
  ignored: number;
  sourceFileName: string;
};

type CosmosCatalogSyncErrorResponse = {
  message?: string;
};

export type CosmosProductImagePayload = {
  code: string;
  found: boolean;
  hasImage: boolean;
  imageUrl: string;
  description?: string;
};

function resolveCosmosWorkerEndpoint(pathname: string): string {
  const baseUrl = getCosmosSyncUrl()
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/cosmos\/sync$/i, "");
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${baseUrl}${normalizedPathname}`;
}

async function getAdminIdToken(): Promise<string> {
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Faca login como administrador para sincronizar a Cosmos.");
  }

  return user.getIdToken(true);
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as CosmosCatalogSyncErrorResponse).message === "string"
  ) {
    const message = (payload as CosmosCatalogSyncErrorResponse).message?.trim();

    if (message) {
      return message;
    }
  }

  return fallback;
}

export async function fetchCommonProductsFromCosmos(): Promise<CosmosCatalogSyncPayload> {
  const idToken = await getAdminIdToken();
  let response: Response;

  try {
    response = await fetch(resolveCosmosWorkerEndpoint("/cosmos/sync"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({}),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao Worker da Cloudflare. Verifique a URL configurada, o HTTPS do workers.dev e a publicação do Worker."
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
      getErrorMessage(payload, "Não foi possível sincronizar os produtos via Cosmos.")
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray((payload as CosmosCatalogSyncPayload).items)
  ) {
    throw new Error("O Worker da Cloudflare retornou um payload inválido.");
  }

  return payload as CosmosCatalogSyncPayload;
}

export async function fetchCosmosProductImageByCode(
  code: string
): Promise<CosmosProductImagePayload> {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    throw new Error("Informe um código valido para buscar imagem na Cosmos.");
  }

  const idToken = await getAdminIdToken();
  let response: Response;

  try {
    response = await fetch(resolveCosmosWorkerEndpoint("/cosmos/product-image"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        code: normalizedCode,
      }),
    });
  } catch {
    throw new Error(
      "Não foi possível consultar imagem na Cosmos agora. Verifique o Worker e tente novamente."
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
      getErrorMessage(payload, "Não foi possível buscar imagem do produto na Cosmos.")
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("A resposta da Cosmos para imagem veio em formato inválido.");
  }

  const parsedPayload = payload as Partial<CosmosProductImagePayload>;

  return {
    code: typeof parsedPayload.code === "string" ? parsedPayload.code : normalizedCode,
    found: parsedPayload.found === true,
    hasImage: parsedPayload.hasImage === true,
    imageUrl: typeof parsedPayload.imageUrl === "string" ? parsedPayload.imageUrl : "",
    description:
      typeof parsedPayload.description === "string" ? parsedPayload.description : undefined,
  };
}
