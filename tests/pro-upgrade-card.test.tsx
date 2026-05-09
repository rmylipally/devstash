import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { ProUpgradeCard } from "../src/components/items/ProUpgradeCard";

describe("ProUpgradeCard", () => {
  it("renders pro feature messaging", () => {
    const html = renderToStaticMarkup(
      <ProUpgradeCard itemTypeLabel="Files" currentPlan="free" />
    );

    assert.match(html, /Pro feature/);
    assert.match(html, /Files require Pro/);
    assert.match(html, /Upgrade your plan to browse and manage files items\./);
    assert.match(html, /Back to dashboard/);
  });

  it("includes billing component for free users", () => {
    const html = renderToStaticMarkup(
      <ProUpgradeCard itemTypeLabel="Images" currentPlan="free" />
    );

    // BillingSettingsCard content
    assert.match(html, /Billing/);
    assert.match(html, /Current plan:/);
    assert.match(html, /Monthly/);
    assert.match(html, /Yearly/);
    assert.match(html, /Upgrade to Pro/);
  });

  it("renders different item type labels correctly", () => {
    const htmlFiles = renderToStaticMarkup(
      <ProUpgradeCard itemTypeLabel="Files" currentPlan="free" />
    );
    const htmlImages = renderToStaticMarkup(
      <ProUpgradeCard itemTypeLabel="Images" currentPlan="free" />
    );

    assert.match(htmlFiles, /Files require Pro/);
    assert.match(htmlImages, /Images require Pro/);
  });
});
