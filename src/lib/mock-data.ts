export type ItemKind =
  | "snippet"
  | "prompt"
  | "note"
  | "command"
  | "file"
  | "image"
  | "link";

export type ContentKind = "text" | "file" | "url";

export type PlanTier = "free" | "pro";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  plan: PlanTier;
}

export interface MockItemType {
  id: ItemKind;
  label: string;
  pluralLabel: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
  isPro: boolean;
}

export interface MockCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  isFavorite: boolean;
  itemCount: number;
  itemTypeIds: ItemKind[];
  itemIds: string[];
  updatedAt: string;
}

export interface MockItem {
  id: string;
  title: string;
  kind: ItemKind;
  contentKind: ContentKind;
  description: string;
  content?: string;
  sourceUrl?: string;
  language?: string;
  tags: string[];
  collectionIds: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastViewedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const currentUser: MockUser = {
  id: "user-john-doe",
  name: "John Doe",
  email: "demo@devstash.com",
  imageUrl: "/avatars/john-doe.png",
  plan: "free",
};

export const itemTypes: MockItemType[] = [
  {
    id: "snippet",
    label: "Snippet",
    pluralLabel: "Snippets",
    slug: "snippets",
    icon: "Code",
    color: "#3b82f6",
    count: 24,
    isPro: false,
  },
  {
    id: "prompt",
    label: "Prompt",
    pluralLabel: "Prompts",
    slug: "prompts",
    icon: "Sparkles",
    color: "#8b5cf6",
    count: 18,
    isPro: false,
  },
  {
    id: "command",
    label: "Command",
    pluralLabel: "Commands",
    slug: "commands",
    icon: "Terminal",
    color: "#f97316",
    count: 15,
    isPro: false,
  },
  {
    id: "note",
    label: "Note",
    pluralLabel: "Notes",
    slug: "notes",
    icon: "StickyNote",
    color: "#fde047",
    count: 12,
    isPro: false,
  },
  {
    id: "file",
    label: "File",
    pluralLabel: "Files",
    slug: "files",
    icon: "File",
    color: "#6b7280",
    count: 5,
    isPro: true,
  },
  {
    id: "image",
    label: "Image",
    pluralLabel: "Images",
    slug: "images",
    icon: "Image",
    color: "#ec4899",
    count: 3,
    isPro: true,
  },
  {
    id: "link",
    label: "Link",
    pluralLabel: "Links",
    slug: "links",
    icon: "Link",
    color: "#10b981",
    count: 8,
    isPro: false,
  },
];

export const collections: MockCollection[] = [
  {
    id: "collection-react-patterns",
    name: "React Patterns",
    slug: "react-patterns",
    description: "Common React patterns and hooks",
    color: "#3b82f6",
    icon: "Folder",
    isFavorite: true,
    itemCount: 12,
    itemTypeIds: ["snippet", "note", "link"],
    itemIds: [
      "item-use-auth-hook",
      "item-api-error-handling-pattern",
      "item-compound-components",
    ],
    updatedAt: "2026-01-15T14:30:00.000Z",
  },
  {
    id: "collection-python-snippets",
    name: "Python Snippets",
    slug: "python-snippets",
    description: "Useful Python code snippets",
    color: "#3b82f6",
    icon: "Folder",
    isFavorite: false,
    itemCount: 8,
    itemTypeIds: ["snippet", "note"],
    itemIds: ["item-fastapi-route-template", "item-python-datetime-format"],
    updatedAt: "2026-01-14T19:10:00.000Z",
  },
  {
    id: "collection-context-files",
    name: "Context Files",
    slug: "context-files",
    description: "AI context files for projects",
    color: "#94a3b8",
    icon: "Folder",
    isFavorite: true,
    itemCount: 5,
    itemTypeIds: ["file", "note"],
    itemIds: ["item-project-overview-template", "item-architecture-context"],
    updatedAt: "2026-01-13T11:45:00.000Z",
  },
  {
    id: "collection-interview-prep",
    name: "Interview Prep",
    slug: "interview-prep",
    description: "Technical interview preparation",
    color: "#fde047",
    icon: "Folder",
    isFavorite: false,
    itemCount: 24,
    itemTypeIds: ["note", "snippet", "link", "prompt"],
    itemIds: [
      "item-system-design-checklist",
      "item-two-pointer-template",
      "item-interview-question-prompt",
    ],
    updatedAt: "2026-01-11T16:05:00.000Z",
  },
  {
    id: "collection-git-commands",
    name: "Git Commands",
    slug: "git-commands",
    description: "Frequently used git commands",
    color: "#f97316",
    icon: "Folder",
    isFavorite: true,
    itemCount: 15,
    itemTypeIds: ["command", "note"],
    itemIds: ["item-clean-local-branches", "item-find-merged-branches"],
    updatedAt: "2026-01-10T22:20:00.000Z",
  },
  {
    id: "collection-ai-prompts",
    name: "AI Prompts",
    slug: "ai-prompts",
    description: "Curated AI prompts for coding",
    color: "#8b5cf6",
    icon: "Folder",
    isFavorite: false,
    itemCount: 18,
    itemTypeIds: ["prompt", "snippet", "note"],
    itemIds: [
      "item-code-review-prompt",
      "item-refactor-planning-prompt",
      "item-debugging-prompt",
    ],
    updatedAt: "2026-01-09T09:35:00.000Z",
  },
];

export const items: MockItem[] = [
  {
    id: "item-use-auth-hook",
    title: "useAuth Hook",
    kind: "snippet",
    contentKind: "text",
    description: "Custom authentication hook for React applications",
    content:
      "export function useAuth() {\n  return { user, isLoading, signOut };\n}",
    language: "typescript",
    tags: ["react", "auth", "hooks"],
    collectionIds: ["collection-react-patterns"],
    isFavorite: true,
    isPinned: true,
    lastViewedAt: "2026-01-15T14:30:00.000Z",
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-15T14:30:00.000Z",
  },
  {
    id: "item-api-error-handling-pattern",
    title: "API Error Handling Pattern",
    kind: "snippet",
    contentKind: "text",
    description: "Fetch wrapper with exponential backoff retry logic",
    content:
      "async function fetchWithRetry(input: RequestInfo, init?: RequestInit) {\n  return fetch(input, init);\n}",
    language: "typescript",
    tags: ["api", "fetch", "retry"],
    collectionIds: ["collection-react-patterns"],
    isFavorite: false,
    isPinned: true,
    lastViewedAt: "2026-01-12T13:15:00.000Z",
    createdAt: "2025-12-28T18:00:00.000Z",
    updatedAt: "2026-01-12T13:15:00.000Z",
  },
  {
    id: "item-compound-components",
    title: "Compound Components",
    kind: "snippet",
    contentKind: "text",
    description: "Reusable component API pattern for shared state",
    language: "typescript",
    tags: ["react", "components", "patterns"],
    collectionIds: ["collection-react-patterns"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-01-08T17:25:00.000Z",
    createdAt: "2025-12-20T12:00:00.000Z",
    updatedAt: "2026-01-08T17:25:00.000Z",
  },
  {
    id: "item-fastapi-route-template",
    title: "FastAPI Route Template",
    kind: "snippet",
    contentKind: "text",
    description: "Starter route with request validation and typed response",
    language: "python",
    tags: ["python", "fastapi", "api"],
    collectionIds: ["collection-python-snippets"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-01-14T19:10:00.000Z",
    createdAt: "2026-01-03T15:40:00.000Z",
    updatedAt: "2026-01-14T19:10:00.000Z",
  },
  {
    id: "item-python-datetime-format",
    title: "Python Datetime Format",
    kind: "note",
    contentKind: "text",
    description: "Common strftime and timezone formatting notes",
    content: "Use timezone-aware datetimes for persisted timestamps.",
    tags: ["python", "datetime"],
    collectionIds: ["collection-python-snippets"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-01-07T08:50:00.000Z",
    createdAt: "2025-12-30T09:15:00.000Z",
    updatedAt: "2026-01-07T08:50:00.000Z",
  },
  {
    id: "item-project-overview-template",
    title: "Project Overview Template",
    kind: "file",
    contentKind: "file",
    description: "Reusable Markdown outline for product context files",
    tags: ["context", "markdown", "template"],
    collectionIds: ["collection-context-files"],
    isFavorite: true,
    isPinned: false,
    lastViewedAt: "2026-01-13T11:45:00.000Z",
    createdAt: "2026-01-01T20:30:00.000Z",
    updatedAt: "2026-01-13T11:45:00.000Z",
  },
  {
    id: "item-architecture-context",
    title: "Architecture Context",
    kind: "note",
    contentKind: "text",
    description: "System boundaries, containers, and runtime flow notes",
    tags: ["architecture", "context"],
    collectionIds: ["collection-context-files"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-01-05T10:30:00.000Z",
    createdAt: "2025-12-26T14:00:00.000Z",
    updatedAt: "2026-01-05T10:30:00.000Z",
  },
  {
    id: "item-system-design-checklist",
    title: "System Design Checklist",
    kind: "note",
    contentKind: "text",
    description: "High-level checklist for architecture interviews",
    tags: ["interview", "system-design"],
    collectionIds: ["collection-interview-prep"],
    isFavorite: false,
    isPinned: true,
    lastViewedAt: "2026-01-11T16:05:00.000Z",
    createdAt: "2025-12-18T07:20:00.000Z",
    updatedAt: "2026-01-11T16:05:00.000Z",
  },
  {
    id: "item-two-pointer-template",
    title: "Two Pointer Template",
    kind: "snippet",
    contentKind: "text",
    description: "Reusable algorithm template for array problems",
    language: "typescript",
    tags: ["interview", "algorithms"],
    collectionIds: ["collection-interview-prep"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-01-06T21:10:00.000Z",
    createdAt: "2025-12-22T19:40:00.000Z",
    updatedAt: "2026-01-06T21:10:00.000Z",
  },
  {
    id: "item-interview-question-prompt",
    title: "Interview Question Prompt",
    kind: "prompt",
    contentKind: "text",
    description: "Prompt for generating focused practice questions",
    tags: ["interview", "practice", "prompt"],
    collectionIds: ["collection-interview-prep", "collection-ai-prompts"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-01-04T18:30:00.000Z",
    createdAt: "2025-12-27T16:45:00.000Z",
    updatedAt: "2026-01-04T18:30:00.000Z",
  },
  {
    id: "item-clean-local-branches",
    title: "Clean Local Branches",
    kind: "command",
    contentKind: "text",
    description: "Delete local branches that have already been merged",
    content: "git branch --merged main | grep -v main | xargs git branch -d",
    tags: ["git", "cleanup"],
    collectionIds: ["collection-git-commands"],
    isFavorite: true,
    isPinned: false,
    lastViewedAt: "2026-01-10T22:20:00.000Z",
    createdAt: "2025-12-16T11:10:00.000Z",
    updatedAt: "2026-01-10T22:20:00.000Z",
  },
  {
    id: "item-find-merged-branches",
    title: "Find Merged Branches",
    kind: "command",
    contentKind: "text",
    description: "Show merged branches before deleting anything",
    content: "git branch --merged main",
    tags: ["git", "branches"],
    collectionIds: ["collection-git-commands"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-01-03T12:35:00.000Z",
    createdAt: "2025-12-19T15:10:00.000Z",
    updatedAt: "2026-01-03T12:35:00.000Z",
  },
  {
    id: "item-code-review-prompt",
    title: "Code Review Prompt",
    kind: "prompt",
    contentKind: "text",
    description: "Review code for bugs, regressions, and missing tests",
    tags: ["ai", "review", "quality"],
    collectionIds: ["collection-ai-prompts"],
    isFavorite: true,
    isPinned: true,
    lastViewedAt: "2026-01-09T09:35:00.000Z",
    createdAt: "2025-12-21T13:55:00.000Z",
    updatedAt: "2026-01-09T09:35:00.000Z",
  },
  {
    id: "item-refactor-planning-prompt",
    title: "Refactor Planning Prompt",
    kind: "prompt",
    contentKind: "text",
    description: "Plan a focused refactor before touching code",
    tags: ["ai", "refactor", "planning"],
    collectionIds: ["collection-ai-prompts"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-01-02T09:20:00.000Z",
    createdAt: "2025-12-17T08:45:00.000Z",
    updatedAt: "2026-01-02T09:20:00.000Z",
  },
  {
    id: "item-debugging-prompt",
    title: "Debugging Prompt",
    kind: "prompt",
    contentKind: "text",
    description: "Guide an AI assistant through a failing test or runtime bug",
    tags: ["ai", "debugging"],
    collectionIds: ["collection-ai-prompts"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-01-01T17:10:00.000Z",
    createdAt: "2025-12-15T10:05:00.000Z",
    updatedAt: "2026-01-01T17:10:00.000Z",
  },
  {
    id: "item-tailwind-v4-docs",
    title: "Tailwind CSS v4 Docs",
    kind: "link",
    contentKind: "url",
    description: "Official Tailwind CSS documentation",
    sourceUrl: "https://tailwindcss.com/docs",
    tags: ["tailwind", "css", "docs"],
    collectionIds: ["collection-react-patterns"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2025-12-31T14:25:00.000Z",
    createdAt: "2025-12-14T20:00:00.000Z",
    updatedAt: "2025-12-31T14:25:00.000Z",
  },
];

export const dashboardMockData = {
  currentUser,
  itemTypes,
  collections,
  items,
};
