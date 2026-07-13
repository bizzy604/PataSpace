# @pataspace/contracts changelog

## 0.2.0 — 2026-07-11

Email-identifier auth contract (Clerk removal, Docs/14 Phase 0). Additive:
no existing schema or type changed shape except `authUserSchema`/`AuthUser`
gaining an optional `email`.

- New schemas: `emailSchema` (trim + lowercase + email), `emailRegisterSchema`
  (email-identified registration, phone still required as OTP target),
  `emailLoginSchema`, `forgotPasswordSchema`, `forgotPasswordResponseSchema`
  (anti-enumeration shape), `resetPasswordSchema` (OTP shape shared with
  verify-otp).
- New types: `EmailRegisterRequest`, `EmailLoginRequest`,
  `ForgotPasswordRequest`, `ForgotPasswordResponse`, `ResetPasswordRequest`.
- `authUserSchema` / `AuthUser`: optional nullable `email`.
- Phone-identifier `registerSchema` / `loginSchema` unchanged; they are
  deleted in Phase 1 when the API swaps to the email schemas.
- Test lane added: `pnpm --filter @pataspace/contracts test` (jest gate
  tests for the auth schemas).

## 0.1.0

Initial contract set (pre-changelog).
