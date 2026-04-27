import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

const authConfig = {
  providers: [GitHub],
} satisfies NextAuthConfig;

export default authConfig;
