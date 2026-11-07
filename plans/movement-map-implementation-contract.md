# Movement map: implementation contract + handoff

> Re-read this entire file after compaction. Update status honestly. Do not declare the first milestone complete while the open gates below remain.

## Product (confirmed by owner)
- Target `/home/sky/endabortionga`; reuse `/home/sky/ga-gms-map`, not its Java backend.
- **Homepage opens to interactive six-region map + participation rankings** on mobile/desktop. Map/backend is the priority, not a secondary atlas.
- Display regions ONLY. House districts (1–180) are internal association keys.
- Exactly two named states: **Unengaged / Engaged**, with multiple RMI color bands for Engaged. No invented activity.
- Independent organization, **not Operation Gospel**. Reuse the warm visual language, never its identity, payment campaign, email, tax or certification claims.
- Tiny gold seed for Pine Forest Baptist Church, Macon; second seed church TBD. Current marker location is APPROXIMATE, requires owner confirmation.

## Identity / privacy / immutable attribution
- User registers email; district number is the private default. No address required.
- Four independent opt-ins, all off initially: giving needs, prayer needs, legislative action, events.
- Optional address lookup MUST be entirely on-device. No remote geocoder, address in URLs/logs/analytics, or ZIP-as-exact-district approximation.
- **Street lookup is currently disabled** pending a real offline address index. Local point-in-polygon utility exists; do not pretend it geocodes addresses.
- Server derives region from district, ignoring client-supplied region.
- User may change district at any time. Close old assignment, retain history. Past donations/actions stay attributed to the district/region active when recorded or checkout was prepared.
- Public APIs publish regional aggregates only, not donor emails/individual gifts. No income/demographic profiles on accounts.

## Participation / RMI
- RMI denominator: population × (estimated regional income / estimated statewide income).
- Current explicit DEVELOPMENT weighting: $100 giving = one participation unit; per-100,000 capacity scale. Owner approval/calibration pending.
- Income/population in `region-metrics.ts` are generated county-derived upstream estimates, NOT direct district ACS medians.
- Self-reported actions are deduplicated by user/type/day. People count is unique per region. Live totals refresh every 30s and after recording an action.
- Geographic-v2 region mapping covers all 180 exactly once. Shared-boundary adjacency growth replaces fragmented number-range groups. Current sizes: 34/33/34/28/25/26, all within the 25–35 coordinator range; every region passes connectivity validation. Owner review of final regional boundaries remains open.

## Payment / security boundaries
- Hosted Givebutter checkout only; app never handles card/bank details.
- Opaque attribution token freezes user/district/region at checkout creation.
- **Native Givebutter webhook integration NOT verified.** `signed-bridge-v1` is OUR explicit normalized protocol, not Givebutter's signature scheme.
- Bridge requires HMAC of timestamp + raw body, 5-minute freshness, idempotent event receipt, integer USD cents, atomic ledger + audit, partial-refund reconciliation to original region.
- Live checkout fails closed until campaign, bridge secret/mode, and `GIVEBUTTER_ATTRIBUTION_VERIFIED=true` are configured after real end-to-end verification. No live money moved.
- Roles: member / campaign_editor / finance / admin. Content and finance routes enforce roles + CSRF server-side; admin is an oversight role.
- >$1,000 disbursement approval requires distinct finance authorizer. These are internal approval records, NOT executed bank payouts or verified Givebutter RBAC.
- Argon2 passwords; hashed opaque sessions; HttpOnly/SameSite cookies; expiry/revocation; same-origin + CSRF checks; noncached private APIs; adapter-derived client address rate limiting.
- Audit table rejects edits/deletes (permits actor anonymization on account deletion). Not an externally immutable accounting system.
- Account export/deletion implemented; donation accounting aggregates preserved without user association. Privileged finance-record retention still needs policy review.
- Communication audiences require explicit opt-in, verified email, and no suppression. Email verification/delivery integration still pending; do not send campaigns to unverified registrations.

## Runtime / data
- Current movement backend uses persistent **SQLite via better-sqlite3**; default local `.data/movement-map.sqlite`. This is a deliberate local-development implementation, NOT Neon support.
- Production requires explicit private persistent `DATABASE_PATH`. SQLite files ignored; chmod 0600. Single-process local rate limiter needs shared replacement for multi-instance deployment.
- PostgreSQL `migrations/002_movement_accounts.sql` is a REFERENCE for future adapter, not an active migration. Legacy volunteers API still uses Neon separately.
- Unit DB tests use isolated `:memory:` databases and close between tests. Never run tests against local/production account databases.
- Initial reused geometry from ga-gms-map commit `b14e91a3cb147b73e942826e2bd43a74da995118`.
- Region geometry is dissolved from raw TIGER before simplification; clockwise rings for D3; no district seams. Source snapshot is 2025 TIGER with upstream 2024 session label.
- `scripts/refresh-census.mjs` + weekly GH workflow fetch official latest available TIGER, validate 180 IDs, dissolve six regions, and open a **draft PR against dev**, never auto-deploy production.
- Automatic review/publication still requires boundary-effective-date, ACS-vintage and account-history version migration decisions. Election results do not themselves change geometry.

## Current implementation checklist
- [x] Six-region config, full coverage validation, raw TIGER dissolution and correct projection.
- [x] Map-only landing page, keyboard selection, responsive ranks, charcoal-hatched Unengaged regions, Engaged band ramp, seed icon. Connect and Give are separate screens; aggregate privacy note sits below participation.
- [x] Promotional hero/RMI prose removed. Optional technical/preview UI requires explicit PUBLIC_* flags; PUBLIC_SITE_ENV=prd/production forces them off.
- [x] Aggregate API, polling/retry and completed-action UI.
- [x] Local persistent account backend, login/logout, direct district association/history, opt-ins.
- [x] Donation attribution, explicitly signed bridge test pipeline, refunds/idempotency tests.
- [x] Server role checks, CSRF, audit protections, dual-approval logic, export/delete.
- [x] Official-data refresh script/workflow written (external fetch/workflow execution not yet verified).
- [ ] Verify native Givebutter event authenticity, hosted attribution round-trip, provider payloads/refunds, actual account permissions. Need credentials + trusted bridge implementation or verified native adapter.
- [ ] Ship real offline street index/worker resolver; keep address UI disabled until then.
- [ ] Implement verified email delivery + unsubscribe tokens; currently preferences/suppression storage only.
- [ ] Confirm provisional region assignments, RMI units/bands and seed coordinates with owner.
- [ ] Version assignments/events across redistricting before automatic publication.
- [ ] Complete deployment/retention/shared-rate-limit review; never call local scaffolding production-ready.
- [x] Check/build/full browser suite + desktop/mobile visual review for this local pass. Repeat after further changes.

## Verification / localhost
- Dev server: http://localhost:5173/ ; dedicated map: `/georgia-map`; account: `/connect` (`/join` retained); giving: `/support`.
- Log `/tmp/endabortionga-dev.log`. Do not stop it without restarting.
- Latest: `npm run check` clean (0 errors/warnings), production build passes, 58 unit tests and all 22 consolidated browser tests pass (single worker). Browser tests now use a dedicated port 5174 server with an isolated in-memory DB; never reuse localhost account records.
- Production-built server/API smoke-tested with private temporary SQLite and production debug flags deliberately enabled: no debug/preview UI, no browser errors/overflow at 390px/1280px. Debug flags are tested to fail closed in production.
- CI now blocks on typecheck, unit tests, contiguous region validation, build, and SQLite aggregate API smoke. Release dependency install runs native-addon build scripts for better-sqlite3.
- Host config snapshot adds private /var/lib/eag-preview persistent SQLite state. It must be applied on the host separately; a GitHub source push does not apply Nix/systemd changes.
- Verified account registration/opt-ins/history, invalid-district atomicity, CSRF, member access denial, export/delete, event deduplication, refund accounting and isolated unit DBs.
- Visual checks: six contiguous, readable region shapes without district seams; charcoal hatching, seed alignment and no horizontal overflow at 390px/1280px. RMI weighting remains provisional and documented here, not promotional public-map copy.
- Operational instructions / bridge payload / bootstrap: `plans/movement-map-operations.md`; environment template `.env.example`.
- Existing educational routes were adapted during earlier work; some still contain legacy branding/content. Audit/remove legacy payment/email destinations before public launch. Main account/giving flow must never fall back to them.
- Owner requested an SSH push to dev. Current branch is dev, tracking origin/dev. Commit/push this local milestone only to dev; never directly to prd. Verify remote commit after pushing. No production promotion authorized.
