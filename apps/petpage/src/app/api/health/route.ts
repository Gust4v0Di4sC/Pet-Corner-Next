import { apiJson, getRequestId } from "@/lib/http/route-security";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return apiJson({
    status: "ok",
    service: "petcorner-next",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || process.env.npm_package_version || "local",
    timestamp: new Date().toISOString(),
  }, { status: 200 }, getRequestId(request));
}
