"use client";

import {
  Edit,
  Heart,
  Loader2,
  MoreVertical,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  deleteCollection,
  updateCollection,
} from "@/actions/collections";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CollectionActionToast =
  | { message: string; variant: "error" | "success" }
  | null;

interface CollectionActionTarget {
  description: string;
  id: string;
  name: string;
}

// ─── Dropdown Menu (3-dots) ──────────────────────────────────────────────────

interface CollectionDropdownMenuProps {
  collection: CollectionActionTarget;
}

export function CollectionDropdownMenu({
  collection,
}: CollectionDropdownMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Collection actions"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={(e) => e.preventDefault()}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>
            <Heart className="size-4" />
            Favorite
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CollectionEditDialog
        collection={collection}
        onOpenChange={setEditOpen}
        open={editOpen}
      />
      <CollectionDeleteDialog
        collection={collection}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
      />
    </>
  );
}

// ─── Detail Page Action Buttons ──────────────────────────────────────────────

interface CollectionDetailActionsProps {
  collection: CollectionActionTarget;
}

export function CollectionDetailActions({
  collection,
}: CollectionDetailActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          aria-label="Edit collection"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setEditOpen(true)}
          type="button"
        >
          <Edit className="size-4" />
        </button>
        <button
          aria-label="Favorite collection"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          type="button"
        >
          <Heart className="size-4" />
        </button>
        <button
          aria-label="Delete collection"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
          type="button"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <CollectionEditDialog
        collection={collection}
        onOpenChange={setEditOpen}
        open={editOpen}
      />
      <CollectionDeleteDialog
        collection={collection}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
      />
    </>
  );
}

// ─── Edit Dialog ─────────────────────────────────────────────────────────────

interface CollectionEditDialogProps {
  collection: CollectionActionTarget;
  onOpenChange(open: boolean): void;
  open: boolean;
}

function CollectionEditDialog({
  collection,
  onOpenChange,
  open,
}: CollectionEditDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl overflow-hidden">
        {open ? (
          <CollectionEditForm
            collection={collection}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CollectionEditForm({
  collection,
  onOpenChange,
}: {
  collection: CollectionActionTarget;
  onOpenChange(open: boolean): void;
}) {
  const router = useRouter();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<CollectionActionToast>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting && !nextOpen) return;
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    const result = await updateCollection({
      collectionId: collection.id,
      description,
      name,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setToast({ message: "Collection updated.", variant: "success" });
    onOpenChange(false);
    router.refresh();
  }

  const isSubmitDisabled = !name.trim() || isSubmitting;

  return (
    <>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className="flex items-start gap-4 border-b border-border px-6 py-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Edit className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-xl font-semibold">
              Edit Collection
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit collection metadata.
            </DialogDescription>
          </div>
          <button
            aria-label="Close edit collection dialog"
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
              aria-invalid={!name.trim()}
              className="h-11"
              onChange={(e) => setName(e.target.value)}
              placeholder="React Patterns"
              required
              value={name}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Description
            </span>
            <textarea
              className={cn(
                "min-h-28 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30",
              )}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reusable examples, notes, and links for React work"
              value={description}
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
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </div>
      </form>
      <CollectionActionToastMessage toast={toast} />
    </>
  );
}

// ─── Delete Confirmation Dialog ──────────────────────────────────────────────

interface CollectionDeleteDialogProps {
  collection: CollectionActionTarget;
  onOpenChange(open: boolean): void;
  open: boolean;
}

function CollectionDeleteDialog({
  collection,
  onOpenChange,
  open,
}: CollectionDeleteDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<CollectionActionToast>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function handleConfirm() {
    setIsDeleting(true);

    const result = await deleteCollection({
      collectionId: collection.id,
    });

    setIsDeleting(false);

    if (!result.success) {
      setToast({ message: result.error, variant: "error" });
      onOpenChange(false);
      return;
    }

    setToast({ message: "Collection deleted.", variant: "success" });
    onOpenChange(false);
    router.push("/collections");
    router.refresh();
  }

  return (
    <>
      <AlertDialog onOpenChange={onOpenChange} open={open}>
        <AlertDialogContent>
          <AlertDialogTitle className="text-lg font-semibold">
            Delete &ldquo;{collection.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
            This will delete the collection. Items in this collection will not be
            deleted — they will simply no longer belong to this collection.
          </AlertDialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              disabled={isDeleting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="gap-2"
              disabled={isDeleting}
              onClick={handleConfirm}
              type="button"
              variant="destructive"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Delete collection
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <CollectionActionToastMessage toast={toast} />
    </>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function CollectionActionToastMessage({
  toast,
}: {
  toast: CollectionActionToast;
}) {
  if (!toast) return null;

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
