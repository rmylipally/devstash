import { createHash, randomBytes } from "node:crypto";

const VERIFICATION_TOKEN_BYTES = 32;
const VERIFICATION_TOKEN_EXPIRES_IN_MS = 24 * 60 * 60 * 1000;
const RESEND_EMAILS_API_URL = "https://api.resend.com/emails";
const DEFAULT_RESEND_FROM_EMAIL = "DevStash <onboarding@resend.dev>";
const EMAIL_VERIFICATION_DISABLED_VALUES = new Set([
  "0",
  "disabled",
  "false",
  "no",
  "off",
]);

interface VerificationTokenRecord {
  expires: Date;
  identifier: string;
  token: string;
}

export interface VerificationTokenRegistrationDataStore {
  verificationToken?: {
    create(args: {
      data: VerificationTokenRecord;
    }): Promise<VerificationTokenRecord>;
    deleteMany(args: {
      where: { identifier: string };
    }): Promise<{ count: number }>;
  };
}

export interface EmailVerificationDataStore {
  user: {
    update(args: {
      data: { emailVerified: Date };
      select: { email: true; emailVerified: true; id: true };
      where: { email: string };
    }): Promise<{
      email: string;
      emailVerified: Date | null;
      id: string;
    }>;
  };
  verificationToken: {
    delete(args: {
      where: { identifier_token: { identifier: string; token: string } };
    }): Promise<VerificationTokenRecord>;
    findUnique(args: {
      where: { identifier_token: { identifier: string; token: string } };
    }): Promise<VerificationTokenRecord | null>;
  };
}

export interface VerificationEmailInput {
  name: string | null;
  to: string;
  verificationUrl: string;
}

export interface CreateEmailVerificationOptions {
  appUrl?: string;
  expiresInMs?: number;
  now?: () => Date;
  tokenGenerator?: () => string;
}

export interface SendVerificationEmailOptions {
  apiKey?: string;
  fetcher?: typeof fetch;
  from?: string;
}

export type VerifyEmailTokenResult =
  | {
      status: "verified";
      success: true;
    }
  | {
      error: string;
      status: "expired" | "invalid";
      success: false;
    };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAppUrl(appUrl: string | undefined) {
  return appUrl ?? process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getVerificationTokenDataStore(
  dataStore: VerificationTokenRegistrationDataStore,
) {
  if (!dataStore.verificationToken) {
    throw new Error("Verification token data store is required.");
  }

  return dataStore.verificationToken;
}

export function isEmailVerificationEnabled(
  value = process.env.EMAIL_VERIFICATION_ENABLED,
) {
  if (!value) {
    return true;
  }

  return !EMAIL_VERIFICATION_DISABLED_VALUES.has(value.trim().toLowerCase());
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildEmailVerificationUrl({
  appUrl,
  email,
  token,
}: {
  appUrl?: string;
  email: string;
  token: string;
}) {
  const verificationUrl = new URL("/verify-email", getAppUrl(appUrl));

  verificationUrl.searchParams.set("email", normalizeEmail(email));
  verificationUrl.searchParams.set("token", token);

  return verificationUrl.toString();
}

export async function createEmailVerificationRequest(
  {
    appUrl,
    email,
  }: {
    appUrl?: string;
    email: string;
  },
  dataStore: VerificationTokenRegistrationDataStore,
  options: CreateEmailVerificationOptions = {},
) {
  const verificationToken = getVerificationTokenDataStore(dataStore);
  const identifier = normalizeEmail(email);
  const token =
    options.tokenGenerator?.() ??
    randomBytes(VERIFICATION_TOKEN_BYTES).toString("base64url");
  const tokenHash = hashVerificationToken(token);
  const now = options.now?.() ?? new Date();
  const expires = new Date(
    now.getTime() +
      (options.expiresInMs ?? VERIFICATION_TOKEN_EXPIRES_IN_MS),
  );

  await verificationToken.deleteMany({ where: { identifier } });
  await verificationToken.create({
    data: {
      expires,
      identifier,
      token: tokenHash,
    },
  });

  return {
    expires,
    verificationUrl: buildEmailVerificationUrl({
      appUrl,
      email: identifier,
      token,
    }),
  };
}

export async function verifyEmailToken(
  input: { email: string | null | undefined; token: string | null | undefined },
  dataStore: EmailVerificationDataStore,
  options: { now?: () => Date } = {},
): Promise<VerifyEmailTokenResult> {
  const email = normalizeEmail(input.email ?? "");
  const token = input.token?.trim() ?? "";

  if (!isValidEmail(email) || !token) {
    return {
      error: "Verification link is invalid.",
      status: "invalid",
      success: false,
    };
  }

  const tokenHash = hashVerificationToken(token);
  const tokenWhere = {
    identifier_token: {
      identifier: email,
      token: tokenHash,
    },
  };
  const verificationToken = await dataStore.verificationToken.findUnique({
    where: tokenWhere,
  });

  if (!verificationToken) {
    return {
      error: "Verification link is invalid.",
      status: "invalid",
      success: false,
    };
  }

  const now = options.now?.() ?? new Date();

  if (verificationToken.expires.getTime() <= now.getTime()) {
    await dataStore.verificationToken.delete({ where: tokenWhere });

    return {
      error: "Verification link expired.",
      status: "expired",
      success: false,
    };
  }

  await dataStore.user.update({
    data: { emailVerified: now },
    select: {
      email: true,
      emailVerified: true,
      id: true,
    },
    where: { email },
  });
  await dataStore.verificationToken.delete({ where: tokenWhere });

  return {
    status: "verified",
    success: true,
  };
}

export async function sendVerificationEmail(
  input: VerificationEmailInput,
  options: SendVerificationEmailOptions = {},
) {
  const apiKey =
    options.apiKey ?? process.env.RESEND_API_KEY ?? process.env.RESENDD_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send verification email.");
  }

  const fetcher = options.fetcher ?? fetch;
  const from =
    options.from ?? process.env.RESEND_FROM_EMAIL ?? DEFAULT_RESEND_FROM_EMAIL;
  const displayName = input.name ?? input.to;
  const escapedDisplayName = escapeHtml(displayName);
  const escapedVerificationUrl = escapeHtml(input.verificationUrl);
  const response = await fetcher(RESEND_EMAILS_API_URL, {
    body: JSON.stringify({
      from,
      html: `<p>Hi ${escapedDisplayName},</p><p>Click the link below to verify your DevStash account.</p><p><a href="${escapedVerificationUrl}">Verify your email</a></p><p>This link expires in 24 hours.</p>`,
      subject: "Verify your DevStash email",
      text: `Hi ${displayName},\n\nVerify your DevStash account:\n${input.verificationUrl}\n\nThis link expires in 24 hours.`,
      to: input.to,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Resend failed to send verification email.");
  }
}
