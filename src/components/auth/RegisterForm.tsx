"use client";

import { GitBranch, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateRegisterForm } from "@/lib/auth/forms";

interface RegisterFormProps {
  callbackUrl: string;
}

interface RegisterApiResponse {
  data?: {
    verificationRequired?: boolean;
  };
  error?: string;
  success: boolean;
}

interface RegisterFormErrorState {
  confirmPassword?: string;
  email?: string;
  name?: string;
  password?: string;
}

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterFormErrorState>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const validation = validateRegisterForm({
      confirmPassword,
      email,
      name,
      password,
    });

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      body: JSON.stringify(validation.data),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as RegisterApiResponse;

    setIsSubmitting(false);

    if (response.ok && result.success) {
      const verificationStatus =
        result.data?.verificationRequired === false ? "skipped" : "sent";

      router.push(
        `/sign-in?registered=1&verification=${verificationStatus}&callbackUrl=` +
          encodeURIComponent(callbackUrl),
      );
      return;
    }

    setFormError(result.error ?? "Could not create your account.");
  }

  return (
    <div className="space-y-5">
      {formError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Name</span>
          <Input
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            autoComplete="name"
            className="h-11"
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada Lovelace"
            type="text"
            value={name}
          />
          {errors.name ? (
            <span className="text-sm text-destructive" id="register-name-error">
              {errors.name}
            </span>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <Input
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            autoComplete="email"
            className="h-11"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          {errors.email ? (
            <span className="text-sm text-destructive" id="register-email-error">
              {errors.email}
            </span>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <Input
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "register-password-error" : undefined}
            autoComplete="new-password"
            className="h-11"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
          {errors.password ? (
            <span className="text-sm text-destructive" id="register-password-error">
              {errors.password}
            </span>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Confirm password</span>
          <Input
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
            autoComplete="new-password"
            className="h-11"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            type="password"
            value={confirmPassword}
          />
          {errors.confirmPassword ? (
            <span className="text-sm text-destructive" id="register-confirm-password-error">
              {errors.confirmPassword}
            </span>
          ) : null}
        </label>

        <Button className="h-11 w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        className="h-11 w-full gap-2"
        onClick={() => void signIn("github", { redirectTo: callbackUrl })}
        type="button"
        variant="outline"
      >
        <GitBranch className="size-4" />
        Continue with GitHub
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
