import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | DevStash",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      eyebrow="Reset password"
      subtitle="Enter your account email and we will send a secure link if the account exists."
      title="Forgot your password?"
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
