"use client";

import {
  Code2,
  Link as LinkIcon,
  Loader2,
  Plus,
  Sparkles,
  StickyNote,
  Terminal,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";

import { createItem } from "@/actions/items";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ItemCreateKind } from "@/lib/db/items";
import { cn } from "@/lib/utils";

const createItemKinds: ItemCreateKind[] = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
];

const itemKindIcons: Record<ItemCreateKind, LucideIcon> = {
  command: Terminal,
  link: LinkIcon,
  note: StickyNote,
  prompt: Sparkles,
  snippet: Code2,
};

const itemKindLabels: Record<ItemCreateKind, string> = {
  command: "Command",
  link: "Link",
  note: "Note",
  prompt: "Prompt",
  snippet: "Snippet",
};

const itemKindStyles: Record<ItemCreateKind, string> = {
  command: "bg-orange-500/10 text-orange-400",
  link: "bg-emerald-500/10 text-emerald-400",
  note: "bg-yellow-500/10 text-yellow-300",
  prompt: "bg-violet-500/10 text-violet-400",
  snippet: "bg-blue-500/10 text-blue-400",
};

type CreateItemToast =
  | {
      message: string;
      variant: "error" | "success";
    }
  | null;

interface ItemCreateDraft {
  content: string;
  description: string;
  kind: ItemCreateKind;
  language: string;
  tags: string;
  title: string;
  url: string;
}

interface ItemCreateDialogProps {
  initialKind: ItemCreateKind;
  onCreated(): void;
  onOpenChange(open: boolean): void;
  open: boolean;
}

interface ItemCreateButtonProps {
  initialKind?: ItemCreateKind;
}

export function ItemCreateButton({ initialKind }: ItemCreateButtonProps) {
  const router = useRouter();
  const selectedInitialKind = initialKind ?? "snippet";
  const buttonLabel = initialKind
    ? `New ${itemKindLabels[initialKind]}`
    : "New Item";
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<CreateItemToast>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function handleCreated() {
    setToast({
      message: "Item created.",
      variant: "success",
    });
    router.refresh();
  }

  return (
    <>
      <Button
        aria-label={buttonLabel}
        className="h-11 gap-2 px-4"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Plus className="size-5" />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </Button>
      <ItemCreateDialog
        initialKind={selectedInitialKind}
        onCreated={handleCreated}
        onOpenChange={setIsOpen}
        open={isOpen}
      />
      <CreateItemToastMessage toast={toast} />
    </>
  );
}

function ItemCreateDialog({
  initialKind,
  onCreated,
  onOpenChange,
  open,
}: ItemCreateDialogProps) {
  const [draft, setDraft] = useState<ItemCreateDraft>(() =>
    createDefaultDraft(initialKind),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleDraftChange(key: keyof ItemCreateDraft, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  function handleKindChange(kind: ItemCreateKind) {
    setDraft((currentDraft) => ({
      ...createDefaultDraft(kind),
      description: currentDraft.description,
      tags: currentDraft.tags,
      title: currentDraft.title,
    }));
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting && !nextOpen) {
      return;
    }

    if (!nextOpen) {
      setDraft(createDefaultDraft(initialKind));
      setError(null);
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim()) {
      return;
    }

    if (draft.kind === "link" && !draft.url.trim()) {
      setError("URL is required for links.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    let result: Awaited<ReturnType<typeof createItem>>;

    try {
      result = await createItem(getItemCreatePayload(draft));
    } catch {
      result = {
        success: false,
        error: "Could not create item. Try again.",
      };
    }

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDraft(createDefaultDraft(initialKind));
    onOpenChange(false);
    onCreated();
  }

  const TypeIcon = itemKindIcons[draft.kind];
  const isSubmitDisabled =
    !draft.title.trim() ||
    (draft.kind === "link" && !draft.url.trim()) ||
    isSubmitting;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[min(92dvh,48rem)] max-w-3xl overflow-hidden">
        <form className="flex max-h-[min(92dvh,48rem)] flex-col" onSubmit={handleSubmit}>
          <div className="flex items-start gap-4 border-b border-border px-6 py-5">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-lg",
                itemKindStyles[draft.kind],
              )}
            >
              <TypeIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold">
                New item
              </DialogTitle>
              <DialogDescription className="sr-only">
                Create a new saved item.
              </DialogDescription>
            </div>
            <button
              aria-label="Close create item dialog"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {error ? (
                <div
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-muted-foreground">
                  Type
                </legend>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {createItemKinds.map((kind) => {
                    const Icon = itemKindIcons[kind];
                    const isSelected = draft.kind === kind;

                    return (
                      <Button
                        aria-pressed={isSelected}
                        className={cn(
                          "h-auto justify-start gap-3 px-3 py-3",
                          isSelected && "border-primary/60 bg-muted",
                        )}
                        key={kind}
                        onClick={() => handleKindChange(kind)}
                        type="button"
                        variant="outline"
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
                            itemKindStyles[kind],
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span>{itemKindLabels[kind]}</span>
                      </Button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Title
                  </span>
                  <Input
                    aria-invalid={!draft.title.trim()}
                    className="h-11"
                    onChange={(event) =>
                      handleDraftChange("title", event.target.value)
                    }
                    placeholder="useDebounce Hook"
                    required
                    value={draft.title}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Tags
                  </span>
                  <Input
                    className="h-11"
                    onChange={(event) =>
                      handleDraftChange("tags", event.target.value)
                    }
                    placeholder="react, hooks"
                    value={draft.tags}
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Description
                </span>
                <CreateItemTextarea
                  onChange={(event) =>
                    handleDraftChange("description", event.target.value)
                  }
                  placeholder="Short context for this item"
                  value={draft.description}
                />
              </label>

              {shouldShowContentField(draft.kind) ? (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Content
                  </span>
                  {isCodeItemKind(draft.kind) ? (
                    <CodeEditor
                      ariaLabel={`${itemKindLabels[draft.kind]} content`}
                      language={getCodeEditorLanguage(draft.kind, draft.language)}
                      onChange={(value) => handleDraftChange("content", value)}
                      placeholder="Paste the reusable content"
                      value={draft.content}
                    />
                  ) : isMarkdownItemKind(draft.kind) ? (
                    <MarkdownEditor
                      ariaLabel={`${itemKindLabels[draft.kind]} content`}
                      onChange={(value) => handleDraftChange("content", value)}
                      placeholder="Paste the reusable content"
                      value={draft.content}
                    />
                  ) : (
                    <CreateItemTextarea
                      className="min-h-44 font-mono text-sm"
                      onChange={(event) =>
                        handleDraftChange("content", event.target.value)
                      }
                      placeholder="Paste the reusable content"
                      value={draft.content}
                    />
                  )}
                </div>
              ) : null}

              {shouldShowLanguageField(draft.kind) ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Language
                  </span>
                  <Input
                    className="h-11"
                    onChange={(event) =>
                      handleDraftChange("language", event.target.value)
                    }
                    placeholder={draft.kind === "command" ? "bash" : "typescript"}
                    value={draft.language}
                  />
                </label>
              ) : null}

              {draft.kind === "link" ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    URL
                  </span>
                  <Input
                    aria-invalid={!draft.url.trim()}
                    className="h-11"
                    onChange={(event) =>
                      handleDraftChange("url", event.target.value)
                    }
                    placeholder="https://example.com"
                    required
                    type="url"
                    value={draft.url}
                  />
                </label>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="gap-2"
              disabled={isSubmitDisabled}
              type="submit"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateItemTextarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

function CreateItemToastMessage({ toast }: { toast: CreateItemToast }) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] w-[min(24rem,calc(100vw-2.5rem))]">
      <div
        className={cn(
          "rounded-lg border bg-background px-4 py-3 text-sm shadow-xl",
          toast.variant === "success"
            ? "border-emerald-500/30 text-emerald-300"
            : "border-destructive/30 text-destructive",
        )}
        role={toast.variant === "success" ? "status" : "alert"}
      >
        {toast.message}
      </div>
    </div>
  );
}

function createDefaultDraft(kind: ItemCreateKind = "snippet"): ItemCreateDraft {
  return {
    content: "",
    description: "",
    kind,
    language: "",
    tags: "",
    title: "",
    url: "",
  };
}

function getNullableDraftValue(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function getDraftTags(value: string) {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return Array.from(new Set(tags));
}

function getItemCreatePayload(draft: ItemCreateDraft) {
  return {
    ...(shouldShowContentField(draft.kind)
      ? { content: getNullableDraftValue(draft.content) }
      : {}),
    description: getNullableDraftValue(draft.description),
    kind: draft.kind,
    ...(shouldShowLanguageField(draft.kind)
      ? { language: getNullableDraftValue(draft.language) }
      : {}),
    tags: getDraftTags(draft.tags),
    title: draft.title,
    ...(draft.kind === "link" ? { url: getNullableDraftValue(draft.url) } : {}),
  };
}

function shouldShowContentField(kind: ItemCreateKind) {
  return (
    kind === "command" ||
    kind === "note" ||
    kind === "prompt" ||
    kind === "snippet"
  );
}

function shouldShowLanguageField(kind: ItemCreateKind) {
  return kind === "command" || kind === "snippet";
}

function isCodeItemKind(kind: ItemCreateKind) {
  return kind === "command" || kind === "snippet";
}

function isMarkdownItemKind(kind: ItemCreateKind) {
  return kind === "note" || kind === "prompt";
}

function getCodeEditorLanguage(kind: ItemCreateKind, language: string) {
  const trimmedLanguage = language.trim();

  if (trimmedLanguage) {
    return trimmedLanguage;
  }

  return kind === "command" ? "shell" : "typescript";
}
