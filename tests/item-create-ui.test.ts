import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("item create UI", () => {
  it("wires the top-bar new item action to a create dialog and success refresh", async () => {
    const dashboardFrameSource = await readFile(
      "src/components/dashboard/DashboardFrame.tsx",
      "utf8",
    );
    const dashboardShellSource = await readFile(
      "src/components/dashboard/DashboardShell.tsx",
      "utf8",
    );
    const createDialogSource = await readFile(
      "src/components/items/ItemCreateDialog.tsx",
      "utf8",
    );
    const dialogSource = await readFile("src/components/ui/dialog.tsx", "utf8");

    assert.match(dashboardFrameSource, /newItemAction/);
    assert.match(dashboardShellSource, /<ItemCreateButton \/>/);
    assert.match(createDialogSource, /function ItemCreateButton/);
    assert.match(createDialogSource, /max-w-3xl/);
    assert.match(createDialogSource, /createItem\(/);
    assert.match(createDialogSource, /router\.refresh\(\)/);
    assert.match(createDialogSource, /Item created\./);
    assert.match(createDialogSource, /snippet/);
    assert.match(createDialogSource, /prompt/);
    assert.match(createDialogSource, /command/);
    assert.match(createDialogSource, /note/);
    assert.match(createDialogSource, /link/);
    assert.match(dialogSource, /@base-ui\/react\/dialog/);
  });
});
