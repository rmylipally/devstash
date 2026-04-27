import { NextResponse } from "next/server";

import { verifyEmailToken } from "@/lib/auth/email-verification";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const result = await verifyEmailToken(
    {
      email: requestUrl.searchParams.get("email"),
      token: requestUrl.searchParams.get("token"),
    },
    prisma,
  );
  const signInUrl = new URL("/sign-in", requestUrl.origin);

  if (result.success) {
    signInUrl.searchParams.set("verified", "1");
  } else {
    signInUrl.searchParams.set("verification", result.status);
  }

  return NextResponse.redirect(signInUrl);
}
