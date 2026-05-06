import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { createCollection } from "@/lib/db/collections";

const createCollectionSchema = z.object({
  description: z
    .string()
    .trim()
    .transform((value) => (value ? value : null))
    .optional(),
  name: z.string().trim().min(1, "Collection name is required."),
});

function getValidationError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in to create collections.",
      },
      { status: 401 },
    );
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const parsedInput = createCollectionSchema.safeParse(input);

  if (!parsedInput.success) {
    return NextResponse.json(
      {
        success: false,
        error: getValidationError(parsedInput.error),
      },
      { status: 400 },
    );
  }

  try {
    const collection = await createCollection({
      data: parsedInput.data,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: collection,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not create collection. Try again.",
      },
      { status: 500 },
    );
  }
}
