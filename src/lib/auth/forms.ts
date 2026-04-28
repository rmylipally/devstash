interface SignInFormData {
  email: string;
  password: string;
}

interface ForgotPasswordFormData {
  email: string;
}

interface RegisterFormData extends SignInFormData {
  confirmPassword: string;
  name: string;
}

interface ResetPasswordFormData extends SignInFormData {
  confirmPassword: string;
  token: string;
}

type FormValidationResult<TData, TErrors> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      errors: TErrors;
    };

interface SignInFormErrors {
  email?: string;
  password?: string;
}

interface ForgotPasswordFormErrors {
  email?: string;
}

interface RegisterFormErrors extends SignInFormErrors {
  confirmPassword?: string;
  name?: string;
}

interface ResetPasswordFormErrors extends SignInFormErrors {
  confirmPassword?: string;
  token?: string;
}

function readTrimmedString(input: Record<string, unknown>, key: string) {
  const value = input[key];

  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasErrors(errors: object) {
  return Object.values(errors).some(Boolean);
}

export function getSafeAuthRedirect(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function validateSignInForm(
  input: Record<string, unknown>,
): FormValidationResult<SignInFormData, SignInFormErrors> {
  const email = normalizeEmail(readTrimmedString(input, "email"));
  const password = readTrimmedString(input, "password");
  const errors: SignInFormErrors = {};

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  if (hasErrors(errors)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { email, password },
  };
}

export function validateRegisterForm(
  input: Record<string, unknown>,
): FormValidationResult<RegisterFormData, RegisterFormErrors> {
  const name = readTrimmedString(input, "name");
  const email = normalizeEmail(readTrimmedString(input, "email"));
  const password = readTrimmedString(input, "password");
  const confirmPassword = readTrimmedString(input, "confirmPassword");
  const errors: RegisterFormErrors = {};

  if (!name) {
    errors.name = "Name is required.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (hasErrors(errors)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      confirmPassword,
      email,
      name,
      password,
    },
  };
}

export function validateForgotPasswordForm(
  input: Record<string, unknown>,
): FormValidationResult<ForgotPasswordFormData, ForgotPasswordFormErrors> {
  const email = normalizeEmail(readTrimmedString(input, "email"));
  const errors: ForgotPasswordFormErrors = {};

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (hasErrors(errors)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { email },
  };
}

export function validateResetPasswordForm(
  input: Record<string, unknown>,
): FormValidationResult<ResetPasswordFormData, ResetPasswordFormErrors> {
  const email = normalizeEmail(readTrimmedString(input, "email"));
  const token = readTrimmedString(input, "token");
  const password = readTrimmedString(input, "password");
  const confirmPassword = readTrimmedString(input, "confirmPassword");
  const errors: ResetPasswordFormErrors = {};

  if (!isValidEmail(email)) {
    errors.email = "Password reset link is invalid.";
  }

  if (!token) {
    errors.token = "Password reset link is invalid.";
  }

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (hasErrors(errors)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      confirmPassword,
      email,
      password,
      token,
    },
  };
}
