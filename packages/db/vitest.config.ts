import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/migrate.ts", "src/seed.ts"],
      thresholds: { lines: 60, statements: 60, functions: 0, branches: 40 },
    },
  },
});
