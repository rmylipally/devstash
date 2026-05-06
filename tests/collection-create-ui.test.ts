import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "vitest";

describe("collection create UI", () => {
  it("wires a top-bar collection create button with modal, toast, and refresh", async () => {
    const [dashboardShellSource, dashboardFrameSource, createDialogSource] =
      await Promise.all([
        readFile("src/components/dashboard/DashboardShell.tsx", "utf8"),
        readFile("src/components/dashboard/DashboardFrame.tsx", "utf8"),
        readFile("src/components/collections/CollectionCreateDialog.tsx", "utf8"),
      ]);

    assert.match(dashboardShellSource, /CollectionCreateButton/);
    assert.match(dashboardShellSource, /<CollectionCreateButton \/>/);
    assert.match(dashboardFrameSource, /newItemAction/);
    assert.match(createDialogSource, /function CollectionCreateButton/);
    assert.match(createDialogSource, /New Collection/);
    assert.match(createDialogSource, /\/api\/collections/);
    assert.match(createDialogSource, /router\.refresh\(\)/);
    assert.match(createDialogSource, /Collection created\./);
    assert.match(createDialogSource, /Description/);
  });
});
