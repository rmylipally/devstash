"use client";

import { Check, Settings } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditorPreferences } from "@/components/profile/EditorPreferencesContext";
import { type EditorPreferences } from "@/actions/editor-preferences";
import { cn } from "@/lib/utils";

type EditorPreferencesToast =
  | { message: string; variant: "error" | "success" }
  | null;

export function EditorPreferencesSettings() {
  const { preferences, updatePreferences, isLoading } = useEditorPreferences();
  const [localPreferences, setLocalPreferences] = useState<EditorPreferences | null>(null);
  const [toast, setToast] = useState<EditorPreferencesToast>(null);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const handleFontSizeChange = async (fontSize: number) => {
    setLocalPreferences((prev) => prev ? { ...prev, fontSize } : null);
    await updatePreferences({ fontSize });
    setToast({
      message: `Font size changed to ${fontSize}px`,
      variant: "success",
    });
  };

  const handleTabSizeChange = async (tabSize: number) => {
    setLocalPreferences((prev) => prev ? { ...prev, tabSize } : null);
    await updatePreferences({ tabSize });
    setToast({
      message: `Tab size changed to ${tabSize}`,
      variant: "success",
    });
  };

  const handleThemeChange = async (theme: EditorPreferences["theme"]) => {
    setLocalPreferences((prev) => prev ? { ...prev, theme } : null);
    await updatePreferences({ theme });
    setToast({
      message: `Theme changed to ${theme}`,
      variant: "success",
    });
  };

  const handleWordWrapToggle = async () => {
    const newWordWrap = !localPreferences?.wordWrap;
    setLocalPreferences((prev) => prev ? { ...prev, wordWrap: newWordWrap } : null);
    await updatePreferences({ wordWrap: newWordWrap });
    setToast({
      message: `Word wrap ${newWordWrap ? "enabled" : "disabled"}`,
      variant: "success",
    });
  };

  const handleMinimapToggle = async () => {
    const newMinimap = !localPreferences?.minimap;
    setLocalPreferences((prev) => prev ? { ...prev, minimap: newMinimap } : null);
    await updatePreferences({ minimap: newMinimap });
    setToast({
      message: `Minimap ${newMinimap ? "enabled" : "disabled"}`,
      variant: "success",
    });
  };

  if (isLoading || !localPreferences) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-card-foreground">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Settings className="size-5" />
          <p>Loading editor preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-5 text-card-foreground">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="size-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Editor Preferences</h2>
        </div>

        <div className="space-y-4">
          {/* Font Size */}
          <div className="flex items-center justify-between py-3">
            <label className="text-sm font-medium">Font Size</label>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                {localPreferences.fontSize}px
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                  >
                    <Check
                      className={`mr-2 size-4 ${
                        localPreferences.fontSize === size ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {size}px
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tab Size */}
          <div className="flex items-center justify-between py-3">
            <label className="text-sm font-medium">Tab Size</label>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                {localPreferences.tabSize}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => handleTabSizeChange(size)}
                  >
                    <Check
                      className={`mr-2 size-4 ${
                        localPreferences.tabSize === size ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between py-3">
            <label className="text-sm font-medium">Theme</label>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted capitalize">
                {localPreferences.theme}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {["vs-dark", "monokai", "github-dark"].map((theme) => (
                  <DropdownMenuItem
                    key={theme}
                    onClick={() => handleThemeChange(theme as EditorPreferences["theme"])}
                  >
                    <Check
                      className={`mr-2 size-4 ${
                        localPreferences.theme === theme ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <span className="capitalize">{theme}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenuSeparator />

          {/* Word Wrap Toggle */}
          <div className="flex items-center justify-between py-3">
            <label className="text-sm font-medium">Word Wrap</label>
            <Button
              variant={localPreferences.wordWrap ? "default" : "outline"}
              size="sm"
              onClick={handleWordWrapToggle}
            >
              {localPreferences.wordWrap ? "On" : "Off"}
            </Button>
          </div>

          {/* Minimap Toggle */}
          <div className="flex items-center justify-between py-3">
            <label className="text-sm font-medium">Minimap</label>
            <Button
              variant={localPreferences.minimap ? "default" : "outline"}
              size="sm"
              onClick={handleMinimapToggle}
            >
              {localPreferences.minimap ? "On" : "Off"}
            </Button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <EditorPreferencesToastMessage toast={toast} />
    </>
  );
}

function EditorPreferencesToastMessage({
  toast,
}: {
  toast: EditorPreferencesToast;
}) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[70] w-[min(24rem,calc(100vw-2.5rem))]">
      <div
        className={cn(
          "rounded-lg border bg-background px-4 py-3 text-sm shadow-xl",
          toast.variant === "success"
            ? "border-emerald-500/30 text-emerald-300"
            : "border-destructive/30 text-destructive",
        )}
        role={toast.variant === "success" ? "status" : "alert"}
      >
        {toast.message}
      </div>
    </div>
  );
}
