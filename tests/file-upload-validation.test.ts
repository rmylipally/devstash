import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  createStorageKey,
  validateUploadMetadata,
} from "../src/lib/storage/uploads";

describe("file upload validation", () => {
  it("accepts supported image uploads under the image size limit", () => {
    const result = validateUploadMetadata({
      fileName: "diagram.webp",
      kind: "image",
      mimeType: "image/webp",
      size: 5 * 1024 * 1024,
    });

    assert.deepEqual(result, { success: true });
  });

  it("rejects images over 5 MB", () => {
    const result = validateUploadMetadata({
      fileName: "large.png",
      kind: "image",
      mimeType: "image/png",
      size: 5 * 1024 * 1024 + 1,
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Images must be 5 MB or smaller/);
  });

  it("rejects SVG images because they are not safe to serve inline", () => {
    const result = validateUploadMetadata({
      fileName: "diagram.svg",
      kind: "image",
      mimeType: "image/svg+xml",
      size: 1024,
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Unsupported image extension/);
  });

  it("accepts supported file uploads under the file size limit", () => {
    const result = validateUploadMetadata({
      fileName: "runbook.md",
      kind: "file",
      mimeType: "text/markdown",
      size: 10 * 1024 * 1024,
    });

    assert.deepEqual(result, { success: true });
  });

  it("rejects unsupported extensions even with supported MIME types", () => {
    const result = validateUploadMetadata({
      fileName: "archive.zip",
      kind: "file",
      mimeType: "application/json",
      size: 1024,
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Unsupported file extension/);
  });

  it("creates scoped storage keys without preserving path segments", () => {
    const key = createStorageKey({
      fileName: "../Design Doc.md",
      kind: "file",
      userId: "user-123",
      uuid: "upload-abc",
    });

    assert.equal(
      key,
      "devstash/api/uploads/user-123/file/upload-abc-design-doc.md",
    );
  });
});
