import { defineConfig } from "vitest/config";


export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setupTests.ts"],
    globals: true,
    include: ["tests/AllTests.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
    },
  },
});
