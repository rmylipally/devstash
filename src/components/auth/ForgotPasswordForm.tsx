"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateForgotPasswordForm } from "@/lib/auth/forms";

interface ForgotPasswordApiResponse {
  data?: {
    message?: string;
  };
  error?: string;
  success: boolean;
}

interface ForgotPasswordFormErrorState {
  email?: string;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ForgotPasswordFormErrorState>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const validation = validateForgotPasswordForm({ email });

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const response = await fetch("/api/auth/forgot-password", {
      body: JSON.stringify(validation.data),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as ForgotPasswordApiResponse;

    setIsSubmitting(false);

    if (response.ok && result.success) {
      setSuccessMessage(
        result.data?.message ??
          "If an account exists for that email, we sent password reset instructions.",
      );
      return;
    }

    setFormError(result.error ?? "Could not send password reset instructions.");
  }

  return (
    <div className="space-y-5">
      {successMessage ? (
        <p
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      {formError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <Input
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className="h-11"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          {errors.email ? (
            <span className="text-sm text-destructive">{errors.email}</span>
          ) : null}
        </label>

        <Button className="h-11 w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
