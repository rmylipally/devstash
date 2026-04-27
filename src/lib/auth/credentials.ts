import { compare, hash } from "bcryptjs";
import type { User } from "next-auth";

import { prisma } from "@/lib/prisma";

const PASSWORD_HASH_ROUNDS = 12;

interface CredentialsUserRecord {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  passwordHash: string | null;
}

interface RegisteredUser {
  id: string;
  email: string;
  name: string | null;
}

interface ExistingRegistrationUser {
  id: string;
  email: string;
}

interface CredentialsDataStore {
  user: {
    findUnique(args: {
      where: { email: string };
      select: {
        id: true;
        email: true;
        name: true;
        image: true;
        passwordHash: true;
      };
    }): Promise<CredentialsUserRecord | null>;
  };
}

interface RegistrationDataStore {
  user: {
    findUnique(args: {
      where: { email: string };
      select: { id: true; email: true };
    }): Promise<ExistingRegistrationUser | null>;
    create(args: {
      data: {
        name: string;
        email: string;
        passwordHash: string;
      };
      select: {
        id: true;
        email: true;
        name: true;
      };
    }): Promise<RegisteredUser>;
  };
}

interface RegistrationOptions {
  passwordHashRounds?: number;
}

interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterUserResult =
  | {
      success: true;
      status: 201;
      data: {
        user: RegisteredUser;
      };
    }
  | {
      success: false;
      status: 400 | 409 | 500;
      error: string;
    };

function getCredentialsDataStore(): CredentialsDataStore {
  return prisma as unknown as CredentialsDataStore;
}

function getRegistrationDataStore(): RegistrationDataStore {
  return prisma as unknown as RegistrationDataStore;
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

function parseCredentials(credentials: unknown): { email: string; password: string } | null {
  if (!isRecord(credentials)) {
    return null;
  }

  const email = normalizeEmail(readTrimmedString(credentials, "email"));
  const password = readTrimmedString(credentials, "password");

  if (!isValidEmail(email) || password.length === 0) {
    return null;
  }

  return { email, password };
}

function validateRegistrationInput(input: unknown): RegistrationInput | RegisterUserResult {
  if (!isRecord(input)) {
    return {
      success: false,
      status: 400,
      error: "Invalid registration request.",
    };
  }

  const name = readTrimmedString(input, "name");
  const email = normalizeEmail(readTrimmedString(input, "email"));
  const password = readTrimmedString(input, "password");
  const confirmPassword = readTrimmedString(input, "confirmPassword");

  if (!name) {
    return {
      success: false,
      status: 400,
      error: "Name is required.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      success: false,
      status: 400,
      error: "A valid email is required.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      status: 400,
      error: "Password must be at least 8 characters.",
    };
  }

  if (!confirmPassword) {
    return {
      success: false,
      status: 400,
      error: "Please confirm your password.",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      status: 400,
      error: "Passwords do not match.",
    };
  }

  return { name, email, password, confirmPassword };
}

export async function authorizeCredentials(
  credentials: unknown,
  dataStore: CredentialsDataStore = getCredentialsDataStore(),
): Promise<User | null> {
  const parsedCredentials = parseCredentials(credentials);

  if (!parsedCredentials) {
    return null;
  }

  const user = await dataStore.user.findUnique({
    where: { email: parsedCredentials.email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return null;
  }

  const isPasswordValid = await compare(parsedCredentials.password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
}

export async function registerUser(
  input: unknown,
  dataStore: RegistrationDataStore = getRegistrationDataStore(),
  options: RegistrationOptions = {},
): Promise<RegisterUserResult> {
  const validationResult = validateRegistrationInput(input);

  if ("success" in validationResult) {
    return validationResult;
  }

  const existingUser = await dataStore.user.findUnique({
    where: { email: validationResult.email },
    select: { id: true, email: true },
  });

  if (existingUser) {
    return {
      success: false,
      status: 409,
      error: "An account with that email already exists.",
    };
  }

  const passwordHash = await hash(
    validationResult.password,
    options.passwordHashRounds ?? PASSWORD_HASH_ROUNDS,
  );
  const user = await dataStore.user.create({
    data: {
      name: validationResult.name,
      email: validationResult.email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return {
    success: true,
    status: 201,
    data: { user },
  };
}
