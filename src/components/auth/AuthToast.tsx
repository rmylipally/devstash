"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AuthToastProps {
  message?: string;
}

export function AuthToast({ message }: AuthToastProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const isVisible = Boolean(message) && !isDismissed;

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => setIsDismissed(true), 6000);

    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message || !isVisible) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed right-4 top-4 z-50 flex w-[min(calc(100vw-2rem),24rem)] items-start gap-3 rounded-lg border border-emerald-500/30 bg-popover p-4 text-popover-foreground shadow-xl"
      role="status"
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-300" />
      <p className="min-w-0 flex-1 text-sm leading-6">{message}</p>
      <button
        aria-label="Dismiss notification"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => setIsDismissed(true)}
        type="button"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
