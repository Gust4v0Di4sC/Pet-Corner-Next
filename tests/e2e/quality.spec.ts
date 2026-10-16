import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("health expõe estado e request id", async ({ request }) => {
  const response = await request.get("/api/health", { headers: { "x-request-id": "e2e-health" } });
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["x-request-id"]).toBe("e2e-health");
  expect((await response.json()).status).toBe("ok");
});

test("sessão rejeita origem e payload excessivo", async ({ request }) => {
  const crossOrigin = await request.post("/api/auth/session", {
    headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
  expect(crossOrigin.headers()["x-request-id"]).toBeTruthy();

  const oversized = await request.post("/api/auth/session", {
    headers: { "content-type": "application/json" },
    data: { name: "a".repeat(9 * 1024) },
  });
  expect(oversized.status()).toBe(413);
});

test("@a11y página pública não tem violações graves", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href="#main-content"]')).toBeAttached();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("@a11y login administrativo é rotulado e responsivo", async ({ page }) => {
  await page.goto("/app-react/");
  await page.getByRole("button", { name: "Abrir formulario de login" }).click();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  expect(await page.locator("html").getAttribute("lang")).toBe("pt-BR");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
