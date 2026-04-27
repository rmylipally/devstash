"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateRegisterForm } from "@/lib/auth/forms";

interface RegisterFormProps {
  callbackUrl: string;
}

interface RegisterApiResponse {
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
      router.push(
        "/sign-in?registered=1&callbackUrl=" + encodeURIComponent(callbackUrl),
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
            autoComplete="name"
            className="h-11"
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada Lovelace"
            type="text"
            value={name}
          />
          {errors.name ? (
            <span className="text-sm text-destructive">{errors.name}</span>
          ) : null}
        </label>

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
          Create account
        </Button>
      </form>

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
