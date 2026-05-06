export type UploadItemKind = "file" | "image";

export interface UploadedFileMetadata {
  fileSizeBytes: number;
  mimeType: string;
  originalFileName: string;
  storageKey: string;
}

interface ValidateUploadMetadataOptions {
  fileName: string;
  kind: UploadItemKind;
  mimeType: string;
  size: number;
}

interface CreateStorageKeyOptions {
  fileName: string;
  kind: UploadItemKind;
  userId: string;
  uuid?: string;
}

interface ValidateStorageKeyOptions {
  kind: UploadItemKind;
  storageKey: string;
  userId: string;
}

type UploadValidationResult =
  | {
      success: true;
    }
  | {
      error: string;
      success: false;
    };

const MB_IN_BYTES = 1024 * 1024;
const STORAGE_KEY_PREFIX = "devstash/api/uploads";

const uploadConstraints: Record<
  UploadItemKind,
  {
    extensions: Set<string>;
    label: string;
    maxSizeBytes: number;
    mimeTypes: Set<string>;
  }
> = {
  file: {
    extensions: new Set([
      ".csv",
      ".ini",
      ".json",
      ".md",
      ".pdf",
      ".toml",
      ".txt",
      ".xml",
      ".yaml",
      ".yml",
    ]),
    label: "Files",
    maxSizeBytes: 10 * MB_IN_BYTES,
    mimeTypes: new Set([
      "application/json",
      "application/pdf",
      "application/toml",
      "application/x-yaml",
      "application/xml",
      "text/csv",
      "text/markdown",
      "text/plain",
      "text/xml",
      "text/yaml",
    ]),
  },
  image: {
    extensions: new Set([".gif", ".jpeg", ".jpg", ".png", ".webp"]),
    label: "Images",
    maxSizeBytes: 5 * MB_IN_BYTES,
    mimeTypes: new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]),
  },
};

export function isUploadItemKind(value: unknown): value is UploadItemKind {
  return value === "file" || value === "image";
}

export function validateUploadMetadata(
  options: ValidateUploadMetadataOptions,
): UploadValidationResult {
  const constraints = uploadConstraints[options.kind];
  const extension = getFileExtension(options.fileName);
  const mimeType = options.mimeType.trim().toLowerCase();

  if (!Number.isInteger(options.size) || options.size <= 0) {
    return {
      success: false,
      error: "Upload a non-empty file.",
    };
  }

  if (options.size > constraints.maxSizeBytes) {
    return {
      success: false,
      error: `${constraints.label} must be ${formatBytes(
        constraints.maxSizeBytes,
      )} or smaller.`,
    };
  }

  if (!constraints.extensions.has(extension)) {
    return {
      success: false,
      error: `Unsupported ${options.kind} extension.`,
    };
  }

  if (!constraints.mimeTypes.has(mimeType)) {
    return {
      success: false,
      error: `Unsupported ${options.kind} MIME type.`,
    };
  }

  return { success: true };
}

export function createStorageKey({
  fileName,
  kind,
  userId,
  uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
}: CreateStorageKeyOptions) {
  const safeUserId = sanitizePathSegment(userId);
  const safeFileName = sanitizeFileName(fileName);

  return `${STORAGE_KEY_PREFIX}/${safeUserId}/${kind}/${uuid}-${safeFileName}`;
}

export function isStorageKeyForUpload({
  kind,
  storageKey,
  userId,
}: ValidateStorageKeyOptions) {
  const safeUserId = sanitizePathSegment(userId);
  const expectedPrefix = `${STORAGE_KEY_PREFIX}/${safeUserId}/${kind}/`;
  const objectName = storageKey.slice(expectedPrefix.length);

  return (
    storageKey.startsWith(expectedPrefix) &&
    objectName.length > 0 &&
    !objectName.includes("/") &&
    !objectName.includes("\\")
  );
}

function getFileExtension(fileName: string) {
  const baseName = getBaseFileName(fileName);
  const extensionStart = baseName.lastIndexOf(".");

  if (extensionStart < 0) {
    return "";
  }

  return baseName.slice(extensionStart).toLowerCase();
}

function sanitizeFileName(fileName: string) {
  const baseName = getBaseFileName(fileName);
  const extension = getFileExtension(baseName);
  const nameWithoutExtension = extension
    ? baseName.slice(0, -extension.length)
    : baseName;
  const safeName = sanitizePathSegment(nameWithoutExtension) || "upload";

  return `${safeName}${extension}`;
}

function getBaseFileName(fileName: string) {
  return fileName.split(/[\\/]/).filter(Boolean).pop() ?? "upload";
}

function sanitizePathSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "upload"
  );
}

function formatBytes(bytes: number) {
  return `${bytes / MB_IN_BYTES} MB`;
}
