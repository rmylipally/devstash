"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface CommandPaletteContextType {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(
  undefined,
);

export function useCommandPalette(): CommandPaletteContextType {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      "useCommandPalette must be used within CommandPaletteProvider",
    );
  }
  return context;
}

interface CommandPaletteProviderProps {
  children: ReactNode;
}

export function CommandPaletteContextProvider({
  children,
}: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openPalette = () => setIsOpen(true);
  const closePalette = () => setIsOpen(false);
  const togglePalette = () => setIsOpen((current) => !current);

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        openPalette,
        closePalette,
        togglePalette,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
}
