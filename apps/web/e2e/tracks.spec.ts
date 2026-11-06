import { test, expect } from "@playwright/test";

test("tracks page renders heading", async ({ page }) => {
  await page.goto("/tracks");
  await expect(page.getByRole("heading", { name: "Tracks" })).toBeVisible();
});