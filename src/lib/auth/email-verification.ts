import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

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

export const EMAIL_VERIFICATION_REQUEST_MESSAGE =
  "If an account needs verification, we sent a new verification link.";

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

interface EmailVerificationRequestUserRecord {
  email: string;
  emailVerified: Date | null;
  name: string | null;
}

export interface EmailVerificationRequestDataStore
  extends VerificationTokenRegistrationDataStore {
  user: {
    findUnique(args: {
      select: { email: true; emailVerified: true; name: true };
      where: { email: string };
    }): Promise<EmailVerificationRequestUserRecord | null>;
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

export type EmailVerificationRequestResult =
  | {
      data: {
        message: typeof EMAIL_VERIFICATION_REQUEST_MESSAGE;
      };
      status: 200;
      success: true;
    }
  | {
      error: string;
      status: 400 | 500;
      success: false;
    };

interface RequestEmailVerificationOptions extends CreateEmailVerificationOptions {
  sendVerificationEmail?: (input: VerificationEmailInput) => Promise<void>;
}

function getEmailVerificationRequestDataStore(): EmailVerificationRequestDataStore {
  return prisma as unknown as EmailVerificationRequestDataStore;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readTrimmedString(input: Record<string, unknown>, key: string) {
  const value = input[key];

  return typeof value === "string" ? value.trim() : "";
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

function getGenericEmailVerificationSuccess(): EmailVerificationRequestResult {
  return {
    success: true,
    status: 200,
    data: {
      message: EMAIL_VERIFICATION_REQUEST_MESSAGE,
    },
  };
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

export async function requestEmailVerification(
  input: unknown,
  dataStore: EmailVerificationRequestDataStore = getEmailVerificationRequestDataStore(),
  options: RequestEmailVerificationOptions = {},
): Promise<EmailVerificationRequestResult> {
  if (!isRecord(input)) {
    return {
      success: false,
      status: 400,
      error: "Invalid verification request.",
    };
  }

  const email = normalizeEmail(readTrimmedString(input, "email"));

  if (!isValidEmail(email)) {
    return {
      success: false,
      status: 400,
      error: "Enter a valid email address.",
    };
  }

  if (!isEmailVerificationEnabled()) {
    return getGenericEmailVerificationSuccess();
  }

  const user = await dataStore.user.findUnique({
    where: { email },
    select: { email: true, emailVerified: true, name: true },
  });

  if (!user || user.emailVerified) {
    return getGenericEmailVerificationSuccess();
  }

  try {
    const verificationRequest = await createEmailVerificationRequest(
      {
        appUrl: options.appUrl,
        email: user.email,
      },
      dataStore,
      {
        appUrl: options.appUrl,
        expiresInMs: options.expiresInMs,
        now: options.now,
        tokenGenerator: options.tokenGenerator,
      },
    );
    const sendEmail = options.sendVerificationEmail ?? sendVerificationEmail;

    await sendEmail({
      name: user.name,
      to: user.email,
      verificationUrl: verificationRequest.verificationUrl,
    });
  } catch {
    return {
      success: false,
      status: 500,
      error: "Could not send verification email. Try again.",
    };
  }

  return getGenericEmailVerificationSuccess();
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
