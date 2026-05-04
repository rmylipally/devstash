"use client";

import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarkdownEditorTab = "preview" | "write";

interface MarkdownEditorProps {
  ariaLabel: string;
  className?: string;
  maxEditorRows?: number;
  minEditorRows?: number;
  onChange?(value: string): void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
}

export function MarkdownEditor({
  ariaLabel,
  className,
  maxEditorRows = 16,
  minEditorRows = 8,
  onChange,
  placeholder,
  readOnly = false,
  value,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<MarkdownEditorTab>(
    readOnly ? "preview" : "write",
  );
  const [hasCopied, setHasCopied] = useState(false);
  const visibleTab: MarkdownEditorTab = readOnly ? "preview" : activeTab;
  const editorRows = getEditorHeight(value, minEditorRows, maxEditorRows);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setHasCopied(false), 1500);

    return () => window.clearTimeout(timeoutId);
  }, [hasCopied]);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setHasCopied(true);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#1e1e1e] shadow-sm",
        className,
      )}
    >
      <div className="flex min-h-11 items-center gap-3 border-b border-white/10 bg-[#2d2d2d] px-3 py-2">
        <div className="flex min-w-0 items-center gap-1">
          {readOnly ? (
            <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-slate-100">
              Preview
            </span>
          ) : (
            <>
              <MarkdownTabButton
                active={visibleTab === "write"}
                label="Write"
                onClick={() => setActiveTab("write")}
              />
              <MarkdownTabButton
                active={visibleTab === "preview"}
                label="Preview"
                onClick={() => setActiveTab("preview")}
              />
            </>
          )}
        </div>
        <Button
          aria-label="Copy markdown content"
          className="ml-auto h-7 gap-1.5 px-2 text-xs text-slate-200 hover:bg-white/10 hover:text-white"
          onClick={handleCopy}
          size="sm"
          type="button"
          variant="ghost"
        >
          {hasCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {hasCopied ? "Copied" : "Copy"}
        </Button>
      </div>
      {visibleTab === "write" ? (
        <textarea
          aria-label={ariaLabel}
          className="min-h-44 max-h-[400px] w-full resize-y overflow-auto bg-[#1e1e1e] px-4 py-3 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          rows={editorRows}
          value={value}
        />
      ) : (
        <MarkdownPreview
          ariaLabel={ariaLabel}
          placeholder={placeholder}
          value={value}
        />
      )}
    </div>
  );
}

interface MarkdownTabButtonProps {
  active: boolean;
  label: string;
  onClick(): void;
}

function MarkdownTabButton({ active, label, onClick }: MarkdownTabButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white",
        active && "bg-white/10 text-white",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

interface MarkdownPreviewProps {
  ariaLabel: string;
  placeholder?: string;
  value: string;
}

function MarkdownPreview({ ariaLabel, placeholder, value }: MarkdownPreviewProps) {
  const previewValue = value.trim();

  return (
    <div
      aria-label={ariaLabel}
      className="markdown-preview min-h-44 max-h-[400px] overflow-auto bg-[#1e1e1e] px-4 py-3 text-sm leading-6"
    >
      {previewValue ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
      ) : (
        <p className="text-slate-500">{placeholder ?? "Nothing to preview."}</p>
      )}
    </div>
  );
}

function getEditorHeight(
  value: string,
  minEditorRows: number,
  maxEditorRows: number,
) {
  const lineCount = Math.max(value.split(/\r\n|\r|\n/).length, minEditorRows);

  return Math.min(maxEditorRows, lineCount);
}
