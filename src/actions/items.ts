"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  getItemDetail,
  toggleItemFavorite as toggleItemFavoriteRecord,
  toggleItemPin as toggleItemPinRecord,
  updateItem as updateItemRecord,
  type ItemDetail,
  type ItemCreateInput,
  type ItemUpdateInput,
} from "@/lib/db/items";
import { deleteS3Object } from "@/lib/storage/s3";
import {
  isStorageKeyForUpload,
  isUploadItemKind,
  validateUploadMetadata,
} from "@/lib/storage/uploads";

type CreateItemActionResult =
  | {
      data: ItemDetail;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

type UpdateItemActionResult =
  | {
      data: ItemDetail;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

type DeleteItemActionResult =
  | {
      success: true;
    }
  | {
      error: string;
      success: false;
    };

type ToggleItemFavoriteActionResult =
  | {
      data: ItemDetail;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

type ToggleItemPinActionResult =
  | {
      data: ItemDetail;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

const optionalNullableStringSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value !== "string") {
      return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue ? trimmedValue : null;
  });

const optionalNullableUrlSchema = optionalNullableStringSchema.refine(
  (value) => {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);

      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "Enter a valid URL." },
);

const optionalCollectionIdsSchema = z
  .array(z.string().trim())
  .optional()
  .transform((collectionIds) => {
    if (!collectionIds) {
      return undefined;
    }

    return Array.from(new Set(collectionIds.filter(Boolean)));
  });

const createItemInputSchema = z
  .object({
    collectionIds: optionalCollectionIdsSchema,
    content: optionalNullableStringSchema,
    description: optionalNullableStringSchema,
    fileSizeBytes: z.number().int().positive().optional(),
    kind: z.enum(["snippet", "prompt", "command", "note", "file", "image", "link"]),
    language: optionalNullableStringSchema,
    mimeType: optionalNullableStringSchema,
    originalFileName: optionalNullableStringSchema,
    storageKey: optionalNullableStringSchema,
    tags: z
      .array(z.string().trim().min(1, "Tags cannot contain empty values."))
      .default([])
      .transform((tags) => Array.from(new Set(tags))),
    title: z.string().trim().min(1, "Title is required."),
    url: optionalNullableUrlSchema,
  })
  .superRefine((data, context) => {
    if (data.kind === "link" && !data.url) {
      context.addIssue({
        code: "custom",
        message: "URL is required for links.",
        path: ["url"],
      });
    }

    if (isUploadItemKind(data.kind)) {
      if (
        !data.storageKey ||
        !data.originalFileName ||
        !data.mimeType ||
        !data.fileSizeBytes
      ) {
        context.addIssue({
          code: "custom",
          message: "Upload a file before creating this item.",
          path: ["storageKey"],
        });
        return;
      }

      const validation = validateUploadMetadata({
        fileName: data.originalFileName,
        kind: data.kind,
        mimeType: data.mimeType,
        size: data.fileSizeBytes,
      });

      if (!validation.success) {
        context.addIssue({
          code: "custom",
          message: validation.error,
          path: ["storageKey"],
        });
      }
    }
  });

const updateItemInputSchema = z.object({
  collectionIds: optionalCollectionIdsSchema,
  content: optionalNullableStringSchema,
  description: optionalNullableStringSchema,
  language: optionalNullableStringSchema,
  tags: z
    .array(z.string().trim().min(1, "Tags cannot contain empty values."))
    .transform((tags) => Array.from(new Set(tags))),
  title: z.string().trim().min(1, "Title is required."),
  url: optionalNullableUrlSchema,
});

function getValidationError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}

function getItemCreatePayload(data: z.infer<typeof createItemInputSchema>) {
  const payload: ItemCreateInput = {
    kind: data.kind,
    tags: data.tags,
    title: data.title,
  };

  if (data.collectionIds !== undefined) {
    payload.collectionIds = data.collectionIds;
  }

  if (data.description !== undefined) {
    payload.description = data.description;
  }

  if (data.content !== undefined) {
    payload.content = data.content;
  }

  if (data.language !== undefined) {
    payload.language = data.language;
  }

  if (isUploadItemKind(data.kind)) {
    payload.fileSizeBytes = data.fileSizeBytes;
    payload.mimeType = data.mimeType;
    payload.originalFileName = data.originalFileName;
    payload.storageKey = data.storageKey;
  }

  if (data.url !== undefined) {
    payload.url = data.url;
  }

  return payload;
}

function getItemUpdatePayload(data: z.infer<typeof updateItemInputSchema>) {
  const payload: ItemUpdateInput = {
    tags: data.tags,
    title: data.title,
  };

  if (data.collectionIds !== undefined) {
    payload.collectionIds = data.collectionIds;
  }

  if (data.description !== undefined) {
    payload.description = data.description;
  }

  if (data.content !== undefined) {
    payload.content = data.content;
  }

  if (data.language !== undefined) {
    payload.language = data.language;
  }

  if (data.url !== undefined) {
    payload.url = data.url;
  }

  return payload;
}

function isUploadedFileMetadataOwnedByUser({
  kind,
  storageKey,
  userId,
}: {
  kind: "file" | "image";
  storageKey: string;
  userId: string;
}) {
  return isStorageKeyForUpload({
    kind,
    storageKey,
    userId,
  });
}

export async function createItem(
  data: unknown,
): Promise<CreateItemActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to create items.",
    };
  }

  const parsedData = createItemInputSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      error: getValidationError(parsedData.error),
    };
  }

  if (
    isUploadItemKind(parsedData.data.kind) &&
    !isUploadedFileMetadataOwnedByUser({
      kind: parsedData.data.kind,
      storageKey: parsedData.data.storageKey ?? "",
      userId,
    })
  ) {
    return {
      success: false,
      error: "Upload a file before creating this item.",
    };
  }

  try {
    const createdItem = await createItemRecord({
      data: getItemCreatePayload(parsedData.data),
      userId,
    });

    return {
      success: true,
      data: createdItem,
    };
  } catch {
    return {
      success: false,
      error: "Could not create item. Try again.",
    };
  }
}

export async function updateItem(
  itemId: string,
  data: unknown,
): Promise<UpdateItemActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update items.",
    };
  }

  const parsedData = updateItemInputSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      error: getValidationError(parsedData.error),
    };
  }

  const existingItem = await getItemDetail({ itemId, userId });

  if (!existingItem) {
    return {
      success: false,
      error: "Item not found.",
    };
  }

  if (existingItem.kind === "link" && !parsedData.data.url) {
    return {
      success: false,
      error: "URL is required for links.",
    };
  }

  try {
    const updatedItem = await updateItemRecord({
      data: getItemUpdatePayload(parsedData.data),
      itemId,
      userId,
    });

    return {
      success: true,
      data: updatedItem,
    };
  } catch {
    return {
      success: false,
      error: "Could not update item. Try again.",
    };
  }
}

export async function deleteItem(
  itemId: string,
): Promise<DeleteItemActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to delete items.",
    };
  }

  try {
    const existingItem = await getItemDetail({ itemId, userId });

    if (!existingItem) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    if (existingItem.contentKind === "file" && existingItem.storageKey) {
      await deleteS3Object(existingItem.storageKey);
    }

    const wasDeleted = await deleteItemRecord({ itemId, userId });

    if (!wasDeleted) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      error: "Could not delete item. Try again.",
    };
  }
}

export async function toggleItemFavorite(
  itemId: string,
): Promise<ToggleItemFavoriteActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update items.",
    };
  }

  try {
    const updatedItem = await toggleItemFavoriteRecord({
      itemId,
      userId,
    });

    if (!updatedItem) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    return {
      success: true,
      data: updatedItem,
    };
  } catch {
    return {
      success: false,
      error: "Could not update item. Try again.",
    };
  }
}

export async function toggleItemPin(
  itemId: string,
): Promise<ToggleItemPinActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update items.",
    };
  }

  try {
    const updatedItem = await toggleItemPinRecord({
      itemId,
      userId,
    });

    if (!updatedItem) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    return {
      success: true,
      data: updatedItem,
    };
  } catch {
    return {
      success: false,
      error: "Could not update item. Try again.",
    };
  }
}
