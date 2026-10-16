import { describe, expect, it } from "vitest";
import { collapseWhitespace, normalizeEmail } from "../../apps/petpage/src/lib/validation/input-sanitizers";

describe("normalização de entrada", () => {
  it("normaliza espaços e e-mail", () => {
    expect(collapseWhitespace("  Olá   mundo  ")).toBe("Olá mundo");
    expect(normalizeEmail("  CLIENTE@EXAMPLE.COM ")).toBe("cliente@example.com");
  });
});
