import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ContentKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { deleteS3Object } from "@/lib/storage/s3";

export async function DELETE(): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in to delete your account.",
      },
      { status: 401 },
    );
  }

  try {
    const fileItems = await prisma.item.findMany({
      select: { storageKey: true },
      where: {
        contentKind: ContentKind.FILE,
        storageKey: { not: null },
        userId,
      },
    });

    for (const item of fileItems) {
      if (item.storageKey) {
        await deleteS3Object(item.storageKey);
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not delete your account. Try again.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}
