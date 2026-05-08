"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const editorPreferencesSchema = z.object({
  fontSize: z.number().int().min(10).max(30).default(13),
  tabSize: z.number().int().min(1).max(8).default(2),
  wordWrap: z.boolean().default(true),
  minimap: z.boolean().default(false),
  theme: z.enum(["vs-dark", "monokai", "github-dark"]).default("vs-dark"),
});

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;

type UpdateEditorPreferencesResult =
  | {
      data: EditorPreferences;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

export async function updateEditorPreferences(
  preferences: Partial<EditorPreferences>,
): Promise<UpdateEditorPreferencesResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        error: "Not authenticated",
        success: false,
      };
    }

    // Validate the input
    const validatedPreferences = editorPreferencesSchema.partial().parse(preferences);

    // Get current user preferences
    const user = await prisma.user.findUnique({
      select: {
        editorPreferences: true,
      },
      where: {
        id: session.user.id,
      },
    });

    if (!user) {
      return {
        error: "User not found",
        success: false,
      };
    }

    // Merge with existing preferences
    const currentPreferences = editorPreferencesSchema.parse(user.editorPreferences);
    const mergedPreferences = {
      ...currentPreferences,
      ...validatedPreferences,
    };

    // Update user preferences
    const updatedUser = await prisma.user.update({
      data: {
        editorPreferences: mergedPreferences,
      },
      select: {
        editorPreferences: true,
      },
      where: {
        id: session.user.id,
      },
    });

    const result = editorPreferencesSchema.parse(updatedUser.editorPreferences);

    return {
      data: result,
      success: true,
    };
  } catch (error) {
    console.error("Failed to update editor preferences:", error);

    return {
      error: "Failed to update editor preferences",
      success: false,
    };
  }
}

export async function getEditorPreferences(): Promise<UpdateEditorPreferencesResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        error: "Not authenticated",
        success: false,
      };
    }

    const user = await prisma.user.findUnique({
      select: {
        editorPreferences: true,
      },
      where: {
        id: session.user.id,
      },
    });

    if (!user) {
      return {
        error: "User not found",
        success: false,
      };
    }

    const result = editorPreferencesSchema.parse(user.editorPreferences);

    return {
      data: result,
      success: true,
    };
  } catch (error) {
    console.error("Failed to get editor preferences:", error);

    return {
      error: "Failed to get editor preferences",
      success: false,
    };
  }
}
