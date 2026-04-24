import { NextResponse, type NextRequest } from "next/server";
import { CUSTOMER_SESSION_COOKIE } from "@/infrastructure/auth/session-constants";

const PROTECTED_ROUTES = new Set(["/profile", "/checkout", "/rastreamento"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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
  matcher: ["/profile", "/checkout", "/rastreamento"],
};
