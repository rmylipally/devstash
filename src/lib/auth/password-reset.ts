import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_EXPIRES_IN_MS = 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_IDENTIFIER_PREFIX = "password-reset:";
const PASSWORD_HASH_ROUNDS = 12;
const RESEND_EMAILS_API_URL = "https://api.resend.com/emails";
const DEFAULT_RESEND_FROM_EMAIL = "DevStash <onboarding@resend.dev>";

export const PASSWORD_RESET_REQUEST_MESSAGE =
  "If an account exists for that email, we sent password reset instructions.";

interface PasswordResetTokenRecord {
  expires: Date;
  identifier: string;
  token: string;
}

interface PasswordResetUserRecord {
  email: string;
  name: string | null;
}

export interface PasswordResetRequestDataStore {
  user: {
    findUnique(args: {
      select: { email: true; name: true };
      where: { email: string };
    }): Promise<PasswordResetUserRecord | null>;
  };
  verificationToken: {
    create(args: {
      data: PasswordResetTokenRecord;
    }): Promise<PasswordResetTokenRecord>;
    deleteMany(args: {
      where: { identifier: string };
    }): Promise<{ count: number }>;
  };
}

export interface PasswordResetDataStore {
  user: {
    update(args: {
      data: { passwordHash: string };
      select: { email: true; id: true };
      where: { email: string };
    }): Promise<{ email: string; id: string }>;
  };
  verificationToken: {
    delete(args: {
      where: { identifier_token: { identifier: string; token: string } };
    }): Promise<PasswordResetTokenRecord>;
    findUnique(args: {
      where: { identifier_token: { identifier: string; token: string } };
    }): Promise<PasswordResetTokenRecord | null>;
  };
}

export interface PasswordResetEmailInput {
  name: string | null;
  resetUrl: string;
  to: string;
}

interface PasswordResetRequestOptions {
  appUrl?: string;
  expiresInMs?: number;
  now?: () => Date;
  sendPasswordResetEmail?: (input: PasswordResetEmailInput) => Promise<void>;
  tokenGenerator?: () => string;
}

interface ResetPasswordOptions {
  now?: () => Date;
  passwordHashRounds?: number;
}

export type PasswordResetRequestResult =
  | {
      data: {
        message: typeof PASSWORD_RESET_REQUEST_MESSAGE;
      };
      status: 200;
      success: true;
    }
  | {
      error: string;
      status: 400 | 500;
      success: false;
    };

export type ResetPasswordResult =
  | {
      status: 200;
      success: true;
    }
  | {
      error: string;
      status: 400 | 500;
      success: false;
    };

function getPasswordResetRequestDataStore(): PasswordResetRequestDataStore {
  return prisma as unknown as PasswordResetRequestDataStore;
}

function getPasswordResetDataStore(): PasswordResetDataStore {
  return prisma as unknown as PasswordResetDataStore;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readTrimmedString(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAppUrl(appUrl: string | undefined): string {
  return appUrl ?? process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getGenericPasswordResetSuccess(): PasswordResetRequestResult {
  return {
    success: true,
    status: 200,
    data: {
      message: PASSWORD_RESET_REQUEST_MESSAGE,
    },
  };
}

export function getPasswordResetTokenIdentifier(email: string): string {
  return `${PASSWORD_RESET_TOKEN_IDENTIFIER_PREFIX}${normalizeEmail(email)}`;
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildPasswordResetUrl({
  appUrl,
  email,
  token,
}: {
  appUrl?: string;
  email: string;
  token: string;
}): string {
  const resetUrl = new URL("/reset-password", getAppUrl(appUrl));

  resetUrl.searchParams.set("email", normalizeEmail(email));
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}

export async function requestPasswordReset(
  input: unknown,
  dataStore: PasswordResetRequestDataStore = getPasswordResetRequestDataStore(),
  options: PasswordResetRequestOptions = {},
): Promise<PasswordResetRequestResult> {
  if (!isRecord(input)) {
    return {
      success: false,
      status: 400,
      error: "Invalid password reset request.",
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

  const user = await dataStore.user.findUnique({
    where: { email },
    select: { email: true, name: true },
  });

  if (!user) {
    return getGenericPasswordResetSuccess();
  }

  try {
    const token =
      options.tokenGenerator?.() ??
      randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
    const identifier = getPasswordResetTokenIdentifier(user.email);
    const now = options.now?.() ?? new Date();
    const expires = new Date(
      now.getTime() +
        (options.expiresInMs ?? PASSWORD_RESET_TOKEN_EXPIRES_IN_MS),
    );

    await dataStore.verificationToken.deleteMany({ where: { identifier } });
    await dataStore.verificationToken.create({
      data: {
        expires,
        identifier,
        token: hashPasswordResetToken(token),
      },
    });

    const sendPasswordResetEmail =
      options.sendPasswordResetEmail ?? sendResendPasswordResetEmail;

    await sendPasswordResetEmail({
      name: user.name,
      resetUrl: buildPasswordResetUrl({
        appUrl: options.appUrl,
        email: user.email,
        token,
      }),
      to: user.email,
    });
  } catch {
    return {
      success: false,
      status: 500,
      error: "Could not send password reset email. Try again.",
    };
  }

  return getGenericPasswordResetSuccess();
}

export async function resetPassword(
  input: unknown,
  dataStore: PasswordResetDataStore = getPasswordResetDataStore(),
  options: ResetPasswordOptions = {},
): Promise<ResetPasswordResult> {
  if (!isRecord(input)) {
    return {
      success: false,
      status: 400,
      error: "Invalid password reset request.",
    };
  }

  const email = normalizeEmail(readTrimmedString(input, "email"));
  const token = readTrimmedString(input, "token");
  const password = readTrimmedString(input, "password");
  const confirmPassword = readTrimmedString(input, "confirmPassword");

  if (!isValidEmail(email) || !token) {
    return {
      success: false,
      status: 400,
      error: "Password reset link is invalid.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      status: 400,
      error: "Password must be at least 8 characters.",
    };
  }

  if (!confirmPassword || password !== confirmPassword) {
    return {
      success: false,
      status: 400,
      error: "Passwords do not match.",
    };
  }

  const tokenHash = hashPasswordResetToken(token);
  const tokenWhere = {
    identifier_token: {
      identifier: getPasswordResetTokenIdentifier(email),
      token: tokenHash,
    },
  };
  const verificationToken = await dataStore.verificationToken.findUnique({
    where: tokenWhere,
  });

  if (!verificationToken) {
    return {
      success: false,
      status: 400,
      error: "Password reset link is invalid.",
    };
  }

  const now = options.now?.() ?? new Date();

  if (verificationToken.expires.getTime() <= now.getTime()) {
    await dataStore.verificationToken.delete({ where: tokenWhere });

    return {
      success: false,
      status: 400,
      error: "Password reset link expired.",
    };
  }

  try {
    await dataStore.user.update({
      data: {
        passwordHash: await hash(
          password,
          options.passwordHashRounds ?? PASSWORD_HASH_ROUNDS,
        ),
      },
      select: { email: true, id: true },
      where: { email },
    });
    await dataStore.verificationToken.delete({ where: tokenWhere });
  } catch {
    return {
      success: false,
      status: 500,
      error: "Could not reset your password. Try again.",
    };
  }

  return {
    success: true,
    status: 200,
  };
}

export async function sendResendPasswordResetEmail(
  input: PasswordResetEmailInput,
  options: {
    apiKey?: string;
    fetcher?: typeof fetch;
    from?: string;
  } = {},
): Promise<void> {
  const apiKey =
    options.apiKey ?? process.env.RESEND_API_KEY ?? process.env.RESENDD_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send password reset email.");
  }

  const fetcher = options.fetcher ?? fetch;
  const from =
    options.from ?? process.env.RESEND_FROM_EMAIL ?? DEFAULT_RESEND_FROM_EMAIL;
  const displayName = input.name ?? input.to;
  const escapedDisplayName = escapeHtml(displayName);
  const escapedResetUrl = escapeHtml(input.resetUrl);
  const response = await fetcher(RESEND_EMAILS_API_URL, {
    body: JSON.stringify({
      from,
      html: `<p>Hi ${escapedDisplayName},</p><p>Click the link below to reset your DevStash password.</p><p><a href="${escapedResetUrl}">Reset your password</a></p><p>This link expires in 1 hour.</p>`,
      subject: "Reset your DevStash password",
      text: `Hi ${displayName},\n\nReset your DevStash password:\n${input.resetUrl}\n\nThis link expires in 1 hour.`,
      to: input.to,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Resend failed to send password reset email.");
  }
}
