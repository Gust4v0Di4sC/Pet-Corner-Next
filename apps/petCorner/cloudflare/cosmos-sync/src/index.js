import { createRemoteJWKSet, jwtVerify } from "jose";

const COSMOS_API_BASE_URL = "https://api.cosmos.bluesoft.com.br";
const COSMOS_SOURCE_FILE_NAME = "Cosmos API";
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);
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
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
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
    sourceFileName: COSMOS_SOURCE_FILE_NAME,
    isTemplate: false,
  };
}

async function verifyAdminFirebaseToken(request, env) {
  const authorization = request.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new Error("Envie um token Firebase valido no header Authorization.");
  }

  let payload;

  try {
    const verifiedToken = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });

    payload = verifiedToken.payload;
  } catch {
    throw new Error("Token Firebase invalido ou expirado.");
  }

  if (payload.admin !== true) {
    throw new Error("A sincronizacao da Cosmos e restrita a administradores.");
  }
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
    throw new Error("Token da Cosmos invalido ou sem permissao para consultar a API.");
  }

  if (!response.ok) {
    throw new Error(`A API da Cosmos retornou erro ${response.status} durante a sincronizacao.`);
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
    throw new Error("A Cosmos respondeu, mas nao retornou produtos validos para sincronizar.");
  }

  return {
    items,
    totalRows,
    validRows: items.length,
    ignored: Math.max(totalRows - items.length, 0),
    sourceFileName: COSMOS_SOURCE_FILE_NAME,
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      const corsHeaders = createCorsHeaders(request, env);

      return corsHeaders
        ? new Response(null, { status: 204, headers: corsHeaders })
        : new Response(null, { status: 403 });
    }

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
      await verifyAdminFirebaseToken(request, env);
      const payload = await buildCatalogFromCosmos(env);
      return jsonResponse(request, env, payload, { status: 200 });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nao foi possivel sincronizar o catalogo da Cosmos.";
      const status =
        message.includes("Authorization") || message.includes("Firebase")
          ? 401
          : message.includes("administradores")
            ? 403
            : 500;

      return jsonResponse(request, env, { message }, { status });
    }
  },
};
