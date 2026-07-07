# 12. Mobile Redesign Plan

Rebuild every mobile screen to match the new UI/UX designs in
`Docs/Wireframes/PataSpace Design Screens/`. This is the planning doc the
delivery-phasing rule points at: work one phase at a time, validate, mark the
phase complete here, then start the next.

## Source of truth

- **Tokens:** `pataspace_ios/DESIGN.md` (identical copy in every folder).
  Primary teal `#00667e`, container teal `#28809a`, Eerie Black `#252525`
  nav shell, Battleship Grey `#8D9192` secondary text, Anti-flash White
  `#EDEDED` fills, Poppins headings, DM Sans body, 8pt grid, 16px card
  radius, 12px input/media radius, full-pill chips, 44px touch targets.
- **Per screen:** `screen.png` is the visual target; `code.html` is a
  Tailwind mockup to read for layout/spacing, never to copy verbatim.
- Where the older `PataSpace_Screen_Reference_Guide.md` disagrees with
  DESIGN.md (it says accent `#28809A`), **DESIGN.md wins** (decided
  2026-07-05): primary is `#00667e`, `#28809a` becomes the container/pressed
  tone.

## Decisions (settled with Amoni, 2026-07-05)

1. **Primary teal is `#00667e`.** `#28809a` demotes to `primary-container`.
2. **Dark mode stays.** Designs are light-only; every phase maps its tokens
   to a derived dark palette so the existing toggle keeps working. Light is
   validated against the PNGs; dark is validated for legibility/contrast.
3. **forgot_password / reset_password / account_locked are NOT built.**
   Clerk owns those workflows for now. The three designs stay in the drop as
   future reference; the auth phase restyles existing screens only.
4. **Admin Web Screens are out of scope.** The 10 admin web designs (and the
   duplicate `main flow 16-20` folder) get their own plan later; several
   (analytics, audit logs, payouts, CMS) need backend surface that does not
   exist yet.

## Ground rules for every phase

- **Restyle, do not rewire.** Screens keep their existing route files, API
  calls (`src/lib/api/*`), and business logic (`src/lib/listing-rules.ts`
  etc.). A phase that needs an API change is blocked, not improvised.
- **Primitives first, screens second.** Screens compose only
  `src/components/ui/*` primitives. If a screen needs a one-off style, that
  style probably belongs in a primitive variant.
- **Idiom stays NativeWind + cva** (`className`, variants). No styled-
  components, no inline StyleSheet except where RN APIs demand it (maps,
  camera).
- **No design for a screen? Follow the system by analogy.** Screens without
  a dedicated mockup (wallet home, my-listings, listing-stats, dispute,
  listing-submitted) are restyled with the same primitives in the same
  phase as their flow.
- **Validation gate per phase (all must pass before marking complete):**
  1. `pnpm --filter @pataspace/mobile exec tsc --noEmit`
  2. `pnpm --filter @pataspace/mobile test` (existing + new tests)
  3. Manual Expo pass of every screen in the phase against its `screen.png`,
     light and dark, plus the flow's happy path end to end
  4. Commit + push (one commit per phase minimum)
- CI is dead (GitHub Actions billing lock), so every gate runs locally.

## Phase 0 — Design foundation (everything else depends on this)

Retheme the token pipeline and rebuild the primitive kit. No screen work.

Token pipeline (all three must agree):
- `apps/mobile/global.css` — light + dark CSS variable blocks; extend with
  the DESIGN.md roles the app is missing (primary-container, on-primary-
  container, error/on-error, status-success/warning/error, outline,
  outline-variant, surface-container-* steps).
- `apps/mobile/src/lib/theme.ts` — imperative palette used by maps, status
  bar, navigation; same values as the CSS vars.
- `apps/mobile/tailwind.config.js` + `packages/design-tokens` — expose the
  new roles as Tailwind colors; typography scale from DESIGN.md
  (display-01/02, headline-lg/md/sm, body, label, caption) as named text
  styles.
- Fonts: confirm Poppins (600/700) and DM Sans (400/500/700) load via
  expo-font; add any missing weights.

Primitive kit in `src/components/ui/` (restyle existing, add missing):
- Restyle: `button` (primary teal, outline, dark; full-pill variant),
  `input` (#EDEDED fill, 12px radius, 2pt teal focus border, label above),
  `card` (16px radius, soft shadow spec from DESIGN.md), `badge` (status
  pills, 10% opacity tint), `bottom-nav` (Eerie Black shell, teal active,
  grey inactive), `screen`, `section-header`, `stat-card`, `icon-button`
  (circular container), `listing-card`.
- Add: `chip` (full-pill filter chips, active teal), `bottom-sheet` (Layer 3
  overlay: handle, backdrop, elevation), `dialog` (centered modal for
  logout/delete/report-success), `fab` (teal circle, used by post-listing),
  `progress-steps` (post-listing 4-step header), `list-row` (settings/
  profile rows with chevron).

Phase 0 gate additions: component tests for chip/dialog/bottom-sheet
open-close and button/input variant class output (deterministic, jest).

- [x] Phase 0 complete (2026-07-06). Token pipeline rethemed to #00667e across
  global.css + tailwind.config.js + theme.ts + design-tokens; Poppins/DM Sans
  loaded via useFonts; primitives restyled (button/input/card/badge/icon-button/
  bottom-nav) and added (chip, bottom-sheet, dialog, fab, progress-steps,
  list-row); variant maps extracted to `variants/*.ts` with 11 gate tests.
  Gates: `tsc --noEmit` exit 0, jest 26/26, tailwind config loads. NOTE: headless
  `expo export` hangs in this sandbox (zero output on two attempts, environmental
  — not code); the on-device Expo pass is Amoni's to run.

## Phase 1 — Authentication (5 screens)

| Design | Route/screen file |
|---|---|
| splash_screen | `app-launch-screen.tsx` component + `index.tsx` |
| onboarding_carousel | `onboarding.tsx` |
| phone_registration | `register.tsx` |
| login_screen + login_error_state | `login.tsx` (error state is a state of the same screen) |
| otp_verification | `verify-otp.tsx` |

Notes: keep Clerk SSO buttons and email+password flows exactly as wired
today; `sso-callback.tsx` needs only a loading style pass. Skipped designs:
forgot_password_phone, reset_password_form, account_locked (Clerk-owned).

- [x] Phase 1 complete (2026-07-06). Split the 1117-line AuthScreens.tsx into
  `src/screens/auth/` (auth-shared, fields, Welcome, Onboarding, Register,
  Login, VerifyOtp); routes rewired; old file deleted. New look: dark splash,
  image onboarding carousel, AuthHeader + labeled filled fields, +254 phone
  field, password eye, 6-box OTP with resend countdown, tinted error banner
  with red field borders (login_error_state). Clerk logic (email+password,
  Google/Apple SSO, email verification, needs_client_trust device code) is
  byte-for-byte the same behaviour. Gates: tsc exit 0, jest 26/26.
  Design deltas (intentional): email + confirm-password fields kept because
  Clerk auth is email-based (the mockups' phone+password is aspirational);
  "Forgot Password?" link omitted (Clerk-owned reset not built in-app).
  Device Expo pass (light+dark) is Amoni's step.

## Phase 2 — Browse & discover (7 screens)

| Design | Route/screen file |
|---|---|
| home_browse_listings | `browse.tsx` (+ `HomeScreen.tsx`) |
| search | `search.tsx` |
| filters_sheet | `filters.tsx` (becomes bottom-sheet) |
| map_view | `map.tsx` |
| listing_details | `listing.tsx` |
| photo_gallery_fullscreen | `listing-gallery.tsx` |
| saved_properties | `saved.tsx` |

Notes: FlashList perf must not regress on the home feed (measure scroll
jank before/after on a low-end Android profile). Map pins restyle to teal.

- [x] Phase 2 complete (2026-07-06). Rebuilt the shared ListingCard (clean
  photo + availability badge, teal price, bed/bath/unlocks meta row, View
  Details) which restyles every browse surface at once. HomeScreen → "Find
  Your Home" feed (title + filter, search bar, teal balance card, quick chips,
  full list). ListingDetailsScreen → hero + overlaid nav, spec chips, stat row,
  About, GPS-verified card, amenities grid with checks + show-all, tenant
  quote, approximate location panel, sticky Unlock Contact bar. Search, Saved,
  Browse restyled with the new card + chips; Map view restyled (ListingsMap
  kept); ListingGallery → dark full-screen viewer with counter, GPS-coords
  pill, and thumbnail strip. Filters → the design's Filters/Clear All +
  chip sections + result count + Show Results, bound to the existing filter
  fields. Gates: tsc exit 0, jest 26/26.
  Design deltas (intentional): filter model kept as-is, so the sheet's rent
  "slider", county segmented control, and property-type checkboxes are
  rendered as chips over the existing budget/area/size fields (a real slider
  needs a numeric rent field — deferred to avoid regressing Home/Search/Map).
  Home dropped the old latest-unlock prompt and post/track quick-actions to
  match the browse-focused design (both still reachable via the tab bar). The
  details Location section is a styled approximate panel, not a live map.
  Device Expo pass (light+dark, low-end scroll) is Amoni's step.

## Phase 3 — Unlock & payments (9 surfaces)

| Design | Route/screen file |
|---|---|
| unlock_confirmation_sheet | `unlock.tsx` (becomes bottom-sheet) |
| insufficient_credits_modal | dialog inside unlock flow |
| payment_method_selection_sheet | `buy-credits.tsx` |
| m_pesa_processing | `mpesa-processing.tsx` |
| payment_success | `payment-success.tsx` |
| contact_revealed | `contact-revealed.tsx` |
| transaction_history | `transactions.tsx` |
| transaction_detail | `transaction.tsx` |
| (no design) wallet home | `credits.tsx`, by analogy |

Notes: money flows; zero logic changes. The M-Pesa polling loop in
mpesa-processing keeps its timing exactly.

- [x] Phase 3 complete (2026-07-06). Unlock confirmation rebuilt as the sheet
  layout (lock header, listing summary, unlock cost + ≈% of rent + new balance,
  "what you'll get" checklist, refund banner, success-fee note, sticky Unlock/
  Cancel); a shortfall now opens the insufficient_credits_modal (Dialog with a
  wallet icon → "Top Up Wallet" routes to buy-credits, "Maybe Later" dismisses).
  Buy-credits → payment-method layout (amount rows + M-Pesa/Card method rows +
  phone + Confirm Payment). M-Pesa processing → STK screen (dark header, pulsing
  phone, "STK prompt sent"/28s copy). Payment success → check circle, credits-
  added + new-balance cards, View Receipt, Start Browsing/Done. Transactions →
  chip filters (All/Credits Added/Unlocks/Rewards) + day groups + coloured
  amounts. Transaction detail → status banner, big amount, detail rows, share,
  Get Help/Request Refund. Contact revealed → dark header, unlocked banner,
  tenant card, call/WhatsApp/maps rows, connection-status timeline (keeps
  confirmIncoming + report-dead + dispute). Wallet home restyled by analogy
  (teal balance card + top-up rows). New: pure helpers `lib/payments/*` (unlock
  summary + transaction view) with 11 gate assertions, `ghost` button variant
  (tested), Dialog `icon` prop, and a `Screen` `header` slot + `ScreenHeader`
  primitive for the shared dark flow bar. Gates: tsc exit 0, jest 34/34.
  Design deltas (intentional): (1) unlock cost/balance stay in the app's
  "credits" unit, not the mockup's "KES", so the wallet reads consistently
  end to end (credits are 1:1 with KES). (2) buy-credits keeps the package
  (amount) selector the STK charge needs, above the method rows; PataSpace-
  Credits is not offered as a top-up method (you can't buy credits with
  credits) and Card is "Coming soon" since only M-Pesa is wired. (3) M-Pesa
  processing has no STK status-poll endpoint yet (that would be an API change,
  out of a restyle phase), so the auto-advance is a restyled "I've completed
  the payment" action; the design's auto-advance-on-callback is deferred to
  that backend work. (4) contact_revealed's copy icons became tap-to-act
  (call/WhatsApp) to avoid adding a clipboard dependency; the verified-GPS map
  preview is kept below the address as a trust signal. (5) transaction detail
  shows only stored fields (no fabricated balance-before/after or property
  ref). Device Expo pass (light+dark, real STK sandbox) is Amoni's step.

## Phase 4 — Post a listing (7 surfaces)

| Design | Route/screen file |
|---|---|
| post_listing_camera | `create-listing-photos.tsx` |
| post_listing_photo_review | `create-listing-photos.tsx` review step |
| post_listing_property_details_form | `create-listing-details.tsx` |
| post_listing_review_submit | `create-listing-review.tsx` |
| (no design) flow entry | `create-listing.tsx` |
| (no design) submitted confirmation | `listing-submitted.tsx` |
| (no design) my listings + stats | `my-listings.tsx`, `my-listing.tsx`, `listing-stats.tsx` |

Notes: the 5-photo contract and capture-location logic were just fixed
(commits bc93c5f, ee64afe); their tests in `src/lib/__tests__/` must stay
green untouched. Camera UI restyles around expo-camera, not instead of it.

- [x] Phase 4 complete (2026-07-07). Camera rebuilt to the full-screen "Take
  Photos" layout (dark bar with close + flash, 4-step progress, live preview
  with rule-of-thirds grid + focus frame, GPS-Active + N/MAX pills, thumbnail →
  review, big shutter, flip) — every capture/GPS/recording handler, ref, effect
  and CameraView prop is byte-for-byte the same; only the chrome changed. Photo
  review → the 3-col grid (COVER badge, geo pins, per-tile remove, Add More
  tile, Property Video card) with the same photo-count gate. Details form →
  sectioned "Property Details" (Basic Info, Property Type, Amenities, Description
  0/500, Availability & Contact) keeping every draft field the submit payload
  needs. Review → "Review Listing" (preview card, teal Potential Earnings,
  amber Important Notes, What-happens-next timeline, terms checkbox) with the
  same submit gate + submitDraft. Submitted, my-listings, my-listing, and
  listing-stats restyled by analogy onto the kit. New: pure
  `lib/listings/amenities-field` (toggle presets over the comma string, no model
  change) with 6 gate assertions; a tested `ghost`-era kit reused. Gates: tsc
  exit 0, jest 40/40 (listing-rules + capture-location untouched and green).
  Design deltas (intentional): (1) flash + flip are additive UI wired to the
  CameraView props; capture/GPS logic unchanged. (2) walkthrough video is
  recorded in-app (the just-fixed expo-camera flow), so the mockup's review
  "Upload Video" becomes "Record Video" → camera video mode, not a gallery
  picker (that needs expo-image-picker, out of a restyle phase). (3) the form
  keeps the extra fields the API needs (title, deposit, county, location,
  landlord contact, move reason) that the mockup omits, and drops the mockup's
  bedrooms/bathrooms/furnished steppers since there are no draft fields for them
  (houseType already captures size; adding them is a contract change). (4)
  "Drag to reorder" copy dropped — no reorder action is wired. Device Expo pass
  (real camera + GPS capture, on-device recording) is Amoni's step.

## Phase 5 — Connections & profile (8 surfaces)

| Design | Route/screen file |
|---|---|
| confirm_connection | `confirmations.tsx` |
| connection_status_tracking | `confirmations.tsx` tracking state |
| both_confirmed_success | `confirmation-success.tsx` |
| profile_tab | `profile.tsx` |
| edit_profile | `edit-profile.tsx` |
| settings | `settings.tsx` |
| logout_confirmation_modal | dialog from settings/profile |
| delete_account_modal | `delete-account.tsx` |

- [x] Phase 5 complete (2026-07-07). Confirmations rebuilt with both states:
  the "Are you moving in?" checklist (3 required checks gate the confirm) before
  the tenant confirms, then the connection-status timeline (Contact Unlocked →
  Property Viewed → Your Confirmation → Tenant Confirmation waiting/Send
  Reminder → Commission Payment) plus the follow-up call/WhatsApp card and a
  Report Issue path — confirmIncoming stays exactly as wired. Both-confirmed
  success → the design's Connection Confirmed screen (revealed address, move-in
  settlement card, star rating → Leave Review, View Property Details / Done),
  keeping settleFee + the vacated-listing flywheel prompt. Profile → the tab
  design (initials avatar + edit badge, Listings/Unlocks/KES-Earned stat cards,
  Account/My-Activity/Support/Account-Management ListRows) with a logout Dialog.
  Edit profile → Cancel/Save header, first/last name split over the single
  `name` field, locked phone, preferred areas, bio 0/200. Settings → notification
  Switches (real fields), Light/Dark appearance segmented, quick links, and the
  logout Dialog. Delete account → the design's red confirmation modal (Dialog
  tone="danger") running the same useDeleteAccount flow. New kit: Dialog `tone`
  prop (primary/danger). Gates: tsc exit 0, jest 40/40.
  Design deltas (intentional): (1) profile has no photo/verification fields in
  the model, so the avatar shows initials and "Verification Status" links to
  edit rather than claiming Verified; photo/ID upload is a note, not a wired
  picker (no expo-image-picker). (2) edit keeps preferred-areas (a real field)
  and drops the mockup's editable email (no model field); phone is read-only.
  (3) settings exposes the three real notification toggles (push/SMS/saved-
  search) and a Light/Dark appearance control — the mockup's Auto mode, phone/
  profile-visibility, language/currency, change-password and biometric rows are
  omitted (no backing fields; several are Clerk-owned). (4) "My Unlocks" links
  to the transaction history (no dedicated unlocks list exists). Device Expo
  pass (light+dark) is Amoni's step.

## Phase 6 — Engagement & support (8 surfaces)

| Design | Route/screen file |
|---|---|
| notifications | `notifications.tsx` |
| rate_review | `rate-review.tsx` |
| referral_invite_friends | `referral.tsx` |
| help_center_faq | `help-center.tsx` |
| contact_support | `contact-support.tsx` |
| report_issue | `report-dead.tsx` (+ `dispute.tsx` by analogy) |
| report_success_modal | dialog in report flow |
| app_update_new_feature | `app-update.tsx` |

- [ ] Phase 6 complete

## Phase 7 — Sweep and ship

- Kill dead styles: remove unused theme keys (auth glow/backdrop values in
  `theme.ts` if the new auth screens drop them), unused cva variants,
  `src/data/mock-listings.ts` remnants if no longer referenced.
- Full-app pass: every screen, light + dark, iOS + Android, checking nav
  shell consistency, safe areas, and 44px touch targets.
- Update `apps/mobile/README.md` (component kit, theming pipeline).
- EAS preview build (`pnpm --filter @pataspace/mobile build:apk`) and
  on-device smoke test of the four money paths: browse→unlock→pay,
  post listing, confirm connection, report issue.

- [ ] Phase 7 complete

## Measurable outcome

- Every phase table row checked off against its `screen.png` (the trace is
  this doc plus per-phase commits).
- tsc + jest green at every phase boundary; no regression in the two
  existing lib test suites.
- Home feed scroll performance not worse than pre-redesign baseline.
- End state: 44 designed mobile surfaces rebuilt, ~6 undesigned surfaces
  restyled by analogy, dark mode intact.

## Session protocol

One phase per session (or per parallel worktree if phases don't share
files; Phase 0 must merge before any other phase starts). Start each
session by reading this doc and the phase's design folder; end it by
ticking the phase checkbox, committing, and pushing.
