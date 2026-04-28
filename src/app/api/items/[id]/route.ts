import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

interface ItemDetailRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: ItemDetailRouteContext,
): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in to view item details.",
      },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const item = await getItemDetail({ itemId: id, userId });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: "Item not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not load item details.",
      },
      { status: 500 },
    );
  }
}
