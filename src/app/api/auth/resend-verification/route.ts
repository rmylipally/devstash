import { NextResponse } from "next/server";

import { requestEmailVerification } from "@/lib/auth/email-verification";
import { authRateLimiters, enforceAuthRateLimit } from "@/lib/rate-limit";

function getEmailIdentifier(input: unknown): string {
  if (typeof input !== "object" || input === null) {
    return "";
  }

  const email = (input as Record<string, unknown>).email;

  return typeof email === "string" ? email : "";
}

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

  const rateLimitResponse = await enforceAuthRateLimit({
    identifiers: [getEmailIdentifier(input)],
    rateLimiter: authRateLimiters.resendVerification,
    request,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const result = await requestEmailVerification(input, undefined, {
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
