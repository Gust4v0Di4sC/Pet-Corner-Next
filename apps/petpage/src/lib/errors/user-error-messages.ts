type UserErrorMessageOptions = {
  permissionMessage?: string;
  networkMessage?: string;
};

const TECHNICAL_ERROR_PATTERNS = [
  /firebase/i,
  /firestore/i,
  /cloudflare/i,
  /worker/i,
  /payload/i,
  /bucket/i,
  /gemini/i,
  /cosmos/i,
  /stripe/i,
  /api/i,
  /http/i,
  /status\s*\d{3}/i,
  /\b\d{3}\b/,
  /missing or insufficient permissions/i,
  /permission-denied/i,
  /insufficient permissions/i,
  /failed to fetch/i,
  /networkerror/i,
  /unexpected token/i,
  /json/i,
  /next_public/i,
  /firebase_/i,
  /stripe_/i,
  /abrir sess/i,
  /sess[aã]o do cliente/i,
  /env/i,
  /digest/i,
  /stack/i,
];

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.trim() : "";
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isPermissionError(code: string, message: string): boolean {
  const normalizedMessage = normalizeText(message);
  return (
    code === "permission-denied" ||
    code === "unauthenticated" ||
    normalizedMessage.includes("permission") ||
    normalizedMessage.includes("sem permissao")
  );
}

function isNetworkError(code: string, message: string): boolean {
  const normalizedMessage = normalizeText(message);
  return (
    code === "unavailable" ||
    code === "deadline-exceeded" ||
    code === "auth/network-request-failed" ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("conectar")
  );
}

function isTechnicalMessage(message: string): boolean {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function getUserErrorMessage(
  error: unknown,
  fallbackMessage: string,
  options: UserErrorMessageOptions = {}
): string {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  if (isPermissionError(code, message)) {
    return (
      options.permissionMessage ||
      "Sua sessao expirou ou nao permite essa acao. Entre novamente para continuar."
    );
  }

  if (isNetworkError(code, message)) {
    return (
      options.networkMessage ||
      "Nao foi possivel conectar agora. Verifique sua internet e tente novamente."
    );
  }

  if (!message || isTechnicalMessage(message)) {
    return fallbackMessage;
  }

  return message;
}
