import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoginTextField from "../../apps/petCorner/src/components/Login/LoginTextField";

describe("LoginTextField", () => {
  it("associa label, descrição e estado inválido", () => {
    render(<LoginTextField label="E-mail" name="email" error="E-mail inválido" />);
    const field = screen.getByLabelText("E-mail");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("E-mail inválido");
  });
});
