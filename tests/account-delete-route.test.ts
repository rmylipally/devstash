import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  deleteS3Object: vi.fn(),
  itemFindMany: vi.fn(),
  userDelete: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findMany: mocks.itemFindMany,
    },
    user: {
      delete: mocks.userDelete,
    },
  },
}));

vi.mock("@/lib/storage/s3", () => ({
  deleteS3Object: mocks.deleteS3Object,
}));

const { DELETE } = await import("../src/app/api/account/route");

describe("account delete route", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
    mocks.deleteS3Object.mockReset();
    mocks.itemFindMany.mockReset();
    mocks.userDelete.mockReset();
  });

  it("deletes file objects before removing the user record", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-123" } });
    mocks.itemFindMany.mockResolvedValue([
      { storageKey: "devstash/api/uploads/user-123/file/a.md" },
      { storageKey: "devstash/api/uploads/user-123/image/b.png" },
    ]);
    mocks.deleteS3Object.mockResolvedValue(undefined);
    mocks.userDelete.mockResolvedValue({ id: "user-123" });

    const response = await DELETE();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { success: true });
    assert.deepEqual(mocks.itemFindMany.mock.calls[0]?.[0], {
      select: { storageKey: true },
      where: {
        contentKind: "FILE",
        storageKey: { not: null },
        userId: "user-123",
      },
    });
    assert.deepEqual(mocks.deleteS3Object.mock.calls, [
      ["devstash/api/uploads/user-123/file/a.md"],
      ["devstash/api/uploads/user-123/image/b.png"],
    ]);
    assert.equal(
      mocks.deleteS3Object.mock.invocationCallOrder[1] <
        mocks.userDelete.mock.invocationCallOrder[0],
      true,
    );
  });
});
