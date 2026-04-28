import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("item delete UI", () => {
  it("wires the drawer delete action to a confirmation dialog and success toast", async () => {
    const drawerSource = await readFile(
      "src/components/items/ItemDrawerProvider.tsx",
      "utf8",
    );
    const alertDialogSource = await readFile(
      "src/components/ui/alert-dialog.tsx",
      "utf8",
    );

    assert.match(drawerSource, /function DeleteItemDialog/);
    assert.match(drawerSource, /Delete item\?/);
    assert.match(drawerSource, /deleteItem\(item\.id\)/);
    assert.match(drawerSource, /GlobalToastMessage/);
    assert.match(drawerSource, /Item deleted\./);
    assert.match(alertDialogSource, /@base-ui\/react\/alert-dialog/);
  });
});
