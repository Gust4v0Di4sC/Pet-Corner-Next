import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sanitizeLogFields } from "../../apps/petpage/src/lib/observability/logger";

describe("logger estruturado", () => {
  it("remove PII, tokens e mensagens internas", () => {
    expect(sanitizeLogFields({
      email: "cliente@example.com",
      authorization: "Bearer segredo",
      nested: { phone: "5511999999999" },
      error: new Error("falhou para cliente@example.com"),
    })).toEqual({
      email: "[REDACTED]",
      authorization: "[REDACTED]",
      nested: { phone: "[REDACTED]" },
      error: { name: "Error", code: undefined },
    });
  });
});
