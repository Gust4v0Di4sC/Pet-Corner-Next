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
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Faca login como administrador para sincronizar a Cosmos.");
  }

  const idToken = await user.getIdToken(true);
  let response: Response;

  try {
    response = await fetch(getCosmosSyncUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({}),
    });
  } catch {
    throw new Error(
      "Nao foi possivel conectar ao Worker da Cloudflare. Verifique a URL configurada, o HTTPS do workers.dev e a publicacao do Worker."
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
      getErrorMessage(payload, "Nao foi possivel sincronizar os produtos via Cosmos.")
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray((payload as CosmosCatalogSyncPayload).items)
  ) {
    throw new Error("O Worker da Cloudflare retornou um payload invalido.");
  }

  return payload as CosmosCatalogSyncPayload;
}
