import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/UserAvatar";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  const name = session.user.name ?? "DevStash User";
  const email = session.user.email ?? "No email";

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          className="inline-flex h-8 w-fit items-center gap-2 rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
          href="/dashboard"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <section className="rounded-lg border border-border bg-card p-6 text-card-foreground">
          <div className="flex items-center gap-4">
            <UserAvatar
              className="size-14 text-base"
              email={email}
              image={session.user.image}
              name={name}
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold">{name}</h1>
              <p className="mt-1 flex items-center gap-2 truncate text-sm text-muted-foreground">
                <Mail className="size-4" />
                {email}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
