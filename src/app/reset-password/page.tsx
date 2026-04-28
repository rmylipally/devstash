import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | DevStash",
};

interface ResetPasswordPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <AuthPageShell
      eyebrow="New password"
      subtitle="Choose a new password for your DevStash account."
      title="Reset your password"
    >
      <ResetPasswordForm
        email={getSearchParam(params, "email") ?? ""}
        token={getSearchParam(params, "token") ?? ""}
      />
    </AuthPageShell>
  );
}
