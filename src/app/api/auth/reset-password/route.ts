import { NextResponse } from "next/server";

import { resetPassword } from "@/lib/auth/password-reset";

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

  const result = await resetPassword(input);

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
    },
    { status: result.status },
  );
}
