"use client";

import { GitBranch, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

import { AuthToast } from "@/components/auth/AuthToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateSignInForm } from "@/lib/auth/forms";

interface SignInFormProps {
  callbackUrl: string;
  initialError?: string;
  initialMessage?: string;
}

interface SignInFormErrorState {
  email?: string;
  password?: string;
}

export function SignInForm({
  callbackUrl,
  initialError,
  initialMessage,
}: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignInFormErrorState>({});
  const [formError, setFormError] = useState(initialError ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const validation = validateSignInForm({ email, password });

    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const response = await signIn("credentials", {
      email: validation.data.email,
      password: validation.data.password,
      redirect: false,
      redirectTo: callbackUrl,
    });

    setIsSubmitting(false);

    if (response?.ok && response.url) {
      router.push(response.url);
      router.refresh();
      return;
    }

    setFormError("Invalid email or password.");
  }

  return (
    <div className="space-y-5">
      <AuthToast message={initialMessage} />
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

        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <Input
            aria-invalid={Boolean(errors.password)}
            autoComplete="current-password"
            className="h-11"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            value={password}
          />
          {errors.password ? (
            <span className="text-sm text-destructive">{errors.password}</span>
          ) : null}
        </label>

        <Button className="h-11 w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Sign in
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
        Sign in with GitHub
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to DevStash?{" "}
        <Link
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
