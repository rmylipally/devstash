import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export function getSignInRedirectUrl(requestUrl: URL) {
  const signInUrl = new URL("/sign-in", requestUrl.origin);
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
  matcher: ["/dashboard/:path*", "/profile", "/items/:path*"],
};
