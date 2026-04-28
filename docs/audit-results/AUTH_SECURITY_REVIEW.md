# Auth Security Review

Audit date: 2026-04-28

Scope: custom authentication code only. This review intentionally focused on the parts Auth.js does not fully handle for the app: credentials auth, password hashing, registration, email verification, password reset, custom API routes, profile/account session usage, token storage, input validation, and abuse controls.

Reviewed files:

- `src/auth.ts`
- `src/auth.config.ts`
- `src/proxy.ts`
- `src/lib/auth/credentials.ts`
- `src/lib/auth/email-verification.ts`
- `src/lib/auth/password-reset.ts`
- `src/lib/auth/forms.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/verify-email/route.ts`
- `src/app/api/account/route.ts`
- `src/app/sign-in/page.tsx`
- `src/app/register/page.tsx`
- `src/components/auth/*`
- `src/components/profile/ProfileAccountActions.tsx`
- `prisma/schema.prisma`

## Executive Summary

The custom auth implementation has a solid baseline: passwords are bcrypt-hashed, reset and verification tokens are random, hashed at rest, expiring, and stored in the existing `VerificationToken` model, and forgot-password responses avoid direct account enumeration.

The main risks are in abuse controls and recovery hardening. The highest-priority fix is to stop deriving emailed reset and verification links from the inbound request origin. Add rate limiting around all public auth endpoints next. After that, make reset token consumption atomic and invalidate old sessions after password changes.

## Findings

### High: Password reset and verification links trust the inbound request origin

Evidence:

- `src/app/api/auth/forgot-password/route.ts:20-22` passes `new URL(request.url).origin` as `appUrl`.
- `src/lib/auth/password-reset.ts:172-177` builds the reset URL directly from that `appUrl` and includes the raw reset token in the URL.
- `src/app/api/auth/register/route.ts:20-22` uses the same request-derived origin for verification emails.
- `src/lib/auth/email-verification.ts:138-143` builds the verification URL directly from that `appUrl`.

Impact:

If the deployment or proxy accepts an attacker-controlled `Host` / forwarded host, an attacker can request a reset for a victim while causing the emailed link to point at an attacker-controlled domain. If the victim clicks the link, the reset token is exposed to the attacker. This is most severe for password reset, but the same origin trust issue exists in verification email links.

Recommended fix:

- Use one canonical configured app URL for emailed auth links, such as `AUTH_URL` or `NEXT_PUBLIC_APP_URL`.
- Do not pass `new URL(request.url).origin` into token email helpers.
- Validate the configured URL at startup or helper boundary.
- If multi-host support is required later, use an explicit allowlist and reject untrusted hosts before sending email.

Suggested direction:

```ts
function getCanonicalAppUrl() {
  const appUrl = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("AUTH_URL or NEXT_PUBLIC_APP_URL is required.");
  }

  return appUrl;
}
```

Then call `requestPasswordReset(input, undefined, { appUrl: getCanonicalAppUrl() })` and the equivalent registration flow.

### High: Public auth paths have no rate limiting

Evidence:

- `src/app/api/auth/register/route.ts:5-22` accepts a JSON body and calls `registerUser` with no throttle.
- `src/app/api/auth/forgot-password/route.ts:5-22` accepts reset requests and can send email with no throttle.
- `src/app/api/auth/reset-password/route.ts:5-20` accepts reset submissions with no throttle.
- `src/lib/auth/credentials.ts:212-249` performs credentials lookup and bcrypt compare with no attempt limiter.
- A repo search found no rate limiter, throttle, CAPTCHA, or equivalent abuse-control implementation in `src`.

Impact:

Attackers can brute-force credentials, burn CPU through bcrypt comparisons, spam registration, repeatedly send password reset emails to a target, or hammer reset token submissions. The reset tokens are strong enough that guessing is not realistic, but the endpoint is still abuseable and costly.

Recommended fix:

- Add server-side rate limiting before expensive or email-sending work.
- Key limits by both IP and normalized email where available.
- Use a shared store suitable for deployment, such as Redis/Upstash, a durable database-backed limiter, or a platform edge limiter.
- Return generic auth errors after rate-limit failures so the limiter does not create account enumeration side channels.

Suggested policy:

- Credentials sign-in: limit by `ip + email` and by `ip`.
- Forgot password: stricter per-email and per-IP limits, for example a small number per hour.
- Register: per-IP and per-email limits.
- Reset password: per-IP and per-token identifier limits.

### Medium: Password reset does not invalidate existing JWT sessions

Evidence:

- `src/auth.ts:31` configures `session: { strategy: "jwt" }`.
- `src/auth.ts:33-38` only copies `token.sub` into `session.user.id`; there is no session version or password-change timestamp check.
- `prisma/schema.prisma:45-65` has no `passwordChangedAt`, `sessionVersion`, or similar invalidation field on `User`.
- `src/lib/auth/password-reset.ts:329-339` updates only `passwordHash`, then deletes the reset token.

Impact:

If an attacker already has a valid session cookie, a victim resetting their password does not force that session out. This weakens password reset as an account recovery mechanism.

Recommended fix:

- Add a `sessionVersion Int @default(0)` or `passwordChangedAt DateTime?` field to `User`.
- On credentials/OAuth sign-in, include the version/timestamp in the JWT.
- On each JWT/session callback, compare the token value against the current user record and reject or force sign-in when stale.
- Increment `sessionVersion` or update `passwordChangedAt` in the same transaction as the password reset.

If switching to database sessions later, delete that user's `Session` rows during password reset.

### Medium: Reset and verification token consumption is not atomic

Evidence:

- `src/lib/auth/password-reset.ts:304-339` reads the token with `findUnique`, checks expiry, updates the user password, then deletes the token as a separate operation.
- `src/lib/auth/email-verification.ts:211-244` follows the same pattern: read token, update the user, then delete the token.
- Neither flow uses a Prisma transaction or an atomic conditional consume operation.

Impact:

Two concurrent requests with the same valid token can both pass the initial `findUnique` check before either deletes the token. For password reset, this can allow a race where multiple submissions with the same reset token attempt to set the password, with the last update winning. If the user update succeeds but the token delete fails, the token can also remain usable.

Recommended fix:

- Consume the token and update the user in a single transaction.
- Prefer a conditional `deleteMany` that includes `identifier`, token hash, and `expires > now`, then require `count === 1` before updating the user in the same transaction.
- Return the same invalid/expired response when the conditional consume count is zero.

Suggested direction:

```ts
await prisma.$transaction(async (tx) => {
  const consumed = await tx.verificationToken.deleteMany({
    where: {
      identifier,
      token: tokenHash,
      expires: { gt: now },
    },
  });

  if (consumed.count !== 1) {
    throw new InvalidOrExpiredTokenError();
  }

  await tx.user.update({
    where: { email },
    data: { passwordHash },
  });
});
```

### Low: Password validation has no maximum byte length

Evidence:

- `src/lib/auth/credentials.ts:185-191` validates only a minimum password length during registration.
- `src/lib/auth/password-reset.ts:281-287` validates only a minimum password length during reset.
- `src/lib/auth/forms.ts:117-119` and `src/lib/auth/forms.ts:179-181` mirror only the minimum length on the client.

Impact:

With bcrypt, passwords beyond 72 bytes are truncated by the algorithm. That can surprise users who think the full password is meaningful. Very large submitted strings can also add avoidable server work before hashing.

Recommended fix:

- Add a shared server-side password policy helper.
- With bcrypt, enforce `Buffer.byteLength(password, "utf8") <= 72`.
- Mirror the same rule client-side for faster feedback.
- Keep the server-side check authoritative.

### Low: Registration response enumerates existing accounts

Evidence:

- `src/lib/auth/credentials.ts:271-280` checks for an existing email and returns `409` with `An account with that email already exists.`

Impact:

An unauthenticated caller can discover whether an email is registered. This may be acceptable for the current product, but it is still an auth information disclosure.

Recommended fix:

- If account privacy matters, return a generic registration response and send a recovery/sign-in email to existing users.
- If preserving UX is preferred, keep the current behavior but document the tradeoff.

## Passed Checks

- Passwords are hashed with bcrypt, using 12 rounds in production code: `src/lib/auth/credentials.ts:14`, `src/lib/auth/credentials.ts:289-293`, `src/lib/auth/password-reset.ts:9`, `src/lib/auth/password-reset.ts:329-335`.
- Credentials sign-in rejects OAuth-only users without `passwordHash`: `src/lib/auth/credentials.ts:235-237`.
- Credentials sign-in blocks unverified users when email verification is enabled: `src/lib/auth/credentials.ts:245-249`.
- Reset tokens and verification tokens use 32 random bytes and are SHA-256 hashed before storage: `src/lib/auth/password-reset.ts:6`, `src/lib/auth/password-reset.ts:159-160`, `src/lib/auth/password-reset.ts:213-229`, `src/lib/auth/email-verification.ts:3`, `src/lib/auth/email-verification.ts:125-126`, `src/lib/auth/email-verification.ts:159-175`.
- Password reset requests do not reveal whether the account exists: `src/lib/auth/password-reset.ts:13-14`, `src/lib/auth/password-reset.ts:203-210`, `src/lib/auth/password-reset.ts:252`.
- Reset tokens expire after one hour and verification tokens expire after 24 hours: `src/lib/auth/password-reset.ts:7`, `src/lib/auth/password-reset.ts:318-325`, `src/lib/auth/email-verification.ts:4`, `src/lib/auth/email-verification.ts:225-232`.
- Dynamic values in outbound email HTML are escaped: `src/lib/auth/password-reset.ts:132-139`, `src/lib/auth/password-reset.ts:372-379`, `src/lib/auth/email-verification.ts:92-99`, `src/lib/auth/email-verification.ts:266-274`.
- Auth callback redirects are constrained to same-origin relative paths: `src/lib/auth/forms.ts:67-72`, `src/app/sign-in/page.tsx:81`, `src/app/register/page.tsx:28`.
- Dashboard and profile routes are protected by the Auth.js proxy: `src/proxy.ts:15-24`.
- The profile page also verifies the server session before loading account data: `src/app/profile/page.tsx:92-104`.
- Account deletion uses the authenticated session user id server-side instead of trusting client-provided ids: `src/app/api/account/route.ts:6-23`.
- Prisma account/session/domain records cascade from `User` where appropriate: `prisma/schema.prisma:56-63`, `prisma/schema.prisma:81-94`.

## Recommended Remediation Order

1. Replace request-origin email links with a canonical configured application URL.
2. Add rate limiting around sign-in, register, forgot-password, reset-password, and verification attempts.
3. Make reset and verification token consumption atomic with Prisma transactions.
4. Add password-reset session invalidation for JWT sessions.
5. Add a shared password policy helper with a bcrypt-safe maximum byte length.
6. Decide whether registration email enumeration is an acceptable UX tradeoff.

## Verification Notes

This was a static audit. I did not modify runtime auth behavior or run app tests because the requested output was an audit report. Evidence was gathered with `rg`, line-numbered file reads, and targeted inspection of auth-related routes, libraries, components, and Prisma schema.
