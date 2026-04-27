import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import {
  getSafeAuthRedirect,
  validateRegisterForm,
  validateSignInForm,
} from "../src/lib/auth/forms";
import {
  getUserInitials,
  UserAvatar,
} from "../src/components/auth/UserAvatar";

process.env.DATABASE_URL ??= "postgresql://devstash:devstash@localhost:5432/devstash";

describe("auth ui", () => {
  it("configures Auth.js and the dashboard proxy to use the custom sign-in page", async () => {
    const { default: authConfig } = await import("../src/auth.config");
    const { getSignInRedirectUrl } = await import("../src/proxy");
    const redirectUrl = getSignInRedirectUrl(
      new URL("https://devstash.test/dashboard"),
    );

    assert.equal(authConfig.pages?.signIn, "/sign-in");
    assert.equal(redirectUrl.pathname, "/sign-in");
    assert.equal(
      redirectUrl.searchParams.get("callbackUrl"),
      "https://devstash.test/dashboard",
    );
  });

  it("validates sign-in form input before submitting credentials", () => {
    assert.deepEqual(validateSignInForm({ email: "bad", password: "" }), {
      success: false,
      errors: {
        email: "Enter a valid email address.",
        password: "Password is required.",
      },
    });

    assert.deepEqual(
      validateSignInForm({
        email: " USER@example.com ",
        password: "password123",
      }),
      {
        success: true,
        data: {
          email: "user@example.com",
          password: "password123",
        },
      },
    );
  });

  it("validates register form input and matching passwords", () => {
    assert.deepEqual(
      validateRegisterForm({
        name: "Test User",
        email: "bad-email",
        password: "password123",
        confirmPassword: "different",
      }),
      {
        success: false,
        errors: {
          email: "Enter a valid email address.",
          confirmPassword: "Passwords do not match.",
        },
      },
    );

    assert.deepEqual(
      validateRegisterForm({
        name: " Test User ",
        email: " TEST@example.com ",
        password: "password123",
        confirmPassword: "password123",
      }),
      {
        success: true,
        data: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
        },
      },
    );
  });

  it("keeps auth redirects local to the app", () => {
    assert.equal(getSafeAuthRedirect("/dashboard/items"), "/dashboard/items");
    assert.equal(getSafeAuthRedirect("https://evil.test"), "/dashboard");
    assert.equal(getSafeAuthRedirect("//evil.test"), "/dashboard");
    assert.equal(getSafeAuthRedirect(undefined), "/dashboard");
  });

  it("renders avatar initials fallbacks and configures GitHub avatar images", async () => {
    const initialsHtml = renderToStaticMarkup(
      <UserAvatar email="brad@example.com" image={null} name="Brad Traversy" />,
    );
    const [avatarSource, nextConfig] = await Promise.all([
      readFile("src/components/auth/UserAvatar.tsx", "utf8"),
      readFile("next.config.ts", "utf8"),
    ]);

    assert.equal(getUserInitials({ email: "brad@example.com", name: "Brad Traversy" }), "BT");
    assert.match(initialsHtml, />BT</);
    assert.match(avatarSource, /from "next\/image"/);
    assert.match(nextConfig, /avatars\.githubusercontent\.com/);
  });

  it("adds custom sign-in and register pages with expected form wiring", async () => {
    const [signInPage, registerPage, signInForm, registerForm, authToast] =
      await Promise.all([
        readFile("src/app/sign-in/page.tsx", "utf8"),
        readFile("src/app/register/page.tsx", "utf8"),
        readFile("src/components/auth/SignInForm.tsx", "utf8"),
        readFile("src/components/auth/RegisterForm.tsx", "utf8"),
        readFile("src/components/auth/AuthToast.tsx", "utf8"),
      ]);

    assert.match(signInPage, /SignInForm/);
    assert.match(registerPage, /RegisterForm/);
    assert.match(signInPage, /Account created\. You can now log in\./);
    assert.match(signInForm, /AuthToast/);
    assert.match(signInForm, /signIn\("credentials"/);
    assert.match(signInForm, /signIn\("github"/);
    assert.doesNotMatch(signInForm, /initialMessage \? \(/);
    assert.match(registerForm, /\/api\/auth\/register/);
    assert.match(registerForm, /router\.push\([\s\S]*\/sign-in/);
    assert.match(authToast, /role="status"/);
    assert.match(authToast, /aria-live="polite"/);
  });
});
