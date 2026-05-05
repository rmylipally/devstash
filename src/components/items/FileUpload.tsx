"use client";

import { File, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  type UploadItemKind,
  type UploadedFileMetadata,
  validateUploadMetadata,
} from "@/lib/storage/uploads";
import { cn } from "@/lib/utils";

type UploadResponse =
  | {
      data: UploadedFileMetadata;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

interface FileUploadProps {
  disabled?: boolean;
  kind: UploadItemKind;
  onChange(value: UploadedFileMetadata | null): void;
  value: UploadedFileMetadata | null;
}

export function FileUpload({
  disabled = false,
  kind,
  onChange,
  value,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const Icon = kind === "image" ? ImageIcon : File;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function clearUpload() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setProgress(0);
    setError(null);
    onChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!disabled && !isUploading) {
      setDragActive(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    const [file] = Array.from(event.dataTransfer.files);

    if (file) {
      void uploadFile(file);
    }
  }

  async function uploadFile(file: File) {
    const validation = validateUploadMetadata({
      fileName: file.name,
      kind,
      mimeType: file.type,
      size: file.size,
    });

    if (!validation.success) {
      setError(validation.error);
      onChange(null);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setError(null);
    setProgress(0);
    setIsUploading(true);
    setPreviewUrl(kind === "image" ? URL.createObjectURL(file) : null);

    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    try {
      const response = await uploadWithProgress(formData, setProgress);

      if (!response.success) {
        setError(response.error);
        onChange(null);
        return;
      }

      onChange(response.data);
    } catch {
      setError("Could not upload file. Try again.");
      onChange(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        accept={kind === "image" ? ".png,.jpg,.jpeg,.gif,.webp,.svg" : ".pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini"}
        className="sr-only"
        disabled={disabled || isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadFile(file);
          }
        }}
        ref={inputRef}
        type="file"
      />

      <div
        className={cn(
          "rounded-lg border border-dashed border-border bg-card p-4 transition-colors",
          dragActive && "border-primary/70 bg-primary/5",
          (disabled || isUploading) && "opacity-70",
        )}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {isUploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">
              {value ? value.originalFileName : `Upload ${kind}`}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag a {kind} here or choose one from your computer.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {value ? (
              <Button
                aria-label="Remove uploaded file"
                disabled={disabled || isUploading}
                onClick={clearUpload}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            ) : null}
            <Button
              className="gap-2"
              disabled={disabled || isUploading}
              onClick={openFilePicker}
              type="button"
              variant="outline"
            >
              <Icon className="size-4" />
              Choose
            </Button>
          </div>
        </div>

        {isUploading ? (
          <progress
            aria-label="Upload progress"
            className="mt-4 h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary"
            max={100}
            value={progress}
          />
        ) : null}

        {previewUrl ? (
          <NextImage
            alt=""
            className="mt-4 max-h-60 w-full rounded-lg border border-border object-contain"
            height={480}
            src={previewUrl}
            unoptimized
            width={960}
          />
        ) : value ? (
          <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
            {formatFileSize(value.fileSizeBytes)} · {value.mimeType}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function uploadWithProgress(
  formData: FormData,
  onProgress: (progress: number) => void,
) {
  return new Promise<UploadResponse>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error("Upload failed."));
    request.onload = () => {
      try {
        resolve(JSON.parse(request.responseText) as UploadResponse);
      } catch {
        reject(new Error("Invalid upload response."));
      }
    };
    request.open("POST", "/api/uploads");
    request.send(formData);
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 102.4) / 10} KB`;
  }

  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
}
