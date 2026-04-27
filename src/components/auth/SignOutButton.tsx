"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      onClick={() => void signOut({ redirectTo: "/sign-in" })}
      type="button"
    >
      <LogOut className="size-4" />
      Sign out
    </button>
  );
}
