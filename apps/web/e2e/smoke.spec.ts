import { test, expect } from "@playwright/test";

test("landing renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Plataforma de Enseñanza" })).toBeVisible();
});