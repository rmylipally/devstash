import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
