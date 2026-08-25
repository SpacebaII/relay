import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/domain/**/*.ts", "src/application/**/*.ts", "worker/*intelligence.ts"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 65 },
    },
  },
});

