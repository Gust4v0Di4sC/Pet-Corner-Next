import { getChatWorkerUrl } from "../config/runtimeConfig";
import { getFirebaseAuth } from "../firebase";

type ChatWorkerErrorResponse = {
  message?: string;
};

export type ChatQueryPayload = {
  question: string;
  sessionId?: string;
};

export type ChatQueryResult = {
  answer: string;
  intent: string;
  filters: Record<string, unknown> | Array<unknown>;
  rowsSample: Array<Record<string, unknown>>;
  usage?: Record<string, unknown>;
};

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as ChatWorkerErrorResponse).message === "string"
  ) {
    const message = (payload as ChatWorkerErrorResponse).message?.trim();

    if (message) {
      return message;
    }
  }

  return fallback;
}

function resolveChatEndpoint(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.trim();

  if (trimmedBaseUrl.endsWith("/chat/query")) {
    return trimmedBaseUrl;
  }

  return `${trimmedBaseUrl.replace(/\/+$/, "")}/chat/query`;
}

function isChatResponse(payload: unknown): payload is ChatQueryResult {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<ChatQueryResult>;

  return (
    typeof candidate.answer === "string" &&
    typeof candidate.intent === "string" &&
    Array.isArray(candidate.rowsSample) &&
    (Array.isArray(candidate.filters) ||
      (candidate.filters !== null &&
        typeof candidate.filters === "object" &&
        !Array.isArray(candidate.filters)))
  );
}

export async function queryChat(payload: ChatQueryPayload): Promise<ChatQueryResult> {
  const question = payload.question.trim();

  if (!question) {
    throw new Error("Digite uma pergunta para consultar os dados.");
  }

  const auth = await getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Faca login como administrador para consultar o chat.");
  }

  const idToken = await user.getIdToken(true);
  const endpoint = resolveChatEndpoint(getChatWorkerUrl());
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        question,
        sessionId: payload.sessionId,
      }),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao Worker de chat. Verifique a URL configurada e a publicação do Worker."
    );
  }

  let responsePayload: unknown = null;

  try {
    responsePayload = await response.json();
  } catch {
    responsePayload = null;
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(responsePayload, "Não foi possível consultar o chat agora.")
    );
  }

  if (!isChatResponse(responsePayload)) {
    throw new Error("O Worker de chat retornou um payload inválido.");
  }

  return responsePayload;
}
