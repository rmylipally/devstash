import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "next/server": path.resolve(rootDir, "node_modules/next/server.js"),
    },
  },
  test: {
    environment: "node",
    exclude: ["tests/**/*.test.tsx", "tests/dashboard-item-card-styles.test.ts"],
    fileParallelism: false,
    include: [
      "tests/auth-credentials.test.ts",
      "tests/auth-password-reset.test.ts",
      "tests/auth-setup.test.ts",
      "tests/cleanup-script.test.ts",
      "tests/dashboard-collections.test.ts",
      "tests/dashboard-items.test.ts",
      "tests/item-actions.test.ts",
      "tests/rate-limit.test.ts",
      "tests/seed-data.test.ts",
    ],
    server: {
      deps: {
        inline: [/\/node_modules\/next-auth\//, /^next-auth(\/.*)?$/],
      },
    },
  },
});
