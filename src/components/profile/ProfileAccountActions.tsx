"use client";

import { KeyRound, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileAccountActionsProps {
  canChangePassword: boolean;
}

interface AccountDeleteResponse {
  error?: string;
  success: boolean;
}

export function ProfileAccountActions({
  canChangePassword,
}: ProfileAccountActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteAccount() {
    setDeleteError("");
    setIsDeleting(true);

    const response = await fetch("/api/account", {
      method: "DELETE",
    });
    const result = (await response.json()) as AccountDeleteResponse;

    if (response.ok && result.success) {
      await signOut({ redirectTo: "/sign-in?accountDeleted=1" });
      return;
    }

    setIsDeleting(false);
    setDeleteError(result.error ?? "Could not delete your account.");
  }

  return (
    <section
      aria-labelledby="account-actions-title"
      className="space-y-4 rounded-lg border border-border bg-card p-5 text-card-foreground"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold" id="account-actions-title">
          Account actions
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Manage password access or remove your DevStash account.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {canChangePassword ? (
          <Link
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 justify-start gap-2 px-3",
            )}
            href="/forgot-password"
          >
            <KeyRound className="size-4" />
            Change password
          </Link>
        ) : null}

        <details className="group rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-md px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 [&::-webkit-details-marker]:hidden">
            <Trash2 className="size-4" />
            Delete account
          </summary>
          <div
            aria-labelledby="delete-account-title"
            className="mt-3 space-y-3 rounded-md border border-destructive/30 bg-background p-3"
            role="dialog"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-semibold" id="delete-account-title">
                Confirm account deletion
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                This action cannot be undone. Your saved items, collections,
                sessions, and account records will be permanently removed.
              </p>
            </div>

            {deleteError ? (
              <p className="text-sm text-destructive">{deleteError}</p>
            ) : null}

            <Button
              className="h-10 w-full gap-2"
              disabled={isDeleting}
              onClick={() => void handleDeleteAccount()}
              type="button"
              variant="destructive"
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm delete account
            </Button>
          </div>
        </details>
      </div>
    </section>
  );
}
