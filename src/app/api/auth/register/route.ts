import { NextResponse } from "next/server";

import { registerUser } from "@/lib/auth/credentials";

export async function POST(request: Request): Promise<NextResponse> {
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

  const result = await registerUser(input, undefined, {
    appUrl: new URL(request.url).origin,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
    },
    { status: result.status },
  );
}
