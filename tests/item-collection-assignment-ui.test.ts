import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "vitest";

describe("item collection assignment UI", () => {
  it("passes collection options into item create and edit forms", async () => {
    const [
      dashboardShellSource,
      itemTypePageSource,
      profilePageSource,
      createDialogSource,
      drawerProviderSource,
    ] = await Promise.all([
      readFile("src/components/dashboard/DashboardShell.tsx", "utf8"),
      readFile("src/app/items/[type]/page.tsx", "utf8"),
      readFile("src/app/profile/page.tsx", "utf8"),
      readFile("src/components/items/ItemCreateDialog.tsx", "utf8"),
      readFile("src/components/items/ItemDrawerProvider.tsx", "utf8"),
    ]);

    assert.match(dashboardShellSource, /getDashboardCollectionOptions/);
    assert.match(dashboardShellSource, /availableCollections=\{collectionOptions\}/);
    assert.match(itemTypePageSource, /getDashboardCollectionOptions/);
    assert.match(itemTypePageSource, /availableCollections=\{collectionOptions\}/);
    assert.match(profilePageSource, /getDashboardCollectionOptions/);
    assert.match(profilePageSource, /availableCollections=\{collectionOptions\}/);

    assert.match(createDialogSource, /availableCollections: DashboardCollectionOption\[\]/);
    assert.match(createDialogSource, /CollectionMultiSelect/);
    assert.match(createDialogSource, /collectionIds/);
    assert.match(createDialogSource, /getItemCreatePayload/);

    assert.match(drawerProviderSource, /availableCollections: DashboardCollectionOption\[\]/);
    assert.match(drawerProviderSource, /CollectionMultiSelect/);
    assert.match(drawerProviderSource, /onCollectionIdsChange/);
    assert.match(drawerProviderSource, /getItemUpdatePayload/);
  });

  it("uses a searchable alphabetized collection dropdown instead of checkbox groups", async () => {
    const [createDialogSource, drawerProviderSource, multiSelectSource] =
      await Promise.all([
        readFile("src/components/items/ItemCreateDialog.tsx", "utf8"),
        readFile("src/components/items/ItemDrawerProvider.tsx", "utf8"),
        readFile("src/components/items/CollectionMultiSelect.tsx", "utf8"),
      ]);

    assert.doesNotMatch(createDialogSource, /type="checkbox"/);
    assert.doesNotMatch(drawerProviderSource, /type="checkbox"/);
    assert.match(multiSelectSource, /aria-haspopup="listbox"/);
    assert.match(multiSelectSource, /placeholder="Search collections"/);
    assert.match(multiSelectSource, /\.sort\(/);
    assert.match(multiSelectSource, /localeCompare/);
    assert.doesNotMatch(multiSelectSource, /type="checkbox"/);
  });
});
