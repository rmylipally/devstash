import type { DefaultSession } from "next-auth";

type SessionPlan = "free" | "pro";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: SessionPlan;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan?: SessionPlan;
  }
}
