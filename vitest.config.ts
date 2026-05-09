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
    fileParallelism: false,
    include: [
      "tests/account-delete-route.test.ts",
      "tests/auth-credentials.test.ts",
      "tests/auth-password-reset.test.ts",
      "tests/auth-setup.test.ts",
      "tests/auth-ui.test.tsx",
      "tests/code-editor-ui.test.ts",
      "tests/collection-create-route.test.ts",
      "tests/collection-create-ui.test.ts",
      "tests/collections-pages-ui.test.ts",
      "tests/cleanup-script.test.ts",
      "tests/dashboard-collections.test.ts",
      "tests/dashboard-frame.test.tsx",
      "tests/dashboard-item-card-styles.test.ts",
      "tests/dashboard-items.test.ts",
      "tests/dashboard-search-ui.test.ts",
      "tests/file-list-ui.test.ts",
      "tests/file-upload-ui.test.ts",
      "tests/file-upload-validation.test.ts",
      "tests/favorites-sort-ui.test.ts",
      "tests/image-gallery-ui.test.ts",
      "tests/item-actions.test.ts",
      "tests/item-collection-assignment-ui.test.ts",
      "tests/item-create-ui.test.ts",
      "tests/item-delete-ui.test.ts",
      "tests/item-drawer-edit-ui.test.ts",
      "tests/item-type-page.test.tsx",
      "tests/markdown-editor-ui.test.ts",
      "tests/profile.test.tsx",
      "tests/quick-copy-card-ui.test.ts",
      "tests/rate-limit.test.ts",
      "tests/s3-storage.test.ts",
      "tests/seed-data.test.ts",
      "tests/stripe-checkout-route.test.ts",
      "tests/stripe-portal-route.test.ts",
      "tests/usage-limits.test.ts",
    ],
    server: {
      deps: {
        inline: [/\/node_modules\/next-auth\//, /^next-auth(\/.*)?$/],
      },
    },
  },
});
