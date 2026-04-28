import { NextResponse } from "next/server";

import { requestPasswordReset } from "@/lib/auth/password-reset";

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

  const result = await requestPasswordReset(input, undefined, {
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
