export interface ChaosIconItem {
  id: string;
  label: string;
  tone: string;
}

export interface FeatureCardItem {
  accent: string;
  description: string;
  title: string;
}

export interface DashboardPreviewItem {
  accent: string;
  title: string;
}

export const chaosIcons: ChaosIconItem[] = [
  { id: "notion", label: "N", tone: "border-white/50" },
  { id: "github", label: "GH", tone: "border-slate-300/55" },
  { id: "slack", label: "S", tone: "border-violet-400/55" },
  { id: "vscode", label: "VS", tone: "border-cyan-400/55" },
  { id: "tabs", label: "TAB", tone: "border-blue-300/55" },
  { id: "terminal", label: "$", tone: "border-emerald-400/55" },
  { id: "text", label: "TXT", tone: "border-amber-400/55" },
  { id: "bookmark", label: "BM", tone: "border-pink-400/55" },
];

export const dashboardNavItems = [
  "Dashboard",
  "Snippets",
  "Prompts",
  "Files",
  "Collections",
];

export const dashboardPreviewItems: DashboardPreviewItem[] = [
  { title: "Snippet", accent: "#3b82f6" },
  { title: "Prompt", accent: "#f59e0b" },
  { title: "Command", accent: "#06b6d4" },
  { title: "Note", accent: "#22c55e" },
  { title: "File", accent: "#64748b" },
  { title: "Image", accent: "#ec4899" },
  { title: "Link", accent: "#6366f1" },
];

export const featureCards: FeatureCardItem[] = [
  {
    title: "Code Snippets",
    description: "Save production-ready snippets with language context and tags.",
    accent: "#3b82f6",
  },
  {
    title: "AI Prompts",
    description: "Store high-performing prompts and successful iterations.",
    accent: "#f59e0b",
  },
  {
    title: "Instant Search",
    description: "Find any item in seconds with a keyboard-first experience.",
    accent: "#6366f1",
  },
  {
    title: "Commands",
    description: "Capture shell commands and reusable terminal workflows.",
    accent: "#06b6d4",
  },
  {
    title: "Files & Docs",
    description: "Keep technical docs, references, and files with your context.",
    accent: "#64748b",
  },
  {
    title: "Collections",
    description: "Group related knowledge by project, task, or workstream.",
    accent: "#22c55e",
  },
];

export const aiChecklist = [
  "Generate tags from raw notes and snippets",
  "Create summaries for long technical references",
  "Suggest related items from your existing stash",
  "Improve prompt quality with saved context",
];
