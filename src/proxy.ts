import { NextResponse } from "next/server";

import { auth } from "@/auth";

export function getSignInRedirectUrl(requestUrl: URL) {
  const signInUrl = new URL("/api/auth/signin", requestUrl.origin);
  signInUrl.searchParams.set("callbackUrl", requestUrl.toString());

  return signInUrl;
}

export const proxy = auth((request) => {
  if (!request.auth) {
    return NextResponse.redirect(getSignInRedirectUrl(request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
