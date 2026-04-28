"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateResetPasswordForm } from "@/lib/auth/forms";

interface ResetPasswordFormProps {
  email: string;
  token: string;
}

interface ResetPasswordApiResponse {
  error?: string;
  success: boolean;
}

interface ResetPasswordFormErrorState {
  confirmPassword?: string;
  email?: string;
  password?: string;
  token?: string;
}

export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ResetPasswordFormErrorState>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const validation = validateResetPasswordForm({
      confirmPassword,
      email,
      password,
      token,
    });

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const response = await fetch("/api/auth/reset-password", {
      body: JSON.stringify(validation.data),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as ResetPasswordApiResponse;

    setIsSubmitting(false);

    if (response.ok && result.success) {
      router.push("/sign-in?passwordReset=1");
      return;
    }

    setFormError(result.error ?? "Could not reset your password.");
  }

  const linkError = errors.email ?? errors.token;

  return (
    <div className="space-y-5">
      {linkError || formError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {linkError ?? formError}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium">New password</span>
          <Input
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
            className="h-11"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
          {errors.password ? (
            <span className="text-sm text-destructive">{errors.password}</span>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Confirm password</span>
          <Input
            aria-invalid={Boolean(errors.confirmPassword)}
            autoComplete="new-password"
            className="h-11"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            type="password"
            value={confirmPassword}
          />
          {errors.confirmPassword ? (
            <span className="text-sm text-destructive">
              {errors.confirmPassword}
            </span>
          ) : null}
        </label>

        <Button className="h-11 w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Update password
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Need a new link?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href="/forgot-password"
        >
          Request another reset
        </Link>
      </p>
    </div>
  );
}
