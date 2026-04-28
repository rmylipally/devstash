"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  getItemDetail,
  updateItem as updateItemRecord,
  type ItemDetail,
  type ItemUpdateInput,
} from "@/lib/db/items";

type UpdateItemActionResult =
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
      new URL(value);

      return true;
    } catch {
      return false;
    }
  },
  { message: "Enter a valid URL." },
);

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
