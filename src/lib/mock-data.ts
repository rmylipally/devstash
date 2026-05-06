export type PlanTier = "free" | "pro";

export interface MockUser {
  email: string;
  id: string;
  imageUrl: string;
  name: string;
  plan: PlanTier;
}

export const currentUser: MockUser = {
  email: "demo@devstash.io",
  id: "user-demo",
  imageUrl: "/avatars/john-doe.png",
  name: "Demo User",
  plan: "free",
};
