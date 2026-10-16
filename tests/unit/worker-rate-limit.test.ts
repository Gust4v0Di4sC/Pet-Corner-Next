// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { applyRateLimit } from "../../apps/petCorner/cloudflare/cosmos-sync/src/index.js";

describe("Cloudflare native rate limiting", () => {
  it("usa o binding e informa Retry-After quando bloqueado", async () => {
    const limit = vi.fn().mockResolvedValue({ success: false });
    const result = await applyRateLimit("customer-a", { CHAT_RATE_LIMITER: { limit } }, {
      rateLimitWindowMs: 60_000,
    });
    expect(limit).toHaveBeenCalledWith({ key: "customer-a" });
    expect(result).toEqual({ allowed: false, remaining: null, retryAfterSeconds: 60 });
  });
});
