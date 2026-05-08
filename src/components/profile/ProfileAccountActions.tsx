"use client";

import { KeyRound, Loader2, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ProfileAccountActionsProps {
  accountEmail?: string;
  canChangePassword: boolean;
}

interface AccountDeleteResponse {
  error?: string;
  success: boolean;
}

interface ForgotPasswordApiResponse {
  data?: {
    message?: string;
  };
  error?: string;
  success: boolean;
}

export function ProfileAccountActions({
  accountEmail,
  canChangePassword,
}: ProfileAccountActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

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

  async function handleSendResetLink() {
    setResetError("");
    setResetMessage("");

    if (!accountEmail) {
      setResetError("Could not find an email address for this account.");
      return;
    }

    setIsSendingReset(true);

    const response = await fetch("/api/auth/forgot-password", {
      body: JSON.stringify({ email: accountEmail }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as ForgotPasswordApiResponse;

    setIsSendingReset(false);

    if (response.ok && result.success) {
      setResetMessage(
        result.data?.message ??
          "If an account exists for that email, we sent password reset instructions.",
      );
      return;
    }

    setResetError(result.error ?? "Could not send password reset instructions.");
  }

  return (
    <section
      aria-labelledby="account-actions-title"
      className="space-y-5 rounded-lg border border-border bg-card p-6 text-card-foreground"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold" id="account-actions-title">
          Account actions
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Manage security and account lifecycle from one place.
        </p>
      </div>

      <div className="grid gap-4">
        {canChangePassword ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Password reset</h3>
              <p className="text-sm text-muted-foreground">
                Send a secure reset link to <span className="font-medium text-foreground">{accountEmail ?? "your account email"}</span>.
              </p>
            </div>

            {resetMessage ? (
              <p
                className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
                role="status"
              >
                {resetMessage}
              </p>
            ) : null}

            {resetError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {resetError}
              </p>
            ) : null}

            <Button
              className="h-11 w-full justify-start gap-2 sm:w-auto"
              disabled={isSendingReset}
              onClick={() => void handleSendResetLink()}
              type="button"
              variant="outline"
            >
              {isSendingReset ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Send reset link
            </Button>
          </div>
        ) : null}

        <details className="group rounded-lg border border-destructive/30 bg-destructive/5 p-4">
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
