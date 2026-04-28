import { handlers } from "@/auth";
import {
  authRateLimiters,
  buildRateLimitKey,
  checkRateLimit,
  createNextAuthRateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

function isCredentialsCallback(request: Request): boolean {
  return new URL(request.url).pathname.endsWith("/api/auth/callback/credentials");
}

async function getCredentialsEmail(request: Request): Promise<string> {
  try {
    const formData = await request.clone().formData();
    const email = formData.get("email");

    return typeof email === "string" ? email : "";
  } catch {
    return "";
  }
}

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  if (isCredentialsCallback(request)) {
    const key = buildRateLimitKey(authRateLimiters.login.prefix, [
      getClientIp(request),
      await getCredentialsEmail(request),
    ]);
    const rateLimit = await checkRateLimit({
      key,
      limiter: authRateLimiters.login.limiter,
    });

    if (!rateLimit.success) {
      return createNextAuthRateLimitResponse({
        requestUrl: request.url,
        reset: rateLimit.reset,
      });
    }
  }

  return handlers.POST(request);
}
