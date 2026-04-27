import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { getSafeAuthRedirect } from "@/lib/auth/forms";

export const metadata: Metadata = {
  title: "Sign In | DevStash",
};

interface SignInPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const callbackUrl = getSafeAuthRedirect(getSearchParam(params, "callbackUrl"));
  const isRegistered = getSearchParam(params, "registered") === "1";
  const hasAuthError = Boolean(getSearchParam(params, "error"));

  return (
    <AuthPageShell
      eyebrow="Sign in"
      subtitle="Access your saved snippets, prompts, commands, notes, and links."
      title="Welcome back"
    >
      <SignInForm
        callbackUrl={callbackUrl}
        initialError={hasAuthError ? "Sign in failed. Try again." : undefined}
        initialMessage={
          isRegistered ? "Account created. You can now log in." : undefined
        }
      />
    </AuthPageShell>
  );
}
