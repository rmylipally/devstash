"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  getItemDetail,
  updateItem as updateItemRecord,
  type ItemDetail,
  type ItemCreateInput,
  type ItemUpdateInput,
} from "@/lib/db/items";

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
      new URL(value);

      return true;
    } catch {
      return false;
    }
  },
  { message: "Enter a valid URL." },
);

const createItemInputSchema = z
  .object({
    content: optionalNullableStringSchema,
    description: optionalNullableStringSchema,
    kind: z.enum(["snippet", "prompt", "command", "note", "link"]),
    language: optionalNullableStringSchema,
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
  });

const updateItemInputSchema = z.object({
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

  try {
    const updatedItem = await updateItemRecord({
      data: parsedData.data satisfies ItemUpdateInput,
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
