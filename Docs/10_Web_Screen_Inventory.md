# PataSpace Web Screen Inventory

## Scope Date

- March 30, 2026

## Context

- Mobile posting and owner-listing management are already implemented in `apps/mobile`.
- Backend routes now cover auth, listings, credit balance, credit purchase, unlocks, confirmations, disputes, and the current user profile.
- The web app should focus on the incoming-tenant journey and avoid rebuilding mobile-only camera and posting flows.

## Core Web Screen Count

- `20` core web screens

## Core Screens

### Public Discovery

1. `Landing`
2. `Browse Listings`
3. `Listing Details`
4. `Photo Gallery`

### Authentication

5. `Register`
6. `Verify OTP`
7. `Sign In`

### Wallet And Payments

8. `Wallet Overview`
9. `Buy Credits`
10. `M-Pesa Processing`
11. `Payment Success`
12. `Transaction History`
13. `Transaction Detail`

### Unlock And Follow-Through

14. `My Unlocks`
15. `Unlock Confirmation`
16. `Contact Revealed`
17. `Confirm Move-In`
18. `Dispute / Report Issue`

### Account And Support

19. `Profile`
20. `Support`

## Intentionally Excluded From Web Phase 1

- Mobile-only posting flow:
  - splash
  - onboarding
  - camera capture
  - photo review
  - listing details form
  - listing submission
  - my listings owner management
- Admin-only flows:
  - moderation
  - dispute operations
  - analytics dashboards
- Lower-priority tenant enhancements not yet backed by a clear web surface:
  - saved listings
  - notifications
  - referral
  - rate and review
  - app update announcements

## Route Mapping

- `/`
- `/listings`
- `/listings/[id]`
- `/listings/[id]/gallery`
- `/auth/register`
- `/auth/verify-otp`
- `/auth/sign-in`
- `/wallet`
- `/wallet/buy`
- `/wallet/processing`
- `/wallet/success`
- `/wallet/transactions`
- `/wallet/transactions/[id]`
- `/unlocks`
- `/listings/[id]/unlock`
- `/unlocks/[id]`
- `/unlocks/[id]/confirm`
- `/unlocks/[id]/dispute`
- `/profile`
- `/support`

## Notes

- Search and filters are embedded in the browse experience rather than split into separate web routes.
- Confirmation status is handled inside the unlock detail and confirm routes instead of a standalone status page.
- This count is for the first complete tenant-facing web pass. Additional screens can be added after backend-backed polish items are prioritized.
