import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  DEFAULT_KEEP_EMAIL,
  parseCleanupArgs,
} from "../scripts/delete-non-demo-users";

describe("delete non-demo users script", () => {
  it("defaults to dry-run mode and keeps the seeded demo user", () => {
    assert.deepEqual(parseCleanupArgs([]), {
      confirmEmail: null,
      execute: false,
      keepEmail: DEFAULT_KEEP_EMAIL,
    });
  });

  it("requires an execute flag and matching confirmation before destructive cleanup", () => {
    assert.deepEqual(
      parseCleanupArgs([
        "--execute",
        "--keep-email=demo@devstash.io",
        "--confirm=demo@devstash.io",
      ]),
      {
        confirmEmail: "demo@devstash.io",
        execute: true,
        keepEmail: "demo@devstash.io",
      },
    );
  });
});
