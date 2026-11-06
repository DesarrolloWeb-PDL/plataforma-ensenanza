import { test, expect } from "@playwright/test";

test("sandbox page renders", async ({ page }) => {
  await page.goto("/sandbox");
  await expect(page.getByRole("heading", { name: "Sandbox de codigo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ejecutar", exact: true })).toBeVisible();
});
