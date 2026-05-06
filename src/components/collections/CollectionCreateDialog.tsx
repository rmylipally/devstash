"use client";

import { FolderPlus, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { DashboardCollection } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

type CollectionCreateToast =
  | {
      message: string;
      variant: "error" | "success";
    }
  | null;

type CollectionCreateResponse =
  | {
      data: DashboardCollection;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

interface CollectionCreateDraft {
  description: string;
  name: string;
}

interface CollectionCreateDialogProps {
  onCreated(): void;
  onOpenChange(open: boolean): void;
  open: boolean;
}

export function CollectionCreateButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<CollectionCreateToast>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function handleCreated() {
    setToast({
      message: "Collection created.",
      variant: "success",
    });
    router.refresh();
  }

  return (
    <>
      <Button
        aria-label="New Collection"
        className="h-11 gap-2 px-4"
        onClick={() => setIsOpen(true)}
        type="button"
        variant="outline"
      >
        <Plus className="size-5" />
        <span className="hidden sm:inline">New Collection</span>
      </Button>
      <CollectionCreateDialog
        onCreated={handleCreated}
        onOpenChange={setIsOpen}
        open={isOpen}
      />
      <CollectionCreateToastMessage toast={toast} />
    </>
  );
}

function CollectionCreateDialog({
  onCreated,
  onOpenChange,
  open,
}: CollectionCreateDialogProps) {
  const [draft, setDraft] = useState<CollectionCreateDraft>(() =>
    createDefaultDraft(),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleDraftChange(key: keyof CollectionCreateDraft, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting && !nextOpen) {
      return;
    }

    if (!nextOpen) {
      setDraft(createDefaultDraft());
      setError(null);
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    let result: CollectionCreateResponse;

    try {
      const response = await fetch("/api/collections", {
        body: JSON.stringify(getCollectionCreatePayload(draft)),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      result = (await response.json()) as CollectionCreateResponse;
    } catch {
      result = {
        success: false,
        error: "Could not create collection. Try again.",
      };
    }

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDraft(createDefaultDraft());
    onOpenChange(false);
    onCreated();
  }

  const isSubmitDisabled = !draft.name.trim() || isSubmitting;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex items-start gap-4 border-b border-border px-6 py-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderPlus className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold">
                New Collection
              </DialogTitle>
              <DialogDescription className="sr-only">
                Create a new collection.
              </DialogDescription>
            </div>
            <button
              aria-label="Close create collection dialog"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="space-y-6 px-6 py-6">
            {error ? (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <label className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                Name
              </span>
              <Input
                aria-invalid={!draft.name.trim()}
                className="h-11"
                onChange={(event) =>
                  handleDraftChange("name", event.target.value)
                }
                placeholder="React Patterns"
                required
                value={draft.name}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                Description
              </span>
              <CollectionCreateTextarea
                onChange={(event) =>
                  handleDraftChange("description", event.target.value)
                }
                placeholder="Reusable examples, notes, and links for React work"
                value={draft.description}
              />
            </label>
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
              Create collection
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CollectionCreateTextarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

function CollectionCreateToastMessage({
  toast,
}: {
  toast: CollectionCreateToast;
}) {
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

function createDefaultDraft(): CollectionCreateDraft {
  return {
    description: "",
    name: "",
  };
}

function getNullableDraftValue(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function getCollectionCreatePayload(draft: CollectionCreateDraft) {
  return {
    description: getNullableDraftValue(draft.description),
    name: draft.name.trim(),
  };
}
