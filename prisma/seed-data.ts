type ItemKind =
  | "SNIPPET"
  | "PROMPT"
  | "NOTE"
  | "COMMAND"
  | "FILE"
  | "IMAGE"
  | "LINK";

type ContentKind = "TEXT" | "FILE" | "URL";

type PlanTier = "FREE" | "PRO";

export interface DemoUserSeed {
  email: string;
  name: string;
  password: string;
  plan: PlanTier;
}

export interface SystemItemTypeSeed {
  color: string;
  icon: string;
  isPro: boolean;
  isSystem: true;
  name: string;
  kind: ItemKind;
  label: string;
  pluralLabel: string;
  slug: string;
  sortOrder: number;
}

export interface CollectionSeed {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  isFavorite: boolean;
  defaultKind: ItemKind | null;
}

export interface ItemSeed {
  id: string;
  title: string;
  kind: ItemKind;
  contentKind: ContentKind;
  collectionSlug: string;
  description: string;
  content?: string;
  sourceUrl?: string;
  language?: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastViewedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const demoUserSeed: DemoUserSeed = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
  plan: "FREE",
};

export const systemItemTypeSeeds: SystemItemTypeSeed[] = [
  {
    color: "#3b82f6",
    icon: "Code",
    isPro: false,
    isSystem: true,
    kind: "SNIPPET",
    label: "Snippet",
    name: "snippet",
    pluralLabel: "Snippets",
    slug: "snippets",
    sortOrder: 1,
  },
  {
    color: "#8b5cf6",
    icon: "Sparkles",
    isPro: false,
    isSystem: true,
    kind: "PROMPT",
    label: "Prompt",
    name: "prompt",
    pluralLabel: "Prompts",
    slug: "prompts",
    sortOrder: 2,
  },
  {
    color: "#f97316",
    icon: "Terminal",
    isPro: false,
    isSystem: true,
    kind: "COMMAND",
    label: "Command",
    name: "command",
    pluralLabel: "Commands",
    slug: "commands",
    sortOrder: 3,
  },
  {
    color: "#fde047",
    icon: "StickyNote",
    isPro: false,
    isSystem: true,
    kind: "NOTE",
    label: "Note",
    name: "note",
    pluralLabel: "Notes",
    slug: "notes",
    sortOrder: 4,
  },
  {
    color: "#6b7280",
    icon: "File",
    isPro: true,
    isSystem: true,
    kind: "FILE",
    label: "File",
    name: "file",
    pluralLabel: "Files",
    slug: "files",
    sortOrder: 5,
  },
  {
    color: "#ec4899",
    icon: "Image",
    isPro: true,
    isSystem: true,
    kind: "IMAGE",
    label: "Image",
    name: "image",
    pluralLabel: "Images",
    slug: "images",
    sortOrder: 6,
  },
  {
    color: "#10b981",
    icon: "Link",
    isPro: false,
    isSystem: true,
    kind: "LINK",
    label: "Link",
    name: "link",
    pluralLabel: "Links",
    slug: "links",
    sortOrder: 7,
  },
];

export const collectionSeeds: CollectionSeed[] = [
  {
    id: "collection-react-patterns",
    name: "React Patterns",
    slug: "react-patterns",
    description: "Reusable React patterns and hooks",
    color: "#3b82f6",
    icon: "Folder",
    isFavorite: true,
    defaultKind: "SNIPPET",
  },
  {
    id: "collection-ai-workflows",
    name: "AI Workflows",
    slug: "ai-workflows",
    description: "AI prompts and workflow automations",
    color: "#8b5cf6",
    icon: "Folder",
    isFavorite: true,
    defaultKind: "PROMPT",
  },
  {
    id: "collection-devops",
    name: "DevOps",
    slug: "devops",
    description: "Infrastructure and deployment resources",
    color: "#f97316",
    icon: "Folder",
    isFavorite: false,
    defaultKind: null,
  },
  {
    id: "collection-terminal-commands",
    name: "Terminal Commands",
    slug: "terminal-commands",
    description: "Useful shell commands for everyday development",
    color: "#f97316",
    icon: "Folder",
    isFavorite: true,
    defaultKind: "COMMAND",
  },
  {
    id: "collection-design-resources",
    name: "Design Resources",
    slug: "design-resources",
    description: "UI/UX resources and references",
    color: "#10b981",
    icon: "Folder",
    isFavorite: false,
    defaultKind: "LINK",
  },
];

export const itemSeeds: ItemSeed[] = [
  {
    id: "item-use-debounce-hook",
    title: "useDebounce Hook",
    kind: "SNIPPET",
    contentKind: "TEXT",
    collectionSlug: "react-patterns",
    description: "Delay fast-changing values before running expensive effects.",
    content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}`,
    language: "typescript",
    tags: ["react", "hooks", "performance"],
    isFavorite: true,
    isPinned: true,
    lastViewedAt: "2026-04-25T15:30:00.000Z",
    createdAt: "2026-04-20T10:00:00.000Z",
    updatedAt: "2026-04-25T15:30:00.000Z",
  },
  {
    id: "item-compound-tabs-pattern",
    title: "Compound Tabs Pattern",
    kind: "SNIPPET",
    contentKind: "TEXT",
    collectionSlug: "react-patterns",
    description: "Context-backed compound component structure for tabs.",
    content: `const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ children, defaultValue }: TabsProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      {children}
    </TabsContext.Provider>
  );
}`,
    language: "typescript",
    tags: ["react", "components", "patterns"],
    isFavorite: false,
    isPinned: true,
    lastViewedAt: "2026-04-24T17:45:00.000Z",
    createdAt: "2026-04-19T12:00:00.000Z",
    updatedAt: "2026-04-24T17:45:00.000Z",
  },
  {
    id: "item-classname-list-utility",
    title: "Class Name List Utility",
    kind: "SNIPPET",
    contentKind: "TEXT",
    collectionSlug: "react-patterns",
    description: "Small utility for composing conditional class names.",
    content: `export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}`,
    language: "typescript",
    tags: ["typescript", "utility", "css"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-23T09:20:00.000Z",
    createdAt: "2026-04-18T09:30:00.000Z",
    updatedAt: "2026-04-23T09:20:00.000Z",
  },
  {
    id: "item-code-review-prompt",
    title: "Code Review Prompt",
    kind: "PROMPT",
    contentKind: "TEXT",
    collectionSlug: "ai-workflows",
    description: "Review code for correctness, regressions, and missing tests.",
    content:
      "Review this change as a senior engineer. Lead with bugs and regressions, cite files and lines, and call out missing verification.",
    tags: ["ai", "review", "quality"],
    isFavorite: true,
    isPinned: true,
    lastViewedAt: "2026-04-25T14:10:00.000Z",
    createdAt: "2026-04-17T11:10:00.000Z",
    updatedAt: "2026-04-25T14:10:00.000Z",
  },
  {
    id: "item-doc-generation-prompt",
    title: "Documentation Generation Prompt",
    kind: "PROMPT",
    contentKind: "TEXT",
    collectionSlug: "ai-workflows",
    description: "Generate concise docs from code and product context.",
    content:
      "Write developer documentation for this module. Include purpose, public API, data flow, edge cases, and one realistic example.",
    tags: ["ai", "docs", "writing"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-22T13:35:00.000Z",
    createdAt: "2026-04-16T13:00:00.000Z",
    updatedAt: "2026-04-22T13:35:00.000Z",
  },
  {
    id: "item-refactoring-assistance-prompt",
    title: "Refactoring Assistance Prompt",
    kind: "PROMPT",
    contentKind: "TEXT",
    collectionSlug: "ai-workflows",
    description: "Plan a small refactor before making code changes.",
    content:
      "Analyze this code for the smallest useful refactor. Preserve behavior, identify risks, and propose a step-by-step plan with verification.",
    tags: ["ai", "refactor", "planning"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-21T16:25:00.000Z",
    createdAt: "2026-04-16T14:30:00.000Z",
    updatedAt: "2026-04-21T16:25:00.000Z",
  },
  {
    id: "item-docker-compose-postgres",
    title: "Postgres Docker Compose",
    kind: "SNIPPET",
    contentKind: "TEXT",
    collectionSlug: "devops",
    description: "Local PostgreSQL service for app development.",
    content: `services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: devstash
      POSTGRES_PASSWORD: devstash
      POSTGRES_DB: devstash_dev
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:`,
    language: "yaml",
    tags: ["docker", "postgres", "local-dev"],
    isFavorite: false,
    isPinned: true,
    lastViewedAt: "2026-04-20T18:00:00.000Z",
    createdAt: "2026-04-15T08:45:00.000Z",
    updatedAt: "2026-04-20T18:00:00.000Z",
  },
  {
    id: "item-deploy-prisma-migrations",
    title: "Deploy Prisma Migrations",
    kind: "COMMAND",
    contentKind: "TEXT",
    collectionSlug: "devops",
    description: "Run production-safe Prisma migrations during deploy.",
    content: "npx prisma migrate deploy",
    tags: ["prisma", "deploy", "database"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-19T15:15:00.000Z",
    createdAt: "2026-04-14T11:40:00.000Z",
    updatedAt: "2026-04-19T15:15:00.000Z",
  },
  {
    id: "item-prisma-migrate-docs",
    title: "Prisma Migrate Docs",
    kind: "LINK",
    contentKind: "URL",
    collectionSlug: "devops",
    description: "Official Prisma documentation for schema migrations.",
    sourceUrl: "https://www.prisma.io/docs/orm/prisma-migrate",
    tags: ["prisma", "docs", "database"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-18T10:20:00.000Z",
    createdAt: "2026-04-13T12:15:00.000Z",
    updatedAt: "2026-04-18T10:20:00.000Z",
  },
  {
    id: "item-dockerfile-reference",
    title: "Dockerfile Reference",
    kind: "LINK",
    contentKind: "URL",
    collectionSlug: "devops",
    description: "Official Dockerfile instruction reference.",
    sourceUrl: "https://docs.docker.com/reference/dockerfile/",
    tags: ["docker", "docs", "reference"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-17T08:30:00.000Z",
    createdAt: "2026-04-13T13:20:00.000Z",
    updatedAt: "2026-04-17T08:30:00.000Z",
  },
  {
    id: "item-git-recent-branches",
    title: "Show Recent Git Branches",
    kind: "COMMAND",
    contentKind: "TEXT",
    collectionSlug: "terminal-commands",
    description: "List recently updated local branches.",
    content: "git for-each-ref --sort=-committerdate refs/heads --format='%(committerdate:short) %(refname:short)'",
    tags: ["git", "branches"],
    isFavorite: true,
    isPinned: false,
    lastViewedAt: "2026-04-25T13:00:00.000Z",
    createdAt: "2026-04-12T09:10:00.000Z",
    updatedAt: "2026-04-25T13:00:00.000Z",
  },
  {
    id: "item-docker-prune-volumes",
    title: "Docker Prune Volumes",
    kind: "COMMAND",
    contentKind: "TEXT",
    collectionSlug: "terminal-commands",
    description: "Inspect disk usage before pruning Docker resources.",
    content: "docker system df && docker volume ls",
    tags: ["docker", "cleanup"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-24T10:05:00.000Z",
    createdAt: "2026-04-11T17:25:00.000Z",
    updatedAt: "2026-04-24T10:05:00.000Z",
  },
  {
    id: "item-find-process-by-port",
    title: "Find Process by Port",
    kind: "COMMAND",
    contentKind: "TEXT",
    collectionSlug: "terminal-commands",
    description: "Find the process occupying a local development port.",
    content: "lsof -nP -iTCP:3000 -sTCP:LISTEN",
    tags: ["terminal", "process", "debugging"],
    isFavorite: false,
    isPinned: true,
    lastViewedAt: "2026-04-23T18:45:00.000Z",
    createdAt: "2026-04-10T16:00:00.000Z",
    updatedAt: "2026-04-23T18:45:00.000Z",
  },
  {
    id: "item-npm-outdated-check",
    title: "Check Outdated Packages",
    kind: "COMMAND",
    contentKind: "TEXT",
    collectionSlug: "terminal-commands",
    description: "Review package updates without applying changes.",
    content: "npm outdated",
    tags: ["npm", "packages", "maintenance"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-22T09:50:00.000Z",
    createdAt: "2026-04-10T16:20:00.000Z",
    updatedAt: "2026-04-22T09:50:00.000Z",
  },
  {
    id: "item-tailwind-docs",
    title: "Tailwind CSS Docs",
    kind: "LINK",
    contentKind: "URL",
    collectionSlug: "design-resources",
    description: "Official Tailwind CSS documentation.",
    sourceUrl: "https://tailwindcss.com/docs",
    tags: ["tailwind", "css", "docs"],
    isFavorite: true,
    isPinned: false,
    lastViewedAt: "2026-04-21T11:35:00.000Z",
    createdAt: "2026-04-09T10:10:00.000Z",
    updatedAt: "2026-04-21T11:35:00.000Z",
  },
  {
    id: "item-shadcn-docs",
    title: "shadcn/ui Components",
    kind: "LINK",
    contentKind: "URL",
    collectionSlug: "design-resources",
    description: "Component examples and installation docs for shadcn/ui.",
    sourceUrl: "https://ui.shadcn.com/docs/components",
    tags: ["components", "ui", "shadcn"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-20T12:05:00.000Z",
    createdAt: "2026-04-09T10:25:00.000Z",
    updatedAt: "2026-04-20T12:05:00.000Z",
  },
  {
    id: "item-atlassian-design-system",
    title: "Atlassian Design System",
    kind: "LINK",
    contentKind: "URL",
    collectionSlug: "design-resources",
    description: "Practical design system reference for product UI.",
    sourceUrl: "https://atlassian.design/",
    tags: ["design-system", "ux", "reference"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-19T14:15:00.000Z",
    createdAt: "2026-04-08T08:20:00.000Z",
    updatedAt: "2026-04-19T14:15:00.000Z",
  },
  {
    id: "item-lucide-icons",
    title: "Lucide Icons",
    kind: "LINK",
    contentKind: "URL",
    collectionSlug: "design-resources",
    description: "Icon library used by the DevStash interface.",
    sourceUrl: "https://lucide.dev/icons/",
    tags: ["icons", "lucide", "ui"],
    isFavorite: false,
    isPinned: false,
    lastViewedAt: "2026-04-18T16:40:00.000Z",
    createdAt: "2026-04-08T08:45:00.000Z",
    updatedAt: "2026-04-18T16:40:00.000Z",
  },
];
