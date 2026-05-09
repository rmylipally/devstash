"use client";

import { Folder } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomepageNav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition",
        isScrolled
          ? "border-slate-500/30 bg-slate-950/90 backdrop-blur"
          : "border-transparent bg-slate-950/40 backdrop-blur",
      )}
    >
      <div className="mx-auto flex min-h-[70px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link className="inline-flex items-center gap-2 font-semibold" href="/">
          <span className="grid size-8 place-items-center rounded-md bg-linear-to-br from-slate-700 to-blue-500 text-slate-50">
            <Folder className="size-4" />
          </span>
          <span>DevStash</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <a className="hover:text-slate-100" href="/#features">
            Features
          </a>
          <a className="hover:text-slate-100" href="/#pricing">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")} href="/sign-in">
            Sign In
          </Link>
          <Link className={buttonVariants({ variant: "default", size: "sm" })} href="/register">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
