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

describe("markdown editor UI", () => {
  it("provides a dark Markdown editor with write, preview, and copy controls", async () => {
    const [source, globalsSource] = await Promise.all([
      readSource("src/components/items/MarkdownEditor.tsx"),
      readSource("src/app/globals.css"),
    ]);

    assert.match(source, /react-markdown/);
    assert.match(source, /remark-gfm/);
    assert.match(source, /Write/);
    assert.match(source, /Preview/);
    assert.match(source, /aria-label="Copy markdown content"/);
    assert.match(source, /readOnly/);
    assert.match(source, /bg-\[#1e1e1e\]/);
    assert.match(source, /bg-\[#2d2d2d\]/);
    assert.match(source, /markdown-preview/);
    assert.match(source, /getEditorHeight/);
    assert.match(globalsSource, /\.markdown-preview h1/);
    assert.match(globalsSource, /\.markdown-preview pre/);
    assert.match(globalsSource, /\.markdown-preview code/);
    assert.match(globalsSource, /\.markdown-preview blockquote/);
    assert.match(globalsSource, /\.markdown-preview table/);
  });

  it("uses the Markdown editor only for note and prompt content fields", async () => {
    const createDialogSource = await readSource(
      "src/components/items/ItemCreateDialog.tsx",
    );
    const drawerSource = await readSource(
      "src/components/items/ItemDrawerProvider.tsx",
    );

    assert.match(createDialogSource, /<MarkdownEditor/);
    assert.match(drawerSource, /<MarkdownEditor/);
    assert.match(createDialogSource, /function isMarkdownItemKind/);
    assert.match(drawerSource, /function isMarkdownItemKind/);
    assert.match(createDialogSource, /isMarkdownItemKind\(draft\.kind\)/);
    assert.match(drawerSource, /isMarkdownItemKind\(item\.kind\)/);
    assert.match(createDialogSource, /<CreateItemTextarea/);
    assert.match(drawerSource, /<DrawerTextarea/);
  });
});
