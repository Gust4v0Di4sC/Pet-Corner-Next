import { z } from "zod";
import { CUSTOMER_SESSION_COOKIE, CUSTOMER_SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session-constants";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";
import { getFirebaseServerAuth } from "@/lib/firebase/firebase-server";
import { apiJson, getRequestId, guardAppCheck, hasTrustedOrigin, parseJsonBody, verifyAppCheck } from "@/lib/http/route-security";
import { logEvent } from "@/lib/observability/logger";
import { sanitizeRedirectPath } from "@/lib/routing/route";

const payloadSchema = z.object({
  name: z.string().trim().max(120).optional().default(""),
  next: z.string().max(500).optional().default(""),
}).strict();

function bearerToken(request: Request) {
  return /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") || "")?.[1]?.trim() || "";
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const blocked = await guardAppCheck(request);
  if (blocked) return blocked;
  return apiJson({ ok: true, session: await readServerCustomerSession() }, {}, requestId);
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  const requestId = getRequestId(request);
  const route = "/api/auth/session";
  const finish = (status: number) => logEvent("info", "api_request", {
    requestId, route, status, durationMs: Math.round(performance.now() - startedAt),
  });
  if (!hasTrustedOrigin(request)) {
    finish(403);
    return apiJson({ ok: false, error: "Origem não permitida." }, { status: 403 }, requestId);
  }
  const appCheck = await verifyAppCheck(request, requestId);
  if (appCheck.enforced && !appCheck.valid) {
    finish(401);
    return apiJson({ ok: false, error: "Verificação do aplicativo inválida." }, { status: 401 }, requestId);
  }
  const parsed = await parseJsonBody(request, payloadSchema, 8 * 1024);
  if (!parsed.ok) {
    finish(parsed.status);
    return apiJson({ ok: false, error: parsed.error }, { status: parsed.status }, requestId);
  }
  const idToken = bearerToken(request);
  if (!idToken) {
    finish(401);
    return apiJson({ ok: false, error: "Token de autenticação ausente." }, { status: 401 }, requestId);
  }
  try {
    const auth = getFirebaseServerAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    if (!decoded.uid || !decoded.email || Date.now() / 1000 - Number(decoded.auth_time || 0) > 5 * 60) {
      finish(401);
      return apiJson({ ok: false, error: "Faça login novamente para continuar." }, { status: 401 }, requestId);
    }
    const cookieValue = await auth.createSessionCookie(idToken, {
      expiresIn: CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000,
    });
    const nextPath = sanitizeRedirectPath(parsed.data.next, "/profile");
    const issuedAt = new Date();
    const session = {
      customerId: decoded.uid,
      email: decoded.email,
      name: typeof decoded.name === "string" ? decoded.name : parsed.data.name || undefined,
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + CUSTOMER_SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
    };
    const response = apiJson({ ok: true, nextPath, session }, {}, requestId);
    response.cookies.set(CUSTOMER_SESSION_COOKIE, cookieValue, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS, path: "/",
    });
    finish(200);
    return response;
  } catch (error) {
    logEvent("warn", "session_creation_failed", { requestId, route, error });
    finish(401);
    return apiJson({ ok: false, error: "Não foi possível iniciar a sessão." }, { status: 401 }, requestId);
  }
}
