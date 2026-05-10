import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ChaosField } from "./ChaosField";
import {
  aiChecklist,
  dashboardNavItems,
  dashboardPreviewItems,
  featureCards,
} from "./content";
import { HomepageNav } from "./HomepageNav";
import { PricingSection } from "./PricingSection";
import { Reveal } from "./Reveal";

export function Homepage() {
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_-10%,rgba(59,130,246,0.22),transparent_36%),radial-gradient(circle_at_95%_0%,rgba(236,72,153,0.2),transparent_38%),linear-gradient(180deg,#0b121b_0%,#0a1018_38%,#0c121b_100%)]" />
      <HomepageNav />

      <main>
        <section className="pb-20 pt-32 sm:pt-36">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-blue-300">Developer Knowledge Hub</p>
              <h1 className="max-w-5xl text-4xl font-bold leading-tight text-slate-50 sm:text-6xl">
                Stop Losing Your
                <span className="bg-linear-to-r from-blue-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
                  {" "}
                  Developer Knowledge
                </span>
              </h1>
              <p className="mt-5 max-w-3xl text-lg text-slate-300">
                Your snippets, commands, prompts, docs, and links are scattered across tools. DevStash gives
                you one place to capture, organize, and instantly find everything.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className={cn(buttonVariants({ variant: "default", size: "lg" }))} href="/register">
                  Start Free
                </Link>
                <a className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href="#features">
                  See Features
                </a>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-500/25 bg-slate-900/60 px-4 py-3">
                  <p className="text-lg font-semibold text-slate-100">10k+</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Items Organized</p>
                </div>
                <div className="rounded-lg border border-slate-500/25 bg-slate-900/60 px-4 py-3">
                  <p className="text-lg font-semibold text-slate-100">400+</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Teams & Solo Devs</p>
                </div>
                <div className="rounded-lg border border-slate-500/25 bg-slate-900/60 px-4 py-3">
                  <p className="text-lg font-semibold text-slate-100">4.9/5</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Average Rating</p>
                </div>
              </div>
            </Reveal>

            <Reveal className="mt-10 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
              <section className="rounded-2xl border border-slate-500/25 bg-slate-900/85 p-4 shadow-2xl shadow-black/30">
                <h2 className="mb-3 text-sm font-medium text-slate-200">Your knowledge today...</h2>
                <ChaosField />
              </section>

              <div className="grid place-items-center text-blue-300 lg:px-2">
                <svg
                  aria-hidden="true"
                  className="h-auto w-20 animate-pulse max-lg:rotate-90"
                  fill="none"
                  viewBox="0 0 140 60"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 30H125" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
                  <path
                    d="M95 10L125 30L95 50"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                  />
                </svg>
              </div>

              <section className="rounded-2xl border border-slate-500/25 bg-slate-900/85 p-4 shadow-2xl shadow-black/30">
                <h2 className="mb-3 text-sm font-medium text-slate-200">...with DevStash</h2>
                <div className="grid min-h-75 grid-cols-[112px_1fr] overflow-hidden rounded-xl border border-slate-500/30 bg-slate-950/80">
                  <aside className="space-y-2 border-r border-slate-500/25 bg-slate-900/80 p-3">
                    {dashboardNavItems.map((navItem) => (
                      <span
                        className="block rounded-md bg-slate-800/80 px-2 py-1 text-xs text-slate-300"
                        key={navItem}
                      >
                        {navItem}
                      </span>
                    ))}
                  </aside>
                  <div className="grid grid-rows-[38px_1fr]">
                    <div className="border-b border-slate-500/25 bg-slate-900/60" />
                    <div className="grid grid-cols-2 gap-2 p-3">
                      {dashboardPreviewItems.map((card) => (
                        <article
                          className="rounded-lg border border-slate-500/25 bg-slate-800/80 p-2"
                          key={card.title}
                          style={{ borderTopColor: card.accent, borderTopWidth: "4px" }}
                        >
                          <h3 className="text-xs font-medium text-slate-200">{card.title}</h3>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </Reveal>
          </div>
        </section>

        <section className="py-20" id="features">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-blue-300">Core Features</p>
              <h2 className="max-w-4xl text-3xl font-semibold text-slate-100 sm:text-4xl">
                Everything You Need to Build a Reliable Knowledge System
              </h2>
            </Reveal>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((card) => (
                <Reveal
                  className="rounded-2xl border border-slate-500/25 bg-slate-900/70 p-5"
                  key={card.title}
                >
                  <article style={{ borderTop: `4px solid ${card.accent}` }}>
                    <h3 className="mb-2 text-xl font-semibold text-slate-100">{card.title}</h3>
                    <p className="text-sm text-slate-300">{card.description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20" id="ai">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <Reveal className="rounded-2xl border border-slate-500/25 bg-slate-900/75 p-6">
              <Badge className="bg-amber-500 text-amber-50">Pro Feature</Badge>
              <h2 className="mt-4 text-3xl font-semibold text-slate-100">Let AI Structure Your Messy Notes</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {aiChecklist.map((item) => (
                  <li className="flex items-start gap-2" key={item}>
                    <span className="mt-[0.42rem] size-1.5 shrink-0 rounded-full bg-cyan-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="rounded-2xl border border-slate-500/25 bg-slate-900/75 p-6">
              <div className="mb-4 flex items-center gap-2 text-slate-400">
                <span className="size-2 rounded-full bg-slate-500" />
                <span className="size-2 rounded-full bg-slate-500" />
                <span className="size-2 rounded-full bg-slate-500" />
                <p className="ml-auto font-mono text-xs">snippet.ts</p>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-slate-500/25 bg-slate-950/90 p-4 font-mono text-xs text-slate-200">
                <code>{`export function fetchProfile(id: string) {
  return api.get(\`/profile/\${id}\`);
}

const recommendation = await ai.suggestTags(content);`}</code>
              </pre>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-100">AI Generated Tags</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    "#typescript",
                    "#api",
                    "#profile",
                    "#helper",
                  ].map((tag) => (
                    <span
                      className="rounded-full border border-slate-500/35 px-3 py-1 font-mono text-xs text-slate-300"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <PricingSection />

        <section className="py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="rounded-3xl border border-slate-500/30 bg-[radial-gradient(circle_at_10%_10%,rgba(99,102,241,0.26),transparent_40%),radial-gradient(circle_at_90%_90%,rgba(6,182,212,0.24),transparent_45%),rgba(21,32,47,0.86)] px-6 py-12 text-center sm:px-10">
              <h2 className="text-3xl font-semibold text-slate-100 sm:text-4xl">Ready to Organize Your Knowledge?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-300">
                Start with the free plan and upgrade whenever your workflow grows.
              </p>
              <Link className={cn(buttonVariants({ variant: "default", size: "lg" }), "mt-6")} href="/register">
                Get Started
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-500/25 bg-slate-950/80 pb-6 pt-12">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-[2fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <Link className="inline-flex items-center gap-2 font-semibold" href="/">
              <span className="grid size-8 place-items-center rounded-md bg-linear-to-br from-slate-700 to-blue-500 font-mono text-xs text-slate-50">
                DS
              </span>
              <span>DevStash</span>
            </Link>
            <p className="mt-3 text-sm text-slate-400">Developer knowledge hub for modern teams.</p>
          </div>

          <FooterLinks
            links={[
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
              { href: "/register", label: "Get Started" },
            ]}
            title="Product"
          />
          <FooterLinks
            links={[
              { href: "/sign-in", label: "Sign In" },
              { href: "/register", label: "Register" },
              { href: "/dashboard", label: "Dashboard" },
            ]}
            title="App"
          />
          <FooterLinks
            links={[
              { href: "/favorites", label: "Favorites" },
              { href: "/collections", label: "Collections" },
              { href: "/settings", label: "Settings" },
            ]}
            title="Explore"
          />
        </div>

        <div className="mx-auto mt-7 w-full max-w-7xl border-t border-slate-500/20 px-4 pt-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          &copy; {year} DevStash. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

interface FooterLinksProps {
  links: Array<{ href: string; label: string }>;
  title: string;
}

function FooterLinks({ links, title }: FooterLinksProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <div className="mt-2 flex flex-col gap-2 text-sm text-slate-400">
        {links.map((link) =>
          link.href.startsWith("#") ? (
            <a className="hover:text-slate-200" href={link.href} key={link.label}>
              {link.label}
            </a>
          ) : (
            <Link className="hover:text-slate-200" href={link.href} key={link.label}>
              {link.label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
