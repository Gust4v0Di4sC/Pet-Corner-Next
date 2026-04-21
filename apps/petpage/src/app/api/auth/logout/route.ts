import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE } from "@/infrastructure/auth/session-constants";
import { sanitizeRedirectPath } from "@/utils/shared/route";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const isFormRequest = contentType.includes("application/x-www-form-urlencoded");

  let nextPath = "/login";
  if (isFormRequest) {
    const form = await request.formData();
    nextPath = sanitizeRedirectPath(String(form.get("next") || ""), "/login");
  } else {
    const body = (await request.json().catch(() => ({}))) as { next?: string };
    nextPath = sanitizeRedirectPath(body.next, "/login");
  }

  const response = isFormRequest
    ? NextResponse.redirect(new URL(nextPath, request.url))
    : NextResponse.json({ ok: true, nextPath });

  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}
