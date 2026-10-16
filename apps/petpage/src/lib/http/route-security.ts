import "server-only";

import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getFirebaseServerAppCheck } from "@/lib/firebase/firebase-server";
import { logEvent } from "@/lib/observability/logger";

export const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id")?.slice(0, 128) || crypto.randomUUID();
}

export function apiJson(data: unknown, init: ResponseInit = {}, requestId = crypto.randomUUID()) {
  const headers = new Headers(init.headers);
  headers.set("x-request-id", requestId);
  headers.set("cache-control", "no-store");
  return NextResponse.json(data, { ...init, headers });
}

export function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== "application/json") {
    return { ok: false as const, status: 415, error: "Content-Type deve ser application/json." };
  }
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > maxBytes) return { ok: false as const, status: 413, error: "Payload muito grande." };
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    return { ok: false as const, status: 413, error: "Payload muito grande." };
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false as const, status: 400, error: "JSON inválido." };
  }
  const parsed = schema.safeParse(value);
  return parsed.success
    ? { ok: true as const, data: parsed.data }
    : { ok: false as const, status: 400, error: parsed.error.issues[0]?.message || "Payload inválido." };
}

export async function verifyAppCheck(request: Request, requestId: string) {
  const mode = process.env.APP_CHECK_ENFORCEMENT === "enforce" ? "enforce" : "monitor";
  const token = request.headers.get("x-firebase-appcheck");
  let valid = false;
  if (token) valid = Boolean(await getFirebaseServerAppCheck().verifyToken(token).catch(() => null));
  if (!valid) logEvent(mode === "enforce" ? "warn" : "info", "app_check_invalid", { requestId, route: new URL(request.url).pathname, mode });
  return { valid, enforced: mode === "enforce" };
}

export async function guardApiMutation(request: Request, options: { maxBytes?: number; allowForm?: boolean } = {}) {
  const requestId = getRequestId(request);
  if (!hasTrustedOrigin(request)) return apiJson({ ok: false, error: "Origem não permitida." }, { status: 403 }, requestId);
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim() || "";
  const allowedTypes = options.allowForm
    ? ["application/json", "application/x-www-form-urlencoded"]
    : ["application/json"];
  if (!allowedTypes.includes(contentType)) {
    return apiJson({ ok: false, error: "Content-Type não suportado." }, { status: 415 }, requestId);
  }
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BODY_BYTES;
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > maxBytes || (await request.clone().arrayBuffer()).byteLength > maxBytes) {
    return apiJson({ ok: false, error: "Payload muito grande." }, { status: 413 }, requestId);
  }
  const appCheck = await verifyAppCheck(request, requestId);
  if (appCheck.enforced && !appCheck.valid) {
    return apiJson({ ok: false, error: "Verificação do aplicativo inválida." }, { status: 401 }, requestId);
  }
  return null;
}

export async function guardAppCheck(request: Request) {
  const requestId = getRequestId(request);
  const result = await verifyAppCheck(request, requestId);
  return result.enforced && !result.valid
    ? apiJson({ ok: false, error: "Verificação do aplicativo inválida." }, { status: 401 }, requestId)
    : null;
}
