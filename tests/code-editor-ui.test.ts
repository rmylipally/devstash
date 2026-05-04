import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { describe, it } from "node:test";

async function readSource(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

describe("code editor UI", () => {
  it("provides a Monaco code editor with header copy controls", async () => {
    const source = await readSource("src/components/items/CodeEditor.tsx");

    assert.match(source, /@monaco-editor\/react/);
    assert.match(source, /aria-label="Copy editor content"/);
    assert.match(source, /bg-red-500/);
    assert.match(source, /bg-yellow-500/);
    assert.match(source, /bg-green-500/);
    assert.match(source, /readOnly/);
    assert.match(source, /maxEditorHeight/);
    assert.match(source, /scrollbar/);
  });

  it("uses the code editor only for snippet and command content fields", async () => {
    const createDialogSource = await readSource(
      "src/components/items/ItemCreateDialog.tsx",
    );
    const drawerSource = await readSource(
      "src/components/items/ItemDrawerProvider.tsx",
    );

    assert.match(createDialogSource, /<CodeEditor/);
    assert.match(drawerSource, /<CodeEditor/);
    assert.match(createDialogSource, /function isCodeItemKind/);
    assert.match(drawerSource, /function isCodeItemKind/);
    assert.match(createDialogSource, /<CreateItemTextarea/);
    assert.match(drawerSource, /<DrawerTextarea/);
  });
});
