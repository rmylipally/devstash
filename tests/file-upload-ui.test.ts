import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "vitest";

describe("file upload UI and routes", () => {
  it("wires file and image creation through FileUpload", async () => {
    const createDialogSource = await readFile(
      "src/components/items/ItemCreateDialog.tsx",
      "utf8",
    );
    const fileUploadSource = await readFile(
      "src/components/items/FileUpload.tsx",
      "utf8",
    );

    assert.match(createDialogSource, /file/);
    assert.match(createDialogSource, /image/);
    assert.match(createDialogSource, /<FileUpload/);
    assert.match(createDialogSource, /storageKey/);
    assert.match(fileUploadSource, /XMLHttpRequest/);
    assert.match(fileUploadSource, /drag/);
    assert.match(fileUploadSource, /progress/);
    assert.match(fileUploadSource, /URL\.createObjectURL/);
    assert.match(fileUploadSource, /if \(disabled \|\| isUploading\) \{/);
  });

  it("exposes upload and download proxy API routes", async () => {
    const uploadRouteSource = await readFile(
      "src/app/api/uploads/route.ts",
      "utf8",
    );
    const downloadRouteSource = await readFile(
      "src/app/api/items/[id]/download/route.ts",
      "utf8",
    );
    const drawerSource = await readFile(
      "src/components/items/ItemDrawerProvider.tsx",
      "utf8",
    );

    assert.match(uploadRouteSource, /formData/);
    assert.match(uploadRouteSource, /putS3Object/);
    assert.match(uploadRouteSource, /export async function DELETE/);
    assert.match(uploadRouteSource, /deleteS3Object/);
    assert.match(downloadRouteSource, /getS3Object/);
    assert.match(downloadRouteSource, /Content-Disposition/);
    assert.match(drawerSource, /Download/);
    assert.match(drawerSource, /\/api\/items\/\$\{item\.id\}\/download/);
    assert.match(drawerSource, /NextImage/);
  });
});
