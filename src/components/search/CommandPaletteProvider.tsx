"use client";

import { useEffect } from "react";
import { CommandPalette } from "@/components/search/CommandPalette";
import {
  CommandPaletteContextProvider,
  useCommandPalette,
} from "@/components/search/CommandPaletteContext";

function CommandPaletteProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, togglePalette, closePalette } = useCommandPalette();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        togglePalette();
      }

      // Close on Escape
      if (event.key === "Escape") {
        closePalette();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePalette, closePalette]);

  return (
    <>
      {children}
      <CommandPalette isOpen={isOpen} onOpenChange={closePalette} />
    </>
  );
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteContextProvider>
      <CommandPaletteProviderInner>{children}</CommandPaletteProviderInner>
    </CommandPaletteContextProvider>
  );
}
