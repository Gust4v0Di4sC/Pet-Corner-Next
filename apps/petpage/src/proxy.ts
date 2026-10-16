import { NextResponse, type NextRequest } from "next/server";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/auth/session-constants";

const PROTECTED_ROUTES = new Set(["/profile", "/checkout", "/rastreamento"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const requestId = request.headers.get("x-request-id")?.slice(0, 128) || crypto.randomUUID();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-request-id", requestId);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  if (!PROTECTED_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (sessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/api/:path*", "/profile", "/checkout", "/rastreamento"],
};
