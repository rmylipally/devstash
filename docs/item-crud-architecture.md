# Item CRUD Architecture

This document proposes a unified CRUD architecture for all seven DevStash item types: snippets, prompts, notes, commands, files, images, and links.

The design follows the current product model where `Item.kind` drives stable system behavior, `ItemType` stores built-in display metadata, and `Item.contentKind` distinguishes text, file, and URL storage shapes. It also follows the project direction to use server actions for simple item mutations and route handlers only where uploads or external integrations need clearer boundaries.

Sources: `context/project-overview.md:66`, `context/project-overview.md:70`, `context/project-overview.md:90`, `context/project-overview.md:121`, `context/project-overview.md:128`, `context/project-overview.md:198`, `context/project-overview.md:240`, `context/project-overview.md:272`, `context/project-overview.md:379`, `context/project-overview.md:457`, `context/project-overview.md:525`, `context/project-overview.md:539`, `docs/item-types.md:3`, `docs/item-types.md:9`, `docs/item-types.md:19`, `docs/item-types.md:27`, `docs/item-types.md:33`, `prisma/schema.prisma:15`, `prisma/schema.prisma:25`, `prisma/schema.prisma:105`, `prisma/schema.prisma:121`, `src/lib/db/items.ts:309`, `src/components/dashboard/DashboardFrame.tsx:169`, `src/components/dashboard/DashboardFrame.tsx:251`.

## Current State

Implemented today:

- Dashboard item query helpers live in `src/lib/db/items.ts`.
- Dashboard server rendering calls those query helpers directly from `DashboardShell`.
- Sidebar type links already point to `/items/{slug}`.
- The header has a display-only `New Item` button.
- Prisma already models item records, item type metadata, collection membership, tags, custom types, and AI jobs.

Not implemented yet:

- There is no `/items/[type]` route.
- There is no item mutation action file.
- There are no shared item list, drawer, editor, or type-specific field components.
- `src/proxy.ts` currently protects `/dashboard/:path*` and `/profile`; item routes should be added when implemented.

## Proposed File Structure

```text
src/
  actions/
    items.ts                         # create, update, delete, favorite, pin, viewed mutations
  app/
    items/
      [type]/
        page.tsx                     # one dynamic type route
  components/
    items/
      ItemTypePage.tsx               # route-level composition
      ItemList.tsx                   # list/grid rendering
      ItemListToolbar.tsx            # search/filter/sort controls
      ItemDrawer.tsx                 # create/edit/view shell
      ItemForm.tsx                   # shared form shell
      ItemFieldSet.tsx               # switches by item type/content kind
      ItemCard.tsx                   # reusable item summary card
      ItemRow.tsx                    # dense list row
      ItemDeleteDialog.tsx           # destructive confirmation
      fields/
        TextItemFields.tsx           # snippet, prompt, note, command body fields
        FileItemFields.tsx           # file/image metadata and upload handoff
        LinkItemFields.tsx           # URL field
  lib/
    db/
      items.ts                       # direct server-component queries
    items/
      item-types.ts                  # slug/kind/content-kind mapping helpers
      validation.ts                  # shared Zod input schemas
      form-state.ts                  # typed action result helpers, if needed
```

Keep all mutations in `src/actions/items.ts`. Keep all Prisma reads for pages in `src/lib/db/items.ts`. Keep type-specific UI branching in `src/components/items/*`, not in the action layer.

## Routing Model

Use one route:

```text
/items/[type]
```

The route param is the `ItemType.slug`, so current valid URLs are:

- `/items/snippets`
- `/items/prompts`
- `/items/notes`
- `/items/commands`
- `/items/files`
- `/items/images`
- `/items/links`

`src/app/items/[type]/page.tsx` should:

1. Require an authenticated session.
2. Look up the system `ItemType` by `slug`.
3. Return `notFound()` when the slug is unknown or not a system type.
4. Fetch items for the authenticated user and resolved `ItemType.kind`.
5. Fetch sidebar data using the existing dashboard helpers.
6. Render the shared dashboard frame with an `ItemTypePage`.

The route should not hard-code seven separate page files. The slug resolves metadata from `ItemType`, and the components adapt from that metadata.

## Data Fetching

Add query functions to `src/lib/db/items.ts` and keep them callable directly from server components:

```ts
getItemTypeBySlug({ slug })
getItemsByType({ userId, kind, query, collectionId, tagIds, isFavorite, isPinned })
getItemDetail({ userId, itemId })
getItemFormOptions({ userId }) // collections, tags, custom types
```

Query helpers should:

- Scope every item query by `userId`.
- Filter by `kind` for `/items/[type]`.
- Include tags and collection membership needed by list and drawer UI.
- Reuse the existing enum-to-dashboard-kind mapping pattern.
- Prefer returning UI-facing DTOs instead of raw Prisma rows.

The current dashboard helpers already use this pattern: `getDashboardItemTypes` reads system item types, joins counts by `kind`, and returns display-friendly objects for the sidebar.

## Mutations

Create one server action file:

```ts
// src/actions/items.ts
"use server";

export async function createItem(input: CreateItemInput): Promise<ItemActionResult>;
export async function updateItem(input: UpdateItemInput): Promise<ItemActionResult>;
export async function deleteItem(input: DeleteItemInput): Promise<ItemActionResult>;
export async function toggleItemFavorite(input: ItemIdInput): Promise<ItemActionResult>;
export async function toggleItemPinned(input: ItemIdInput): Promise<ItemActionResult>;
export async function markItemViewed(input: ItemIdInput): Promise<ItemActionResult>;
```

The action file owns cross-type mutation guarantees:

- Authenticate with `auth()`.
- Validate inputs with Zod.
- Resolve `kind` and `contentKind` from the selected type.
- Enforce ownership on update/delete/toggle/viewed mutations.
- Write `Item` fields.
- Replace `CollectionItem` rows for collection membership.
- Upsert or connect `Tag` rows and replace `ItemTag` rows.
- Call `revalidatePath("/dashboard")`, `revalidatePath("/profile")`, and `revalidatePath(`/items/${slug}`)` as needed.

Actions should not decide which fields are visible in the UI. They should validate and persist a normalized shape.

## Type-Specific Logic

Type-specific logic belongs in component and validation helpers, not in separate action files.

Use shared action inputs with type-specific field groups:

| Item type | Content kind | Component field group | Required content shape |
| --- | --- | --- | --- |
| snippet | `TEXT` | `TextItemFields` | `content`; optional `language` |
| prompt | `TEXT` | `TextItemFields` | `content` |
| note | `TEXT` | `TextItemFields` | `content` |
| command | `TEXT` | `TextItemFields` | `content`; optional `language` if useful |
| file | `FILE` | `FileItemFields` | `storageKey`, `mimeType`, `originalFileName`, `fileSizeBytes` |
| image | `FILE` | `FileItemFields` | `storageKey`, `mimeType`, `originalFileName`, `fileSizeBytes` |
| link | `URL` | `LinkItemFields` | `sourceUrl` |

The action should reject impossible combinations, such as a link without `sourceUrl`, text content for a file-only item, or file metadata on a plain note. The UI should prevent those combinations before submit.

## Component Responsibilities

`ItemTypePage`

- Receives resolved item type metadata, list items, filters, and form options from the server route.
- Sets page title, empty state, toolbar, list, and drawer trigger labels.
- Owns URL-level context such as the current type slug.

`ItemListToolbar`

- Renders search, collection filter, tag filter, favorite/pinned filters, and sort controls.
- Updates URL search params so the server route can fetch filtered results.

`ItemList`, `ItemCard`, and `ItemRow`

- Render item summaries from one shared DTO.
- Use item type metadata for icon, color, labels, and badges.
- Avoid data fetching.

`ItemDrawer`

- Provides create, edit, and view modes.
- Keeps the fast drawer workflow described in the product overview.
- Hosts `ItemForm` for create/edit and a read-only preview for view mode.

`ItemForm`

- Handles shared fields: title, description, favorite, pinned, collections, tags, and custom type.
- Delegates type-specific fields to `ItemFieldSet`.
- Calls server actions and displays field-level errors.

`ItemFieldSet`

- Chooses `TextItemFields`, `FileItemFields`, or `LinkItemFields` from `contentKind` and item type metadata.
- Owns field visibility and user-facing labels.

`ItemDeleteDialog`

- Handles destructive confirmation.
- Calls `deleteItem`.

## CRUD Flow

Create:

1. User opens the drawer from `New Item` or a type page action.
2. The current route type preselects `Item.kind` and `contentKind`.
3. `ItemForm` gathers shared and type-specific fields.
4. `createItem` validates, creates `Item`, replaces tags/collections, and revalidates routes.
5. UI closes the drawer and shows the new item in the list.

Update:

1. User opens an item in edit mode.
2. Server route or drawer fetches item detail scoped by `userId`.
3. `updateItem` validates ownership and input.
4. The action updates base fields and replaces tags/collections in one transaction.

Delete:

1. User confirms in `ItemDeleteDialog`.
2. `deleteItem` scopes delete by `id` and `userId`.
3. Prisma cascade behavior removes collection and tag join rows.
4. The action revalidates affected routes.

View/Recent:

1. Opening a drawer or detail view should call `markItemViewed`.
2. The action updates `lastViewedAt`.
3. Existing dashboard recent-item queries can keep using `lastViewedAt`.

## Transactions And Ownership

Create and update should use a Prisma transaction because an item write, collection membership, and tags need to stay in sync. Delete can rely on existing cascade relations for `CollectionItem`, `ItemTag`, and `AiJob`, but it still must scope by authenticated `userId`.

Recommended ownership pattern:

```ts
const session = await auth();
if (!session?.user?.id) return { success: false, error: "Unauthorized" };

await prisma.item.update({
  where: { id: input.id, userId: session.user.id },
  data,
});
```

If the generated Prisma client does not support compound `where` without a declared unique key, use `updateMany` with `{ id, userId }` and require `count === 1`, or read the item by `id` and `userId` inside a transaction before updating.

## Upload Boundary

File and image item rows should store object metadata and storage references, not bytes. The CRUD action can persist finalized upload metadata, but actual upload signing and object transfer should use a route handler or dedicated server endpoint because the project notes reserve API routes for uploads and integrations.

Recommended flow:

1. `FileItemFields` requests a signed upload URL.
2. The browser uploads directly to object storage.
3. `createItem` or `updateItem` persists `storageKey`, `mimeType`, `originalFileName`, and `fileSizeBytes`.

## Route Protection

When item pages ship, update `src/proxy.ts` to protect:

```ts
matcher: ["/dashboard/:path*", "/profile", "/items/:path*"]
```

Server actions must still authenticate independently. Proxy protection improves page navigation, but mutation security belongs in the action.

## Source Notes

The research prompt listed `docs/content-types.md` and `src/lib/constants.tsx`; neither file exists in the current repo. The current item-type reference is `docs/item-types.md`, type metadata is seeded from `prisma/seed-data.ts`, and runtime display mapping currently lives in `src/lib/db/items.ts` and `src/components/dashboard/DashboardFrame.tsx`.
