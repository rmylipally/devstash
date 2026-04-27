interface SignInFormData {
  email: string;
  password: string;
}

interface RegisterFormData extends SignInFormData {
  confirmPassword: string;
  name: string;
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

interface RegisterFormErrors extends SignInFormErrors {
  confirmPassword?: string;
  name?: string;
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
