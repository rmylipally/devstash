import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

import authConfig from "@/auth.config";
import { normalizePlanTier } from "@/lib/billing";
import { authorizeCredentials } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      authorize: (credentials) => authorizeCredentials(credentials),
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (!token.sub) {
        token.plan = "free";
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        select: {
          plan: true,
        },
        where: {
          id: token.sub,
        },
      });

      token.plan = normalizePlanTier(dbUser?.plan);

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.plan = token.plan === "pro" ? "pro" : "free";
      }

      return session;
    },
  },
});
