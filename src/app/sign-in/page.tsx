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

interface VerificationPageMessage {
  initialError?: string;
  initialMessage?: string;
}

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function getVerificationMessage(
  params: Record<string, string | string[] | undefined>,
): VerificationPageMessage {
  const verification = getSearchParam(params, "verification");

  if (getSearchParam(params, "verified") === "1") {
    return {
      initialMessage: "Email verified. You can now log in.",
    };
  }

  if (verification === "sent") {
    return {
      initialMessage:
        "Account created. Check your email to verify your account before logging in.",
    };
  }

  if (
    verification === "skipped" ||
    getSearchParam(params, "registered") === "1"
  ) {
    return {
      initialMessage: "Account created. You can now log in.",
    };
  }

  if (verification === "expired") {
    return {
      initialError: "Verification link expired. Please register again.",
    };
  }

  if (verification === "invalid") {
    return {
      initialError: "Verification link is invalid. Check the link and try again.",
    };
  }

  return {};
}

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const callbackUrl = getSafeAuthRedirect(getSearchParam(params, "callbackUrl"));
  const verificationMessage = getVerificationMessage(params);
  const hasAuthError = Boolean(getSearchParam(params, "error"));

  return (
    <AuthPageShell
      eyebrow="Sign in"
      subtitle="Access your saved snippets, prompts, commands, notes, and links."
      title="Welcome back"
    >
      <SignInForm
        callbackUrl={callbackUrl}
        initialError={
          hasAuthError
            ? "Sign in failed. Try again."
            : verificationMessage.initialError
        }
        initialMessage={verificationMessage.initialMessage}
      />
    </AuthPageShell>
  );
}
