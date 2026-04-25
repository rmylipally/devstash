import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="grid min-h-dvh grid-cols-[280px_1fr]">
        <aside className="border-r border-border bg-sidebar px-6 py-8">
          <h2 className="text-xl font-semibold tracking-tight">Sidebar</h2>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex h-20 items-center justify-between gap-4 border-b border-border px-8">
            <div className="relative w-full max-w-2xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search items"
                className="h-11 rounded-lg bg-muted/40 pl-10 text-base"
                placeholder="Search items..."
                readOnly
                type="search"
              />
            </div>

            <Button className="h-11 gap-2 px-4" type="button">
              <Plus className="size-5" />
              New Item
            </Button>
          </header>

          <div className="flex flex-1 items-start px-8 py-10">
            <h2 className="text-3xl font-semibold tracking-tight">Main</h2>
          </div>
        </section>
      </div>
    </main>
  );
}
