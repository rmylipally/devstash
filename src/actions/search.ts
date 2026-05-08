"use server";

import { auth } from "@/auth";
import {
  getDashboardCollections,
} from "@/lib/db/collections";
import {
  getDashboardRecentItems,
  type DashboardItem,
} from "@/lib/db/items";

export interface SearchableItem {
  id: string;
  title: string;
  type: DashboardItem["kind"];
  preview?: string;
}

export interface SearchableCollection {
  id: string;
  name: string;
  itemCount: number;
}

export interface SearchResult {
  items: SearchableItem[];
  collections: SearchableCollection[];
}

export async function getSearchableData(): Promise<SearchResult> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  try {
    const [dashboardItems, dashboardCollections] = await Promise.all([
      getDashboardRecentItems({ limit: 100, userId }),
      getDashboardCollections({ limit: 100, userId }),
    ]);

    const items: SearchableItem[] = dashboardItems.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.kind,
      preview: item.description?.substring(0, 100) || undefined,
    }));

    const collections: SearchableCollection[] = dashboardCollections.map(
      (collection) => ({
        id: collection.id,
        name: collection.name,
        itemCount: collection.itemCount,
      }),
    );

    return { items, collections };
  } catch (error) {
    console.error("Error fetching searchable data:", error);
    throw error;
  }
}
