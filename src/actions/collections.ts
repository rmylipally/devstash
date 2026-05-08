"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  deleteCollection as deleteCollectionRecord,
  updateCollection as updateCollectionRecord,
} from "@/lib/db/collections";

type UpdateCollectionActionResult =
  | {
      success: true;
    }
  | {
      error: string;
      success: false;
    };

type DeleteCollectionActionResult =
  | {
      success: true;
    }
  | {
      error: string;
      success: false;
    };

const updateCollectionSchema = z.object({
  collectionId: z.string().min(1),
  description: z
    .string()
    .trim()
    .transform((value) => (value ? value : null))
    .optional(),
  name: z.string().trim().min(1, "Collection name is required.").optional(),
});

const deleteCollectionSchema = z.object({
  collectionId: z.string().min(1),
});

export async function updateCollection(
  input: z.infer<typeof updateCollectionSchema>,
): Promise<UpdateCollectionActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in.", success: false };
  }

  const parsed = updateCollectionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(" "),
      success: false,
    };
  }

  const { collectionId, ...data } = parsed.data;

  const updated = await updateCollectionRecord({
    collectionId,
    data,
    userId,
  });

  if (!updated) {
    return { error: "Collection not found.", success: false };
  }

  return { success: true };
}

export async function deleteCollection(
  input: z.infer<typeof deleteCollectionSchema>,
): Promise<DeleteCollectionActionResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "You must be signed in.", success: false };
  }

  const parsed = deleteCollectionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(" "),
      success: false,
    };
  }

  const wasDeleted = await deleteCollectionRecord({
    collectionId: parsed.data.collectionId,
    userId,
  });

  if (!wasDeleted) {
    return { error: "Collection not found.", success: false };
  }

  return { success: true };
}
