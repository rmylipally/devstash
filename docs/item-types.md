# Item Types

DevStash has seven built-in item types: snippet, prompt, command, note, file, image, and link. The stable behavior key is `Item.kind`; database-backed display metadata lives in `ItemType`; and storage behavior is represented by `Item.contentKind`.

Sources: `context/project-overview.md:70`, `context/project-overview.md:76`, `context/project-overview.md:313`, `context/project-overview.md:363`, `context/project-overview.md:379`, `context/project-overview.md:525`, `prisma/schema.prisma:15`, `prisma/schema.prisma:25`, `prisma/schema.prisma:105`, `prisma/schema.prisma:121`, `prisma/seed-data.ts:70`, `prisma/seed.ts:60`, `src/lib/db/items.ts:309`, `src/components/dashboard/DashboardFrame.tsx:39`.

## Type Catalog

| Type | Prisma kind | Icon | Color | Plan | Storage | Route slug | Purpose | Key fields used |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Snippet | `SNIPPET` | `Code` | `#3b82f6` | Free | `TEXT` | `snippets` | Reusable code blocks and implementation patterns. | `title`, `description`, `content`, `language`, `tags`, `metadata`, favorite/pinned/recent fields |
| Prompt | `PROMPT` | `Sparkles` | `#8b5cf6` | Free | `TEXT` | `prompts` | AI prompts, reusable instructions, review prompts, and workflow prompts. | `title`, `description`, `content`, `tags`, `metadata`, favorite/pinned/recent fields |
| Command | `COMMAND` | `Terminal` | `#f97316` | Free | `TEXT` | `commands` | Shell commands, scripts, deploy commands, and terminal recipes. | `title`, `description`, `content`, `tags`, `metadata`, favorite/pinned/recent fields |
| Note | `NOTE` | `StickyNote` | `#fde047` | Free | `TEXT` | `notes` | General markdown/text notes and developer knowledge that is not code, prompt, or command shaped. | `title`, `description`, `content`, `tags`, `metadata`, favorite/pinned/recent fields |
| File | `FILE` | `File` | `#6b7280` | Pro | `FILE` | `files` | Uploaded non-image files. Database stores metadata and storage references, not file bytes. | `title`, `description`, `mimeType`, `storageKey`, `originalFileName`, `fileSizeBytes`, `metadata`, favorite/pinned/recent fields |
| Image | `IMAGE` | `Image` | `#ec4899` | Pro | `FILE` | `images` | Uploaded image assets. It shares file-storage fields with files but is displayed as the image-specific system kind. | `title`, `description`, `mimeType`, `storageKey`, `originalFileName`, `fileSizeBytes`, `metadata`, favorite/pinned/recent fields |
| Link | `LINK` | `Link` | `#10b981` | Free | `URL` | `links` | External references, documentation, design resources, and bookmarked URLs. | `title`, `description`, `sourceUrl`, `tags`, `metadata`, favorite/pinned/recent fields |

## Storage Classification

Text-backed types are `SNIPPET`, `PROMPT`, `COMMAND`, and `NOTE`. These use `contentKind = TEXT` and store the main body in `Item.content`; snippets and some command-like examples may also use `Item.language`.

File-backed types are `FILE` and `IMAGE`. These use `contentKind = FILE` and should store object metadata in `mimeType`, `storageKey`, `originalFileName`, and `fileSizeBytes`. Project guidance says uploaded objects live in object storage while the database keeps references and metadata.

URL-backed items are `LINK`. These use `contentKind = URL` and store the destination in `Item.sourceUrl`.

## Shared Properties

All item types share the base `Item` fields: `id`, `title`, `kind`, `contentKind`, optional `description`, optional `metadata`, `aiSummary`, `isFavorite`, `isPinned`, `lastViewedAt`, ownership through `userId`, optional `customTypeId`, tags, collections, AI jobs, and timestamps.

All built-in type metadata shares the `ItemType` fields: `id`, `kind`, `label`, `pluralLabel`, `slug`, `icon`, `color`, `isSystem`, `isPro`, `sortOrder`, and timestamps. The seed writes one `ItemType` row per system type using the lowercase name as `id`.

## Display Behavior

The dashboard reads system item types ordered by `sortOrder`, joins user item counts by `kind`, and maps Prisma enum values to lowercase dashboard ids. The sidebar renders each type at `/items/{slug}`, uses Lucide icons, applies type-specific color classes, and shows a `PRO` badge for `file` and `image`.

Current seeded display order is:

1. Snippets
2. Prompts
3. Commands
4. Notes
5. Files
6. Images
7. Links

## Seed Coverage

Current demo data includes text examples for snippets, prompts, and commands, plus URL examples for links. The seed metadata defines file and image system types, but the demo item seed does not currently include `FILE` or `IMAGE` items.

## Source Notes

The research prompt listed `src/lib/constants.tsx`, but that file does not exist in the current repo. The active item type metadata source is `prisma/seed-data.ts`, persistence is handled in `prisma/seed.ts`, schema fields are defined in `prisma/schema.prisma`, and dashboard display mapping is currently split between `src/lib/db/items.ts` and `src/components/dashboard/DashboardFrame.tsx`.
