import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSafeAuthRedirect } from "@/lib/auth/forms";

export const metadata: Metadata = {
  title: "Register | DevStash",
};

interface RegisterPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const callbackUrl = getSafeAuthRedirect(getSearchParam(params, "callbackUrl"));

  return (
    <AuthPageShell
      eyebrow="Create account"
      subtitle="Start collecting the reusable developer knowledge you reach for every day."
      title="Join DevStash"
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthPageShell>
  );
}
