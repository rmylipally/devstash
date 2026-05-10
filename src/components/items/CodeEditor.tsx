"use client";

import dynamic from "next/dynamic";
import { Check, Copy, Crown, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useMemo, useState } from "react";
import type { EditorProps } from "@monaco-editor/react";

import { Button } from "@/components/ui/button";
import { useEditorPreferences } from "@/components/profile/EditorPreferencesContext";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic<EditorProps>(
  () => import("@monaco-editor/react").then((module) => module.default),
  {
    loading: () => <EditorLoading />,
    ssr: false,
  },
);

const languageAliases: Record<string, string> = {
  bash: "shell",
  js: "javascript",
  jsx: "javascript",
  md: "markdown",
  py: "python",
  sh: "shell",
  shellscript: "shell",
  ts: "typescript",
  tsx: "typescript",
  yml: "yaml",
  zsh: "shell",
};

interface CodeEditorProps {
  ariaLabel: string;
  className?: string;
  explanation?: string;
  isExplainable?: boolean;
  isGeneratingExplanation?: boolean;
  isProUser?: boolean;
  language: string;
  maxEditorHeight?: number;
  minEditorHeight?: number;
  onChange?(value: string): void;
  onExplain?(): void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
}

type CodeEditorView = "code" | "explain";

export function CodeEditor({
  ariaLabel,
  className,
  explanation,
  isExplainable = false,
  isGeneratingExplanation = false,
  isProUser = true,
  language,
  maxEditorHeight = 400,
  minEditorHeight = 180,
  onChange,
  onExplain,
  placeholder,
  readOnly = false,
  value,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const [activeView, setActiveView] = useState<CodeEditorView>("code");
  const [hasCopied, setHasCopied] = useState(false);
  const editorHeight = getEditorHeight(value, minEditorHeight, maxEditorHeight);
  const languageLabel = getLanguageLabel(language);
  const monacoLanguage = getMonacoLanguage(languageLabel);
  const hasExplanation = Boolean(explanation?.trim());
  const showExplainControls = readOnly && isExplainable;

  // Provide defaults while preferences load
  const fontSize = preferences?.fontSize ?? 13;
  const tabSize = preferences?.tabSize ?? 2;
  const wordWrap = preferences?.wordWrap ?? true;
  const minimap = preferences?.minimap ?? false;
  const theme = preferences?.theme ?? "vs-dark";

  const options = useMemo<EditorProps["options"]>(
    () => ({
      ariaLabel,
      automaticLayout: true,
      contextmenu: true,
      cursorBlinking: "smooth",
      folding: false,
      fontFamily: "var(--font-mono)",
      fontLigatures: true,
      fontSize,
      glyphMargin: false,
      hideCursorInOverviewRuler: true,
      lineDecorationsWidth: 12,
      lineNumbers: "on",
      minimap: { enabled: minimap },
      overviewRulerLanes: 0,
      padding: { bottom: 14, top: 14 },
      readOnly,
      renderLineHighlight: "line",
      renderValidationDecorations: "off",
      scrollBeyondLastLine: false,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        horizontalScrollbarSize: 10,
        useShadows: false,
        verticalScrollbarSize: 10,
      },
      tabSize,
      wordWrap: wordWrap ? "on" : "off",
    }),
    [ariaLabel, fontSize, minimap, readOnly, tabSize, wordWrap],
  );

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setHasCopied(false), 1500);

    return () => window.clearTimeout(timeoutId);
  }, [hasCopied]);

  useEffect(() => {
    if (activeView === "explain" && !hasExplanation && !isGeneratingExplanation) {
      setActiveView("code");
    }
  }, [activeView, hasExplanation, isGeneratingExplanation]);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setHasCopied(true);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-slate-950 shadow-sm",
        className,
      )}
    >
      <div className="flex min-h-11 items-center gap-3 border-b border-white/10 bg-slate-900 px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-3 rounded-full bg-red-500" />
          <span className="size-3 rounded-full bg-yellow-500" />
          <span className="size-3 rounded-full bg-green-500" />
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {showExplainControls ? (
            <div className="flex items-center gap-1">
              <EditorTabButton
                active={activeView === "code"}
                label="Code"
                onClick={() => setActiveView("code")}
              />
              <EditorTabButton
                active={activeView === "explain"}
                disabled={!hasExplanation}
                label="Explain"
                onClick={() => setActiveView("explain")}
              />
            </div>
          ) : null}
          <span className="truncate rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-slate-300">
            {languageLabel}
          </span>
          {showExplainControls ? (
            <Button
              aria-label={isProUser ? "Explain code" : "AI features require Pro subscription"}
              className="h-7 gap-1.5 px-2 text-xs text-slate-200 hover:bg-white/10 hover:text-white"
              disabled={!isProUser || isGeneratingExplanation}
              onClick={onExplain}
              size="sm"
              title={isProUser ? "Explain code" : "AI features require Pro subscription"}
              type="button"
              variant="ghost"
            >
              {!isProUser ? (
                <Crown className="size-3.5" />
              ) : isGeneratingExplanation ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Explain
            </Button>
          ) : null}
          <Button
            aria-label="Copy editor content"
            className="h-7 gap-1.5 px-2 text-xs text-slate-200 hover:bg-white/10 hover:text-white"
            onClick={handleCopy}
            size="sm"
            type="button"
            variant="ghost"
          >
            {hasCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {hasCopied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      {showExplainControls && activeView === "explain" ? (
        <div
          aria-label={`${ariaLabel} explanation`}
          className="markdown-preview min-h-45 max-h-100 overflow-auto bg-[#0f172a] px-4 py-3 text-sm leading-6 text-slate-100"
        >
          {hasExplanation ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation ?? ""}</ReactMarkdown>
          ) : (
            <p className="text-slate-500">No explanation generated yet.</p>
          )}
        </div>
      ) : (
        <div className="relative bg-[#0f172a]">
          {!value && placeholder ? (
            <p className="pointer-events-none absolute left-[4.25rem] top-3 z-10 font-mono text-sm text-slate-500">
              {placeholder}
            </p>
          ) : null}
          <MonacoEditor
            height={editorHeight}
            language={monacoLanguage}
            onChange={(nextValue) => onChange?.(nextValue ?? "")}
            options={options}
            theme={theme}
            value={value}
          />
        </div>
      )}
    </div>
  );
}

interface EditorTabButtonProps {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClick(): void;
}

function EditorTabButton({ active, disabled = false, label, onClick }: EditorTabButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium text-slate-300 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-white/10 hover:text-white",
        active && "bg-white/10 text-white",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function EditorLoading() {
  return (
    <div className="flex h-48 items-center justify-center bg-slate-950 font-mono text-sm text-slate-500">
      Loading editor
    </div>
  );
}

function getEditorHeight(
  value: string,
  minEditorHeight: number,
  maxEditorHeight: number,
) {
  const lineCount = Math.max(value.split(/\r\n|\r|\n/).length, 5);
  const fluidHeight = lineCount * 22 + 48;

  return Math.min(maxEditorHeight, Math.max(minEditorHeight, fluidHeight));
}

function getLanguageLabel(language: string) {
  const trimmedLanguage = language.trim();

  return trimmedLanguage || "plaintext";
}

function getMonacoLanguage(language: string) {
  const normalizedLanguage = language.toLowerCase();

  return languageAliases[normalizedLanguage] ?? normalizedLanguage;
}
