"use client";

import { waitForFirebaseUser } from "@/lib/auth/firebase-auth.adapter";

type WorkerErrorResponse = {
  message?: string;
};

export type CustomerDeliveryChatIntent =
  | "tracking"
  | "faq_delivery"
  | "report_issue"
  | "other";

export type CustomerDeliveryChatRequest = {
  message: string;
  sessionId?: string;
  orderCode?: string;
};

export type CustomerDeliveryChatResponse = {
  answer: string;
  intent: CustomerDeliveryChatIntent;
  matchedOrder?: {
    orderId: string;
    orderCode: string;
    status: string;
    statusLabel: string;
    updatedAtIso: string;
  };
  issueTicketId?: string;
  suggestedActions?: string[];
};

function getWorkerErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as WorkerErrorResponse).message === "string"
  ) {
    const normalizedMessage = (payload as WorkerErrorResponse).message?.trim();
    if (normalizedMessage) {
      return normalizedMessage;
    }
  }

  return fallback;
}

function getCloudflareWorkerBaseUrl(): string {
  const rawValue =
    process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL ||
    process.env.NEXT_PUBLIC_COSMOS_SYNC_URL ||
    process.env.NEXT_PUBLIC_CHAT_WORKER_URL;
  const normalizedValue = String(rawValue ?? "").trim();

  if (!normalizedValue) {
    throw new Error("Configure NEXT_PUBLIC_CLOUDFLARE_WORKER_URL para usar o chat de entrega.");
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

function isCustomerDeliveryChatResponse(payload: unknown): payload is CustomerDeliveryChatResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<CustomerDeliveryChatResponse>;
  return typeof candidate.answer === "string" && typeof candidate.intent === "string";
}

async function getOptionalAuthToken(): Promise<string | null> {
  const firebaseUser = await waitForFirebaseUser({ timeoutMs: 1000 });
  if (!firebaseUser?.uid) {
    return null;
  }

  try {
    return await firebaseUser.getIdToken(true);
  } catch {
    return null;
  }
}

export async function queryCustomerDeliveryChat(
  input: CustomerDeliveryChatRequest
): Promise<CustomerDeliveryChatResponse> {
  const message = input.message.trim();
  if (!message) {
    throw new Error("Digite uma mensagem para o assistente.");
  }

  const idToken = await getOptionalAuthToken();
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  let response: Response;

  try {
    response = await fetch(resolveWorkerEndpoint("/customer/chat/delivery"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        sessionId: input.sessionId,
        orderCode: input.orderCode,
      }),
    });
  } catch {
    throw new Error("Nao foi possivel conectar ao assistente de entrega agora.");
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      getWorkerErrorMessage(payload, "Nao foi possivel consultar o assistente de entrega.")
    );
  }

  if (!isCustomerDeliveryChatResponse(payload)) {
    throw new Error("O assistente de entrega retornou um payload invalido.");
  }

  return payload;
}
