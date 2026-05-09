import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  FREE_TIER_MAX_COLLECTIONS,
  FREE_TIER_MAX_ITEMS,
  getCollectionCreationLimitResult,
  getItemCreationLimitResult,
  getItemKindPlanAccessResult,
  isProRequiredItemKind,
  normalizeSessionPlan,
} from "../src/lib/usage-limits";

describe("usage-limits", () => {
  it("allows free users to create items and collections below limits", () => {
    const itemResult = getItemCreationLimitResult({
      currentCount: FREE_TIER_MAX_ITEMS - 1,
      plan: "free",
    });
    const collectionResult = getCollectionCreationLimitResult({
      currentCount: FREE_TIER_MAX_COLLECTIONS - 1,
      plan: "free",
    });

    assert.equal(itemResult.allowed, true);
    assert.equal(collectionResult.allowed, true);
  });

  it("blocks free users at exact limits", () => {
    const itemResult = getItemCreationLimitResult({
      currentCount: FREE_TIER_MAX_ITEMS,
      plan: "free",
    });
    const collectionResult = getCollectionCreationLimitResult({
      currentCount: FREE_TIER_MAX_COLLECTIONS,
      plan: "free",
    });

    assert.equal(itemResult.allowed, false);
    assert.match(itemResult.reason ?? "", /Free plan is limited to 50 items/);
    assert.equal(collectionResult.allowed, false);
    assert.match(
      collectionResult.reason ?? "",
      /Free plan is limited to 3 collections/,
    );
  });

  it("lets pro users bypass free-tier limits", () => {
    const itemResult = getItemCreationLimitResult({
      currentCount: 5_000,
      plan: "pro",
    });
    const collectionResult = getCollectionCreationLimitResult({
      currentCount: 500,
      plan: "PRO",
    });

    assert.equal(itemResult.allowed, true);
    assert.equal(collectionResult.allowed, true);
  });

  it("enforces pro-only file and image kinds", () => {
    assert.equal(isProRequiredItemKind("file"), true);
    assert.equal(isProRequiredItemKind("image"), true);
    assert.equal(isProRequiredItemKind("snippet"), false);

    const freeFileResult = getItemKindPlanAccessResult({
      kind: "file",
      plan: "free",
    });
    const proFileResult = getItemKindPlanAccessResult({
      kind: "file",
      plan: "pro",
    });

    assert.equal(freeFileResult.allowed, false);
    assert.match(
      freeFileResult.reason ?? "",
      /File and image items are available on Pro/,
    );
    assert.equal(proFileResult.allowed, true);
  });

  it("normalizes negative counts and unknown plans safely", () => {
    const itemResult = getItemCreationLimitResult({
      currentCount: -10,
      plan: undefined,
    });
    const collectionResult = getCollectionCreationLimitResult({
      currentCount: Number.NaN,
      plan: null,
    });

    assert.equal(itemResult.currentCount, 0);
    assert.equal(collectionResult.currentCount, 0);
    assert.equal(normalizeSessionPlan("invalid" as never), "free");
  });
});
