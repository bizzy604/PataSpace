# @pataspace/contracts changelog

## 0.3.0 — 2026-07-13

**Breaking.** Docs/14 Phase 1: `registerSchema`/`loginSchema` and their
types (`RegisterRequest`/`LoginRequest`) are now email-identified —
`emailRegisterSchema`/`emailLoginSchema` and their duplicate types from
0.2.0 are folded into these canonical names and removed. Any consumer
still sending `phoneNumber`+`password` to `/auth/login` or expecting
`RegisterRequest.email` to be optional must update.

- `registerSchema`: `email` (required, unique identifier) replaces the
  optional `email` field; `phoneNumber` stays required (OTP target).
- `loginSchema`: `email` + `password` (was `phoneNumber` + `password`).
- `authUserSchema` / `AuthUser`: `email` is now always present in the
  shape, but nullable — accounts created before this migration may still
  have none.
- Unaffected: `verifyOtpSchema`, `resendOtpSchema`, `refreshSchema`,
  `logoutSchema` (still phone/token based — phone is still the OTP and
  recovery channel), `forgotPasswordSchema` / `resetPasswordSchema` (added
  in 0.2.0, unchanged).

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
