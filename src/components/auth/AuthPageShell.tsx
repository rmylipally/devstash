import { Layers3 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthPageShellProps {
  children: ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}

export function AuthPageShell({
  children,
  eyebrow,
  subtitle,
  title,
}: AuthPageShellProps) {
  return (
    <main className="flex min-h-dvh bg-background text-foreground">
      <section className="flex min-h-dvh w-full flex-col justify-between px-5 py-5 sm:px-8 lg:w-[44%] lg:px-12">
        <Link className="flex w-fit items-center gap-3" href="/">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layers3 className="size-5" />
          </span>
          <span className="text-lg font-semibold">DevStash</span>
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div className="mb-8 space-y-2">
            <p className="text-sm font-medium uppercase text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          </div>

          {children}
        </div>

        <p className="text-xs text-muted-foreground">
          Store smarter. Build faster.
        </p>
      </section>

      <section
        aria-hidden="true"
        className="hidden min-h-dvh flex-1 border-l border-border bg-card lg:block"
      >
        <div className="flex h-full flex-col justify-between p-12">
          <div className="space-y-6">
            <div className="inline-flex rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              Snippets / Prompts / Commands / Notes
            </div>
            <div className="max-w-xl space-y-4">
              <h2 className="text-5xl font-semibold tracking-tight">
                Your reusable developer memory, one sign-in away.
              </h2>
              <p className="text-lg leading-8 text-muted-foreground">
                Keep code, commands, prompts, links, and notes close enough to
                reuse without digging.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {["React Patterns", "Prototype Prompts", "Git Commands"].map(
              (collection) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-border bg-background/70 px-4 py-3"
                  key={collection}
                >
                  <span className="text-sm font-medium">{collection}</span>
                  <span className="text-xs text-muted-foreground">Ready</span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
