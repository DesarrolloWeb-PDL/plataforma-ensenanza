import { test, expect } from "@playwright/test";

test("i18n default Spanish renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "DesarrolloWeb Academy" })).toBeVisible();
  await expect(page.getByText("Aprende a programar jugando.")).toBeVisible();
});