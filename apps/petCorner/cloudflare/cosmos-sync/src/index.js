import { createRemoteJWKSet, jwtVerify } from "jose";

const COSMOS_API_BASE_URL = "https://api.cosmos.bluesoft.com.br";
const COSMOS_SOURCE_FILE_NAME = "Cosmos API";
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PRODUCT_IMAGE_KEY_PREFIX = "products";
const PRODUCT_IMAGE_ROUTE_PREFIX = "/products/image";
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

const IMAGE_MIME_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

const IMAGE_EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const ALLOWED_IMAGE_MIME_TYPES = new Set(Object.values(IMAGE_MIME_BY_EXTENSION));

const COMMON_PET_SEARCHES = [
  { query: "racao caes", category: "Alimento para Caes" },
  { query: "racao gatos", category: "Alimento para Gatos" },
  { query: "shampoo veterinario", category: "Higiene" },
  { query: "tapete higienico", category: "Higiene" },
  { query: "areia higienica gato", category: "Higiene" },
  { query: "antipulgas", category: "Saude" },
  { query: "vermifugo", category: "Saude" },
  { query: "comedouro pet", category: "Acessorios" },
  { query: "brinquedo cachorro", category: "Brinquedos" },
];

const CHAT_COLLECTION_SCHEMAS = {
  clientes: {
    filterableFields: ["id", "name", "email", "phone", "address"],
    numericFields: ["phone"],
    sampleFields: ["id", "name", "email", "phone", "address", "age"],
    label: "clientes",
  },
  dogs: {
    filterableFields: ["id", "name", "animalType", "breed", "age", "weight"],
    numericFields: ["age", "weight"],
    sampleFields: ["id", "name", "animalType", "breed", "age", "weight"],
    label: "animais",
  },
  prods: {
    filterableFields: ["id", "name", "code", "price", "quantity", "imageUrl"],
    numericFields: ["price", "quantity"],
    sampleFields: ["id", "name", "code", "price", "quantity", "imageUrl"],
    label: "produtos",
  },
  productCatalog: {
    filterableFields: [
      "id",
      "code",
      "codeNormalized",
      "name",
      "brand",
      "category",
      "price",
      "quantity",
      "imageUrl",
      "sourceFileName",
      "isTemplate",
    ],
    numericFields: ["price", "quantity"],
    sampleFields: [
      "id",
      "code",
      "name",
      "brand",
      "category",
      "price",
      "quantity",
      "imageUrl",
      "sourceFileName",
      "isTemplate",
    ],
    label: "catalogo de produtos",
  },
};

const CHAT_RATE_LIMIT_STORE = new Map();
const CHAT_ALLOWED_ACTIONS = new Set(["count", "list", "sum", "avg"]);
const CHAT_ALLOWED_OPERATORS = new Set(["eq", "contains", "gt", "gte", "lt", "lte"]);
const DEFAULT_CHAT_LIMIT = 5;

class HttpError extends Error {
  constructor(status, message, options = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

function toBoundedInteger(value, fallback, min, max) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  const integerValue = Math.trunc(numberValue);
  return Math.min(Math.max(integerValue, min), max);
}

function getChatConfig(env) {
  return {
    model: String(env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL,
    maxQuestionLength: toBoundedInteger(env.CHAT_MAX_QUESTION_LENGTH, 500, 40, 2000),
    maxDocumentsToScan: toBoundedInteger(env.CHAT_MAX_DOCUMENTS_SCAN, 300, 50, 1000),
    maxRowsSample: toBoundedInteger(env.CHAT_MAX_ROWS_SAMPLE, 8, 1, 20),
    maxFilters: toBoundedInteger(env.CHAT_MAX_FILTERS, 3, 1, 6),
    rateLimitWindowMs: toBoundedInteger(env.CHAT_RATE_LIMIT_WINDOW_MS, 60000, 10000, 3600000),
    rateLimitMaxRequests: toBoundedInteger(env.CHAT_RATE_LIMIT_MAX_REQUESTS, 8, 1, 120),
  };
}

function getProductImageConfig(env) {
  return {
    maxBytes: toBoundedInteger(
      env.PRODUCT_IMAGE_MAX_BYTES,
      DEFAULT_PRODUCT_IMAGE_MAX_BYTES,
      128 * 1024,
      20 * 1024 * 1024
    ),
  };
}

function getAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveRequestOrigin(request, env) {
  const requestOrigin = request.headers.get("Origin");
  const allowedOrigins = getAllowedOrigins(env);

  if (!requestOrigin) {
    return allowedOrigins[0] ?? "*";
  }

  if (!allowedOrigins.length || allowedOrigins.includes("*")) {
    return "*";
  }

  return allowedOrigins.includes(requestOrigin) ? requestOrigin : "";
}

function createCorsHeaders(request, env) {
  const allowedOrigin = resolveRequestOrigin(request, env);

  if (!allowedOrigin) {
    return null;
  }

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Max-Age", "86400");

  if (allowedOrigin !== "*") {
    headers.set("Vary", "Origin");
  }

  return headers;
}

function jsonResponse(request, env, body, init = {}) {
  const corsHeaders = createCorsHeaders(request, env);

  if (!corsHeaders) {
    return new Response(JSON.stringify({ message: "Origem nao autorizada." }), {
      status: 403,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");

  corsHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function responseWithCors(request, env, body, init = {}) {
  const corsHeaders = createCorsHeaders(request, env);

  if (!corsHeaders) {
    return new Response(null, { status: 403 });
  }

  const headers = new Headers(init.headers);

  corsHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  return new Response(body, {
    ...init,
    headers,
  });
}

function normalizePathname(pathname) {
  const normalizedPathname = String(pathname ?? "").replace(/\/+$/, "");
  return normalizedPathname || "/";
}

function getBearerToken(request) {
  const authorization = request.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Envie um token Firebase valido no header Authorization.");
  }

  return token;
}

async function verifyAdminFirebaseToken(token, env) {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new HttpError(500, "A variavel FIREBASE_PROJECT_ID nao foi configurada no Worker.");
  }

  try {
    const verifiedToken = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });
    const payload = verifiedToken.payload;

    if (payload.admin !== true) {
      throw new HttpError(403, "Acesso restrito a administradores.");
    }

    return payload;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, "Token Firebase invalido ou expirado.");
  }
}

function normalizeCatalogCode(code) {
  return String(code ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function parseNumericValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const textValue = String(value ?? "").trim();

  if (!textValue) {
    return null;
  }

  let normalizedValue = textValue.replace(/\s+/g, "").replace(/[^\d,.-]/g, "");
  const hasComma = normalizedValue.includes(",");
  const hasDot = normalizedValue.includes(".");

  if (hasComma && hasDot) {
    normalizedValue =
      normalizedValue.lastIndexOf(",") > normalizedValue.lastIndexOf(".")
        ? normalizedValue.replace(/\./g, "").replace(",", ".")
        : normalizedValue.replace(/,/g, "");
  } else if (hasComma) {
    normalizedValue = normalizedValue.replace(/\./g, "").replace(",", ".");
  } else {
    normalizedValue = normalizedValue.replace(/,/g, "");
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function extractCode(product) {
  const code = String(product?.gtin ?? product?.ean ?? "").trim();
  return /^\d+$/.test(code) ? code : "";
}

function extractBrand(product) {
  if (typeof product?.brand === "string" && product.brand.trim()) {
    return product.brand.trim();
  }

  if (
    product?.brand &&
    typeof product.brand === "object" &&
    typeof product.brand.name === "string"
  ) {
    return product.brand.name.trim() || undefined;
  }

  return undefined;
}

function getValidHttpImageUrl(candidate) {
  if (typeof candidate !== "string") {
    return undefined;
  }

  const trimmedCandidate = candidate.trim();

  if (!trimmedCandidate) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(trimmedCandidate);

    if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") {
      return parsedUrl.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function extractImageUrl(product) {
  const directCandidates = [
    product?.thumbnail,
    product?.thumbnail_url,
    product?.image,
    product?.image_url,
    product?.photo,
    product?.picture,
  ];

  for (const candidate of directCandidates) {
    const resolvedUrl = getValidHttpImageUrl(candidate);

    if (resolvedUrl) {
      return resolvedUrl;
    }
  }

  const nestedCandidates = [
    product?.images,
    product?.photos,
    product?.pictures,
    product?.gallery,
  ];

  for (const collection of nestedCandidates) {
    if (!Array.isArray(collection) || !collection.length) {
      continue;
    }

    const [firstItem] = collection;
    const directUrl = getValidHttpImageUrl(firstItem);

    if (directUrl) {
      return directUrl;
    }

    if (firstItem && typeof firstItem === "object") {
      const nestedUrlCandidates = [firstItem.url, firstItem.image, firstItem.src, firstItem.href];

      for (const nestedCandidate of nestedUrlCandidates) {
        const resolvedUrl = getValidHttpImageUrl(nestedCandidate);

        if (resolvedUrl) {
          return resolvedUrl;
        }
      }
    }
  }

  return undefined;
}

function normalizeMimeType(contentType) {
  return String(contentType ?? "")
    .trim()
    .toLowerCase()
    .split(";")[0]
    .trim();
}

function normalizeSupportedImageMimeType(contentType) {
  const normalizedMimeType = normalizeMimeType(contentType);

  if (normalizedMimeType === "image/jpg" || normalizedMimeType === "image/pjpeg") {
    return "image/jpeg";
  }

  return normalizedMimeType;
}

function getFileExtensionFromName(fileName) {
  const normalizedName = String(fileName ?? "")
    .trim()
    .toLowerCase();
  const lastDotIndex = normalizedName.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === normalizedName.length - 1) {
    return "";
  }

  return normalizedName.slice(lastDotIndex + 1);
}

function resolveImageMimeType(rawContentType, fileName) {
  const normalizedMimeType = normalizeSupportedImageMimeType(rawContentType);

  if (ALLOWED_IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    return normalizedMimeType;
  }

  const extension = getFileExtensionFromName(fileName);
  const mimeTypeFromExtension = IMAGE_MIME_BY_EXTENSION[extension];

  if (mimeTypeFromExtension) {
    return mimeTypeFromExtension;
  }

  throw new HttpError(400, "Formato de imagem nao suportado. Use JPG, PNG, WEBP, GIF ou AVIF.");
}

function resolveImageExtension(rawContentType, fileName) {
  const normalizedMimeType = normalizeSupportedImageMimeType(rawContentType);

  if (normalizedMimeType && IMAGE_EXTENSION_BY_MIME[normalizedMimeType]) {
    return IMAGE_EXTENSION_BY_MIME[normalizedMimeType];
  }

  const extension = getFileExtensionFromName(fileName);

  if (extension && IMAGE_MIME_BY_EXTENSION[extension]) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  throw new HttpError(400, "Nao foi possivel identificar a extensao da imagem enviada.");
}

function slugifyPathSegment(value, fallback) {
  const normalizedValue = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalizedValue || fallback;
}

function ensureProductImagesBucket(env) {
  if (!env.PRODUCT_IMAGES_BUCKET) {
    throw new HttpError(
      500,
      "O binding PRODUCT_IMAGES_BUCKET ainda nao foi configurado no Worker."
    );
  }

  return env.PRODUCT_IMAGES_BUCKET;
}

function sanitizeR2Key(rawKey) {
  const sanitizedKey = String(rawKey ?? "").trim().replace(/^\/+|\/+$/g, "");

  if (!sanitizedKey || sanitizedKey.includes("..")) {
    throw new HttpError(400, "Chave de imagem invalida.");
  }

  return sanitizedKey;
}

function encodePathSegments(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function createProductImageKey({ userId, codeHint, extension }) {
  const safeUserSegment = slugifyPathSegment(userId, "admin");
  const safeCodeSegment = slugifyPathSegment(codeHint, "produto");
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const randomSegment = crypto.randomUUID().slice(0, 8);

  return `${PRODUCT_IMAGE_KEY_PREFIX}/${safeUserSegment}/${safeCodeSegment}-${timestamp}-${randomSegment}.${extension}`;
}

function getProductImageRouteUrl(request, key) {
  const requestUrl = new URL(request.url);
  const encodedKey = encodePathSegments(key);
  return `${requestUrl.origin}${PRODUCT_IMAGE_ROUTE_PREFIX}/${encodedKey}`;
}

function buildProductImageUrl(request, env, key) {
  const publicBaseUrl = String(env.PRODUCT_IMAGES_PUBLIC_BASE_URL ?? "").trim();

  if (publicBaseUrl) {
    const normalizedPublicBaseUrl = publicBaseUrl.replace(/\/+$/, "");
    const encodedKey = encodePathSegments(key);
    return `${normalizedPublicBaseUrl}/${encodedKey}`;
  }

  return getProductImageRouteUrl(request, key);
}

function parseProductImageImportUrl(rawUrl) {
  const normalizedUrl = String(rawUrl ?? "").trim();

  if (!normalizedUrl) {
    throw new HttpError(400, "Informe uma URL de imagem para importar.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    throw new HttpError(400, "URL de imagem invalida.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new HttpError(400, "Use apenas URLs HTTP(S) para importar imagem.");
  }

  const lowerCaseHostname = parsedUrl.hostname.toLowerCase();

  if (["localhost", "127.0.0.1", "::1"].includes(lowerCaseHostname)) {
    throw new HttpError(400, "Hostname da URL de imagem nao permitido.");
  }

  return parsedUrl.toString();
}

async function fetchImageBufferFromUrl(sourceUrl, maxBytes) {
  const response = await fetch(sourceUrl, {
    method: "GET",
  });

  if (!response.ok) {
    throw new HttpError(
      400,
      `Nao foi possivel baixar a imagem de origem (status ${response.status}).`
    );
  }

  const contentType = resolveImageMimeType(
    response.headers.get("content-type"),
    sourceUrl
  );
  const contentLengthHeader = response.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;

  if (contentLength !== null && Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new HttpError(413, `Imagem maior que o limite permitido (${maxBytes} bytes).`);
  }

  const imageBuffer = await response.arrayBuffer();

  if (imageBuffer.byteLength > maxBytes) {
    throw new HttpError(413, `Imagem maior que o limite permitido (${maxBytes} bytes).`);
  }

  if (!imageBuffer.byteLength) {
    throw new HttpError(400, "A URL informada nao retornou uma imagem valida.");
  }

  return {
    imageBuffer,
    contentType,
    extension: resolveImageExtension(contentType, sourceUrl),
  };
}

function normalizeCosmosProduct(product, fallbackCategory) {
  const code = extractCode(product);
  const name = String(product?.description ?? "").trim();
  const price =
    parseNumericValue(product?.avg_price) ??
    parseNumericValue(product?.max_price) ??
    parseNumericValue(product?.min_price) ??
    parseNumericValue(product?.price);

  if (!code || !name || price === null) {
    return null;
  }

  const category =
    typeof product?.gpc?.description === "string" && product.gpc.description.trim()
      ? product.gpc.description.trim()
      : fallbackCategory;

  return {
    code,
    codeNormalized: normalizeCatalogCode(code),
    name,
    price,
    quantity: undefined,
    brand: extractBrand(product),
    category,
    imageUrl: extractImageUrl(product),
    sourceFileName: COSMOS_SOURCE_FILE_NAME,
    isTemplate: false,
  };
}

async function fetchCosmosSearch(query, env) {
  const endpoint = new URL("/products", COSMOS_API_BASE_URL);

  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("per_page", "90");
  endpoint.searchParams.set("page", "1");

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Cosmos-Token": env.COSMOS_API_TOKEN,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new HttpError(500, "Token da Cosmos invalido ou sem permissao para consultar a API.");
  }

  if (!response.ok) {
    throw new HttpError(
      500,
      `A API da Cosmos retornou erro ${response.status} durante a sincronizacao.`
    );
  }

  const payload = await response.json();

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.products)) {
    return payload.products;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function findCosmosProductByCode(products, code) {
  if (!Array.isArray(products) || !products.length) {
    return null;
  }

  const normalizedCode = normalizeCatalogCode(code);
  const exactMatch = products.find(
    (product) => normalizeCatalogCode(extractCode(product)) === normalizedCode
  );

  if (exactMatch) {
    return exactMatch;
  }

  const imageFirstMatch = products.find((product) => Boolean(extractImageUrl(product)));

  return imageFirstMatch ?? products[0] ?? null;
}

async function buildCatalogFromCosmos(env) {
  const catalogItems = new Map();
  let totalRows = 0;

  for (const search of COMMON_PET_SEARCHES) {
    const products = await fetchCosmosSearch(search.query, env);
    totalRows += products.length;

    products.forEach((product) => {
      const normalizedProduct = normalizeCosmosProduct(product, search.category);

      if (normalizedProduct) {
        catalogItems.set(normalizedProduct.codeNormalized, normalizedProduct);
      }
    });
  }

  const items = Array.from(catalogItems.values());

  if (!items.length) {
    throw new HttpError(500, "A Cosmos respondeu, mas nao retornou produtos validos para sincronizar.");
  }

  return {
    items,
    totalRows,
    validRows: items.length,
    ignored: Math.max(totalRows - items.length, 0),
    sourceFileName: COSMOS_SOURCE_FILE_NAME,
  };
}

function looksLikePromptInjection(question) {
  return /\b(ignore|ignora|ignore all|system prompt|prompt interno|regras internas|api key|token|segredo|senha)\b/i.test(
    question
  );
}

function inferCollectionFromQuestion(question) {
  const normalizedQuestion = question.toLowerCase();

  if (/\bcliente(s)?\b/.test(normalizedQuestion)) {
    return "clientes";
  }

  if (/\b(animal|animais|cao|cachorro|dog|gato)\b/.test(normalizedQuestion)) {
    return "dogs";
  }

  if (/\b(catalogo|cosmos)\b/.test(normalizedQuestion)) {
    return "productCatalog";
  }

  if (/\b(produto|produtos|estoque)\b/.test(normalizedQuestion)) {
    return "prods";
  }

  return null;
}

function createFallbackIntent(question) {
  const collection = inferCollectionFromQuestion(question);

  if (!collection) {
    return null;
  }

  if (/\b(media|average)\b/i.test(question)) {
    return { action: "avg", collection };
  }

  if (/\b(soma|somatorio|somat[oó]rio|total de)\b/i.test(question)) {
    return { action: "sum", collection };
  }

  if (/\b(lista|listar|mostre|mostrar|quais|quais sao)\b/i.test(question)) {
    return { action: "list", collection, limit: 5 };
  }

  return { action: "count", collection };
}

function buildCollectionSummaryText() {
  return Object.entries(CHAT_COLLECTION_SCHEMAS)
    .map(([collection, schema]) => {
      const filterableFields = schema.filterableFields.join(", ");
      const numericFields = schema.numericFields.length ? schema.numericFields.join(", ") : "nenhum";
      return `- ${collection}: filtros [${filterableFields}] | campos numericos [${numericFields}]`;
    })
    .join("\n");
}

function buildIntentPrompt(question) {
  return [
    "Voce e um classificador de consultas do sistema PetCorner.",
    "Retorne SOMENTE um JSON valido, sem markdown e sem texto adicional.",
    "Schema obrigatorio:",
    '{ "action": "count|list|sum|avg", "collection": "clientes|dogs|prods|productCatalog", "filters": [{ "field": "campo", "op": "eq|contains|gt|gte|lt|lte", "value": "valor" }], "numericField": "campo numerico opcional", "limit": 5 }',
    "Use apenas colecoes e campos permitidos.",
    "Colecoes permitidas:",
    buildCollectionSummaryText(),
    "Se a pergunta nao for uma consulta de dados da pet shop, retorne:",
    '{ "action": "blocked", "collection": null, "filters": [], "limit": 0 }',
    `Pergunta: ${question}`,
  ].join("\n");
}

function extractGeminiText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const firstCandidate = candidates[0];
  const parts = Array.isArray(firstCandidate?.content?.parts) ? firstCandidate.content.parts : [];
  const textPart = parts.find((part) => typeof part?.text === "string");
  return textPart?.text ?? "";
}

function tryParseModelJson(rawText) {
  const sanitizedText = String(rawText ?? "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!sanitizedText) {
    return null;
  }

  try {
    return JSON.parse(sanitizedText);
  } catch {
    return null;
  }
}

async function inferIntentWithGemini(question, env, chatConfig) {
  const endpoint = `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(
    chatConfig.model
  )}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildIntentPrompt(question) }],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 512,
        responseMimeType: "application/json",
      },
    }),
  });

  if (response.status === 429) {
    throw new HttpError(429, "Limite de cota do Gemini atingido. Tente novamente em instantes.");
  }

  if (!response.ok) {
    throw new Error(`Falha ao consultar o Gemini (status ${response.status}).`);
  }

  const payload = await response.json();
  const responseText = extractGeminiText(payload);
  const parsedResponse = tryParseModelJson(responseText);

  if (!parsedResponse || typeof parsedResponse !== "object") {
    throw new Error("O Gemini retornou uma resposta invalida para classificacao.");
  }

  return parsedResponse;
}

function normalizeFilterOperator(operator) {
  const normalizedOperator = String(operator ?? "")
    .trim()
    .toLowerCase();

  if (!normalizedOperator) {
    return "eq";
  }

  const mappedOperator =
    normalizedOperator === "==" || normalizedOperator === "="
      ? "eq"
      : normalizedOperator === "equals"
        ? "eq"
        : normalizedOperator;

  return CHAT_ALLOWED_OPERATORS.has(mappedOperator) ? mappedOperator : "eq";
}

function normalizeFilterValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

function normalizeAction(rawAction) {
  const normalizedAction = String(rawAction ?? "")
    .trim()
    .toLowerCase();

  if (!normalizedAction) {
    return "count";
  }

  if (normalizedAction === "count_docs") {
    return "count";
  }

  if (normalizedAction === "list_docs") {
    return "list";
  }

  if (normalizedAction === "sum_field") {
    return "sum";
  }

  if (normalizedAction === "average" || normalizedAction === "mean") {
    return "avg";
  }

  return CHAT_ALLOWED_ACTIONS.has(normalizedAction) ? normalizedAction : "count";
}

function sanitizeIntent(rawIntent, question, chatConfig) {
  if (looksLikePromptInjection(question)) {
    throw new HttpError(400, "Pergunta bloqueada por politica de seguranca do chat.");
  }

  if (!rawIntent || typeof rawIntent !== "object") {
    throw new HttpError(400, "Nao foi possivel interpretar a pergunta dentro do escopo permitido.");
  }

  const intent = rawIntent;
  const action = normalizeAction(intent.action ?? intent.intent);

  if (String(intent.action ?? "").trim().toLowerCase() === "blocked") {
    throw new HttpError(400, "Pergunta fora do escopo permitido para consulta.");
  }

  const rawCollection = String(intent.collection ?? "")
    .trim()
    .toLowerCase();
  const collection = CHAT_COLLECTION_SCHEMAS[rawCollection]
    ? rawCollection
    : inferCollectionFromQuestion(question);

  if (!collection || !CHAT_COLLECTION_SCHEMAS[collection]) {
    throw new HttpError(400, "Pergunta fora do escopo permitido para consulta.");
  }

  const schema = CHAT_COLLECTION_SCHEMAS[collection];
  const rawFilters = Array.isArray(intent.filters) ? intent.filters : [];
  const filters = rawFilters
    .slice(0, chatConfig.maxFilters)
    .map((rawFilter) => {
      if (!rawFilter || typeof rawFilter !== "object") {
        return null;
      }

      const field = String(rawFilter.field ?? "")
        .trim()
        .replace(/\s+/g, "");
      const operator = normalizeFilterOperator(rawFilter.op ?? rawFilter.operator);
      const value = normalizeFilterValue(rawFilter.value);

      if (!field || !schema.filterableFields.includes(field) || value === null || value === "") {
        return null;
      }

      return {
        field,
        op: operator,
        value,
      };
    })
    .filter(Boolean);

  const limit = toBoundedInteger(intent.limit, DEFAULT_CHAT_LIMIT, 1, 20);

  let numericField = String(intent.numericField ?? intent.field ?? "")
    .trim()
    .replace(/\s+/g, "");

  if ((action === "sum" || action === "avg") && !schema.numericFields.includes(numericField)) {
    numericField = schema.numericFields[0] ?? "";
  }

  if ((action === "sum" || action === "avg") && !numericField) {
    throw new HttpError(400, "Nao existe campo numerico valido para essa consulta.");
  }

  return {
    action,
    collection,
    filters,
    limit,
    numericField,
  };
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("nullValue" in value) {
    return null;
  }

  if ("stringValue" in value) {
    return String(value.stringValue);
  }

  if ("integerValue" in value) {
    const parsedNumber = Number(value.integerValue);
    return Number.isFinite(parsedNumber) ? parsedNumber : value.integerValue;
  }

  if ("doubleValue" in value) {
    const parsedNumber = Number(value.doubleValue);
    return Number.isFinite(parsedNumber) ? parsedNumber : null;
  }

  if ("booleanValue" in value) {
    return Boolean(value.booleanValue);
  }

  if ("timestampValue" in value) {
    return String(value.timestampValue);
  }

  if ("referenceValue" in value) {
    return String(value.referenceValue);
  }

  if ("arrayValue" in value) {
    const values = Array.isArray(value.arrayValue?.values) ? value.arrayValue.values : [];
    return values.map((item) => decodeFirestoreValue(item));
  }

  if ("mapValue" in value) {
    const fields = value.mapValue?.fields && typeof value.mapValue.fields === "object"
      ? value.mapValue.fields
      : {};
    return decodeFirestoreFields(fields);
  }

  return null;
}

function decodeFirestoreFields(fields) {
  const decoded = {};
  const sourceFields = fields && typeof fields === "object" ? fields : {};

  Object.entries(sourceFields).forEach(([fieldName, fieldValue]) => {
    decoded[fieldName] = decodeFirestoreValue(fieldValue);
  });

  return decoded;
}

function decodeFirestoreDocument(document) {
  const documentName = String(document?.name ?? "");
  const pathParts = documentName.split("/");
  const id = pathParts[pathParts.length - 1] || "";

  return {
    id,
    ...decodeFirestoreFields(document?.fields),
  };
}

function toComparableNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value.replace(",", "."));
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function matchesFilter(record, filter) {
  const leftValue = record?.[filter.field];
  const rightValue = filter.value;

  if (leftValue === undefined || leftValue === null) {
    return false;
  }

  if (filter.op === "contains") {
    return String(leftValue).toLowerCase().includes(String(rightValue).toLowerCase());
  }

  if (filter.op === "eq") {
    if (typeof leftValue === "string" || typeof rightValue === "string") {
      return String(leftValue).toLowerCase() === String(rightValue).toLowerCase();
    }

    return leftValue === rightValue;
  }

  const leftNumber = toComparableNumber(leftValue);
  const rightNumber = toComparableNumber(rightValue);

  if (leftNumber === null || rightNumber === null) {
    return false;
  }

  if (filter.op === "gt") {
    return leftNumber > rightNumber;
  }

  if (filter.op === "gte") {
    return leftNumber >= rightNumber;
  }

  if (filter.op === "lt") {
    return leftNumber < rightNumber;
  }

  if (filter.op === "lte") {
    return leftNumber <= rightNumber;
  }

  return false;
}

function applyFilters(records, filters) {
  if (!filters.length) {
    return records;
  }

  return records.filter((record) => filters.every((filter) => matchesFilter(record, filter)));
}

function truncateValue(value, depth = 0) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > 180 ? `${value.slice(0, 177)}...` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth >= 2) {
      return value.slice(0, 3);
    }

    return value.slice(0, 5).map((item) => truncateValue(item, depth + 1));
  }

  if (typeof value === "object") {
    if (depth >= 2) {
      return "[objeto]";
    }

    const compactObject = {};
    Object.entries(value)
      .slice(0, 8)
      .forEach(([key, nestedValue]) => {
        compactObject[key] = truncateValue(nestedValue, depth + 1);
      });

    return compactObject;
  }

  return String(value);
}

function buildRowsSample(records, collection, maxRows) {
  const schema = CHAT_COLLECTION_SCHEMAS[collection];
  const sampleFields = schema?.sampleFields ?? [];

  return records.slice(0, maxRows).map((record) => {
    const sample = {};

    sampleFields.forEach((field) => {
      if (field in record) {
        sample[field] = truncateValue(record[field]);
      }
    });

    return sample;
  });
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

function executeIntent(intent, records, chatConfig) {
  const filteredRecords = applyFilters(records, intent.filters);
  const schema = CHAT_COLLECTION_SCHEMAS[intent.collection];
  const rowsSample = buildRowsSample(filteredRecords, intent.collection, Math.min(intent.limit, chatConfig.maxRowsSample));
  let answer = "";

  if (intent.action === "count") {
    answer = `Encontrei ${formatNumber(filteredRecords.length, 0)} registro(s) em ${schema.label}.`;
  } else if (intent.action === "list") {
    if (!filteredRecords.length) {
      answer = `Nao encontrei registros em ${schema.label} com os filtros solicitados.`;
    } else {
      answer = `Encontrei ${formatNumber(
        filteredRecords.length,
        0
      )} registro(s) em ${schema.label} e trouxe ${formatNumber(rowsSample.length, 0)} exemplo(s).`;
    }
  } else if (intent.action === "sum" || intent.action === "avg") {
    const numericValues = filteredRecords
      .map((record) => toComparableNumber(record[intent.numericField]))
      .filter((value) => value !== null);

    if (!numericValues.length) {
      answer = `Nao ha valores numericos suficientes no campo ${intent.numericField} para calcular ${
        intent.action === "sum" ? "a soma" : "a media"
      }.`;
    } else if (intent.action === "sum") {
      const sum = numericValues.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      answer = `A soma de ${intent.numericField} em ${schema.label} e ${formatNumber(sum, 2)}.`;
    } else {
      const sum = numericValues.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
      const average = sum / numericValues.length;
      answer = `A media de ${intent.numericField} em ${schema.label} e ${formatNumber(average, 2)}.`;
    }
  }

  return {
    answer,
    intentLabel: `${intent.action}:${intent.collection}`,
    rowsSample,
    matchedDocuments: filteredRecords.length,
  };
}

async function fetchCollectionDocuments(collection, idToken, env, chatConfig) {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new HttpError(500, "A variavel FIREBASE_PROJECT_ID nao foi configurada no Worker.");
  }

  const endpointBase = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}`;
  const records = [];
  let nextPageToken = "";
  let hasMoreDocuments = false;

  while (records.length < chatConfig.maxDocumentsToScan) {
    const pageSize = Math.min(100, chatConfig.maxDocumentsToScan - records.length);
    const endpoint = new URL(endpointBase);
    endpoint.searchParams.set("pageSize", String(pageSize));

    if (nextPageToken) {
      endpoint.searchParams.set("pageToken", nextPageToken);
    }

    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(401, "Sem permissao para consultar o Firestore com o token atual.");
    }

    if (!response.ok) {
      throw new HttpError(
        response.status >= 400 && response.status < 500 ? response.status : 500,
        "Falha ao consultar dados no Firestore."
      );
    }

    const payload = await response.json();
    const documents = Array.isArray(payload?.documents) ? payload.documents : [];

    documents.forEach((document) => {
      records.push(decodeFirestoreDocument(document));
    });

    nextPageToken = typeof payload?.nextPageToken === "string" ? payload.nextPageToken : "";

    if (!nextPageToken) {
      hasMoreDocuments = false;
      break;
    }

    hasMoreDocuments = true;

    if (!documents.length) {
      break;
    }
  }

  return {
    records,
    documentsRead: records.length,
    truncated: hasMoreDocuments || records.length >= chatConfig.maxDocumentsToScan,
  };
}

function applyRateLimit(userId, chatConfig) {
  const now = Date.now();
  const bucketKey = String(userId || "anonymous");
  const windowStart = now - chatConfig.rateLimitWindowMs;
  const previousRequests = CHAT_RATE_LIMIT_STORE.get(bucketKey) ?? [];
  const validRequests = previousRequests.filter((timestamp) => timestamp > windowStart);

  if (validRequests.length >= chatConfig.rateLimitMaxRequests) {
    const retryAfterMs = validRequests[0] + chatConfig.rateLimitWindowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  validRequests.push(now);
  CHAT_RATE_LIMIT_STORE.set(bucketKey, validRequests);

  return {
    allowed: true,
    remaining: Math.max(chatConfig.rateLimitMaxRequests - validRequests.length, 0),
    retryAfterSeconds: 0,
  };
}

async function parseRequestBody(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Envie o corpo da requisicao em JSON valido.");
  }
}

async function parseMultipartBody(request) {
  try {
    return await request.formData();
  } catch {
    throw new HttpError(400, "Envie o upload em multipart/form-data.");
  }
}

function isFileLike(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.arrayBuffer === "function" &&
    typeof value.size === "number"
  );
}

function toHttpError(error, fallbackMessage) {
  if (error instanceof HttpError) {
    return error;
  }

  const message = error instanceof Error && error.message ? error.message : fallbackMessage;
  return new HttpError(500, message);
}

function respondWithError(request, env, error, fallbackMessage) {
  const httpError = toHttpError(error, fallbackMessage);
  const headers = new Headers();

  if (httpError.status === 429 && httpError.retryAfterSeconds) {
    headers.set("Retry-After", String(httpError.retryAfterSeconds));
  }

  return jsonResponse(
    request,
    env,
    { message: httpError.message },
    {
      status: httpError.status,
      headers,
    }
  );
}

async function storeProductImage({
  request,
  env,
  userId,
  codeHint,
  imageBuffer,
  contentType,
  extension,
  source,
  originalUrl,
}) {
  const bucket = ensureProductImagesBucket(env);
  const key = createProductImageKey({
    userId,
    codeHint,
    extension,
  });

  await bucket.put(key, imageBuffer, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      source,
      uploadedBy: userId,
      originalUrl: originalUrl ?? "",
    },
  });

  return {
    imageUrl: buildProductImageUrl(request, env, key),
    key,
    contentType,
    size: imageBuffer.byteLength,
    source,
    ...(originalUrl ? { originalUrl } : {}),
  };
}

async function handleProductImageUpload(request, env) {
  if (request.method !== "POST") {
    return jsonResponse(
      request,
      env,
      { message: "Use POST para enviar imagens de produtos." },
      { status: 405 }
    );
  }

  const imageConfig = getProductImageConfig(env);

  try {
    const idToken = getBearerToken(request);
    const tokenPayload = await verifyAdminFirebaseToken(idToken, env);
    const userId = String(tokenPayload.user_id ?? tokenPayload.sub ?? "admin");
    const formData = await parseMultipartBody(request);
    const fileField = formData.get("file");

    if (!isFileLike(fileField)) {
      throw new HttpError(400, "Selecione uma imagem no campo file.");
    }

    const file = fileField;
    const fileName = String(file.name ?? "produto-imagem");
    const contentType = resolveImageMimeType(file.type, fileName);
    const extension = resolveImageExtension(contentType, fileName);

    if (file.size <= 0) {
      throw new HttpError(400, "A imagem enviada esta vazia.");
    }

    if (file.size > imageConfig.maxBytes) {
      throw new HttpError(
        413,
        `Imagem maior que o limite permitido (${imageConfig.maxBytes} bytes).`
      );
    }

    const imageBuffer = await file.arrayBuffer();

    if (!imageBuffer.byteLength) {
      throw new HttpError(400, "A imagem enviada esta vazia.");
    }

    if (imageBuffer.byteLength > imageConfig.maxBytes) {
      throw new HttpError(
        413,
        `Imagem maior que o limite permitido (${imageConfig.maxBytes} bytes).`
      );
    }

    const codeHint = String(formData.get("code") ?? "").trim() || "produto";
    const payload = await storeProductImage({
      request,
      env,
      userId,
      codeHint,
      imageBuffer,
      contentType,
      extension,
      source: "upload",
    });

    return jsonResponse(request, env, payload, { status: 200 });
  } catch (error) {
    return respondWithError(
      request,
      env,
      error,
      "Nao foi possivel enviar a imagem para o bucket."
    );
  }
}

async function handleProductImageImportUrl(request, env) {
  if (request.method !== "POST") {
    return jsonResponse(
      request,
      env,
      { message: "Use POST para importar imagem por URL." },
      { status: 405 }
    );
  }

  const imageConfig = getProductImageConfig(env);

  try {
    const idToken = getBearerToken(request);
    const tokenPayload = await verifyAdminFirebaseToken(idToken, env);
    const userId = String(tokenPayload.user_id ?? tokenPayload.sub ?? "admin");
    const body = await parseRequestBody(request);
    const sourceUrl = parseProductImageImportUrl(body?.sourceUrl);
    const codeHint = String(body?.code ?? "").trim() || "produto";
    const { imageBuffer, contentType, extension } = await fetchImageBufferFromUrl(
      sourceUrl,
      imageConfig.maxBytes
    );
    const payload = await storeProductImage({
      request,
      env,
      userId,
      codeHint,
      imageBuffer,
      contentType,
      extension,
      source: "remote",
      originalUrl: sourceUrl,
    });

    return jsonResponse(request, env, payload, { status: 200 });
  } catch (error) {
    return respondWithError(
      request,
      env,
      error,
      "Nao foi possivel importar a imagem para o bucket."
    );
  }
}

async function handleProductImageGet(request, env, encodedImageKey) {
  if (request.method !== "GET") {
    return jsonResponse(
      request,
      env,
      { message: "Use GET para obter imagens de produtos." },
      { status: 405 }
    );
  }

  try {
    const bucket = ensureProductImagesBucket(env);
    const imageKey = sanitizeR2Key(decodeURIComponent(String(encodedImageKey ?? "")));
    const imageObject = await bucket.get(imageKey);

    if (!imageObject) {
      throw new HttpError(404, "Imagem nao encontrada.");
    }

    const headers = new Headers();
    imageObject.writeHttpMetadata(headers);
    headers.set("ETag", imageObject.httpEtag);
    headers.set("Cache-Control", headers.get("Cache-Control") ?? "public, max-age=31536000, immutable");
    headers.set("Content-Type", headers.get("Content-Type") ?? "application/octet-stream");

    return responseWithCors(request, env, imageObject.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return respondWithError(request, env, error, "Nao foi possivel obter a imagem solicitada.");
  }
}

async function handleCosmosSync(request, env) {
  if (request.method !== "POST") {
    return jsonResponse(
      request,
      env,
      { message: "Use POST para sincronizar o catalogo da Cosmos." },
      { status: 405 }
    );
  }

  if (!env.COSMOS_API_TOKEN) {
    return jsonResponse(
      request,
      env,
      { message: "O segredo COSMOS_API_TOKEN ainda nao foi configurado no Worker." },
      { status: 500 }
    );
  }

  try {
    const token = getBearerToken(request);
    await verifyAdminFirebaseToken(token, env);
    const payload = await buildCatalogFromCosmos(env);
    return jsonResponse(request, env, payload, { status: 200 });
  } catch (error) {
    return respondWithError(
      request,
      env,
      error,
      "Nao foi possivel sincronizar o catalogo da Cosmos."
    );
  }
}

async function handleCosmosProductImage(request, env) {
  if (request.method !== "POST") {
    return jsonResponse(
      request,
      env,
      { message: "Use POST para consultar imagem de produto na Cosmos." },
      { status: 405 }
    );
  }

  if (!env.COSMOS_API_TOKEN) {
    return jsonResponse(
      request,
      env,
      { message: "O segredo COSMOS_API_TOKEN ainda nao foi configurado no Worker." },
      { status: 500 }
    );
  }

  try {
    const idToken = getBearerToken(request);
    await verifyAdminFirebaseToken(idToken, env);

    const body = await parseRequestBody(request);
    const code = normalizeCatalogCode(body?.code);

    if (!code || code.length < 3) {
      throw new HttpError(400, "Informe um codigo valido para buscar imagem na Cosmos.");
    }

    const products = await fetchCosmosSearch(code, env);
    const matchedProduct = findCosmosProductByCode(products, code);
    const imageUrl = matchedProduct ? extractImageUrl(matchedProduct) ?? "" : "";
    const resolvedCode = matchedProduct ? extractCode(matchedProduct) || code : code;
    const description = matchedProduct
      ? String(matchedProduct.description ?? "").trim() || undefined
      : undefined;

    return jsonResponse(
      request,
      env,
      {
        code: resolvedCode,
        found: Boolean(matchedProduct),
        hasImage: Boolean(imageUrl),
        imageUrl,
        description,
      },
      { status: 200 }
    );
  } catch (error) {
    return respondWithError(
      request,
      env,
      error,
      "Nao foi possivel consultar imagem do produto na Cosmos."
    );
  }
}

async function handleChatQuery(request, env) {
  if (request.method !== "POST") {
    return jsonResponse(
      request,
      env,
      { message: "Use POST para consultar o chat." },
      { status: 405 }
    );
  }

  if (!env.GEMINI_API_KEY) {
    return jsonResponse(
      request,
      env,
      { message: "O segredo GEMINI_API_KEY ainda nao foi configurado no Worker." },
      { status: 500 }
    );
  }

  const chatConfig = getChatConfig(env);

  try {
    const body = await parseRequestBody(request);
    const question = String(body?.question ?? "").trim();

    if (!question) {
      throw new HttpError(400, "Informe uma pergunta no campo question.");
    }

    if (question.length > chatConfig.maxQuestionLength) {
      throw new HttpError(
        400,
        `Pergunta muito longa. Limite atual: ${chatConfig.maxQuestionLength} caracteres.`
      );
    }

    const idToken = getBearerToken(request);
    const tokenPayload = await verifyAdminFirebaseToken(idToken, env);
    const userId = String(tokenPayload.user_id ?? tokenPayload.sub ?? "admin");
    const rateLimit = applyRateLimit(userId, chatConfig);

    if (!rateLimit.allowed) {
      throw new HttpError(429, "Limite de consultas por minuto atingido. Tente novamente em instantes.", {
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    let rawIntent = null;
    let fallbackUsed = false;

    try {
      rawIntent = await inferIntentWithGemini(question, env, chatConfig);
    } catch (error) {
      if (error instanceof HttpError && error.status === 429) {
        throw error;
      }

      fallbackUsed = true;
      rawIntent = createFallbackIntent(question);
    }

    if (!rawIntent) {
      fallbackUsed = true;
      rawIntent = createFallbackIntent(question);
    }

    const intent = sanitizeIntent(rawIntent, question, chatConfig);
    const { records, documentsRead, truncated } = await fetchCollectionDocuments(
      intent.collection,
      idToken,
      env,
      chatConfig
    );
    const executedIntent = executeIntent(intent, records, chatConfig);

    return jsonResponse(
      request,
      env,
      {
        answer: executedIntent.answer,
        intent: executedIntent.intentLabel,
        filters: intent.filters,
        rowsSample: executedIntent.rowsSample,
        usage: {
          model: chatConfig.model,
          fallback: fallbackUsed,
          documentsRead,
          scannedDocuments: records.length,
          matchedDocuments: executedIntent.matchedDocuments,
          truncatedScan: truncated,
          rateLimit: {
            limit: chatConfig.rateLimitMaxRequests,
            remaining: rateLimit.remaining,
            windowMs: chatConfig.rateLimitWindowMs,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return respondWithError(request, env, error, "Nao foi possivel processar a consulta de chat.");
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      const corsHeaders = createCorsHeaders(request, env);

      return corsHeaders
        ? new Response(null, { status: 204, headers: corsHeaders })
        : new Response(null, { status: 403 });
    }

    const { pathname } = new URL(request.url);
    const normalizedPathname = normalizePathname(pathname);

    if (normalizedPathname === "/products/image/upload") {
      return handleProductImageUpload(request, env);
    }

    if (normalizedPathname === "/products/image/import-url") {
      return handleProductImageImportUrl(request, env);
    }

    if (pathname.startsWith(`${PRODUCT_IMAGE_ROUTE_PREFIX}/`)) {
      const encodedImageKey = pathname.slice(`${PRODUCT_IMAGE_ROUTE_PREFIX}/`.length);
      return handleProductImageGet(request, env, encodedImageKey);
    }

    if (normalizedPathname === "/cosmos/product-image") {
      return handleCosmosProductImage(request, env);
    }

    if (normalizedPathname === "/chat/query") {
      return handleChatQuery(request, env);
    }

    if (normalizedPathname === "/" || normalizedPathname === "/cosmos/sync") {
      return handleCosmosSync(request, env);
    }

    return jsonResponse(
      request,
      env,
      {
        message:
          "Rota nao encontrada. Use /chat/query, /cosmos/sync, /cosmos/product-image, /products/image/upload ou /products/image/import-url.",
      },
      { status: 404 }
    );
  },
};
