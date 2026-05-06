"use client";

import {
  Code2,
  File,
  Image,
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
import { CollectionMultiSelect } from "@/components/items/CollectionMultiSelect";
import { FileUpload } from "@/components/items/FileUpload";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { DashboardCollectionOption } from "@/lib/db/collections";
import type { ItemCreateKind } from "@/lib/db/items";
import {
  isUploadItemKind,
  type UploadItemKind,
  type UploadedFileMetadata,
} from "@/lib/storage/uploads";
import { cn } from "@/lib/utils";

const createItemKinds: ItemCreateKind[] = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

const itemKindIcons: Record<ItemCreateKind, LucideIcon> = {
  command: Terminal,
  file: File,
  image: Image,
  link: LinkIcon,
  note: StickyNote,
  prompt: Sparkles,
  snippet: Code2,
};

const itemKindLabels: Record<ItemCreateKind, string> = {
  command: "Command",
  file: "File",
  image: "Image",
  link: "Link",
  note: "Note",
  prompt: "Prompt",
  snippet: "Snippet",
};

const itemKindStyles: Record<ItemCreateKind, string> = {
  command: "bg-orange-500/10 text-orange-400",
  file: "bg-slate-500/10 text-slate-400",
  image: "bg-pink-500/10 text-pink-400",
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
  collectionIds: string[];
  content: string;
  description: string;
  kind: ItemCreateKind;
  language: string;
  tags: string;
  title: string;
  uploadedFile: UploadedFileMetadata | null;
  url: string;
}

type ItemCreateTextDraftField = Exclude<keyof ItemCreateDraft, "uploadedFile">;
type ItemCreateStringDraftField = Exclude<
  ItemCreateTextDraftField,
  "collectionIds"
>;

interface ItemCreateDialogProps {
  availableCollections: DashboardCollectionOption[];
  initialKind: ItemCreateKind;
  onCreated(): void;
  onOpenChange(open: boolean): void;
  open: boolean;
}

interface ItemCreateButtonProps {
  availableCollections?: DashboardCollectionOption[];
  initialKind?: ItemCreateKind;
}

export function ItemCreateButton({
  availableCollections = [],
  initialKind,
}: ItemCreateButtonProps) {
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
        availableCollections={availableCollections}
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
  availableCollections,
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

  function handleDraftChange(key: ItemCreateStringDraftField, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  function handleCollectionIdsChange(collectionIds: string[]) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      collectionIds,
    }));
  }

  function handleUploadedFileChange(value: UploadedFileMetadata | null) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      uploadedFile: value,
    }));
  }

  function handleKindChange(kind: ItemCreateKind) {
    if (isUploadItemKind(draft.kind) && draft.uploadedFile) {
      void deleteUploadedFile(draft.kind, draft.uploadedFile.storageKey);
    }

    setDraft((currentDraft) => ({
      ...createDefaultDraft(kind),
      collectionIds: currentDraft.collectionIds,
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
      if (isUploadItemKind(draft.kind) && draft.uploadedFile) {
        void deleteUploadedFile(draft.kind, draft.uploadedFile.storageKey);
      }

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

    if (isUploadItemKind(draft.kind) && !draft.uploadedFile) {
      setError("Upload a file before creating this item.");
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
    (isUploadItemKind(draft.kind) && !draft.uploadedFile) ||
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

              <CollectionMultiSelect
                availableCollections={availableCollections}
                label="Collections"
                onCollectionIdsChange={handleCollectionIdsChange}
                selectedCollectionIds={draft.collectionIds}
              />

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

              {isUploadItemKind(draft.kind) ? (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Upload
                  </span>
                  <FileUpload
                    disabled={isSubmitting}
                    kind={draft.kind}
                    onChange={handleUploadedFileChange}
                    value={draft.uploadedFile}
                  />
                </div>
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
    collectionIds: [],
    content: "",
    description: "",
    kind,
    language: "",
    tags: "",
    title: "",
    uploadedFile: null,
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
    collectionIds: draft.collectionIds,
    ...(shouldShowContentField(draft.kind)
      ? { content: getNullableDraftValue(draft.content) }
      : {}),
    description: getNullableDraftValue(draft.description),
    kind: draft.kind,
    ...(shouldShowLanguageField(draft.kind)
      ? { language: getNullableDraftValue(draft.language) }
      : {}),
    ...(isUploadItemKind(draft.kind) && draft.uploadedFile
      ? {
          fileSizeBytes: draft.uploadedFile.fileSizeBytes,
          mimeType: draft.uploadedFile.mimeType,
          originalFileName: draft.uploadedFile.originalFileName,
          storageKey: draft.uploadedFile.storageKey,
        }
      : {}),
    tags: getDraftTags(draft.tags),
    title: draft.title,
    ...(draft.kind === "link" ? { url: getNullableDraftValue(draft.url) } : {}),
  };
}

async function deleteUploadedFile(kind: UploadItemKind, storageKey: string) {
  try {
    await fetch("/api/uploads", {
      body: JSON.stringify({ kind, storageKey }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });
  } catch {
    // Upload cleanup is best-effort and should not block dialog interaction.
  }
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
