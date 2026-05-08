"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";

/**
 * Reads the `openItem` query parameter and opens the item drawer if present.
 * This enables deep linking to specific items via the command palette.
 */
export function DashboardItemOpenHandler() {
  const searchParams = useSearchParams();
  const { openItemDrawer } = useItemDrawer();

  useEffect(() => {
    const itemId = searchParams.get("openItem");
    if (itemId) {
      openItemDrawer(itemId);
    }
  }, [searchParams, openItemDrawer]);

  return null;
}
