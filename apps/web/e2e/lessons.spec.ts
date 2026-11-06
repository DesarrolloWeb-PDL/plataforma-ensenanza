import { test, expect } from "@playwright/test";

test("lesson page renders not-found for unknown id", async ({ page }) => {
  await page.goto("/lessons/00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("heading", { name: "Lección no encontrada" })).toBeVisible();
});
