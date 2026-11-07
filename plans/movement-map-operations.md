# Movement map: local operations

## Run / verify

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
npm run check
npx vitest run
npx playwright test --workers=1
npm run build
```

- Homepage: http://localhost:5173/ — six regions and participation rankings only.
- `/connect` is the separate minimal account screen; `/join` remains compatible.
- Browser tests launch their own port 5174 server with an in-memory DB and production display flags. They never reuse the local account DB.
- `/support` uses independent hosted-checkout configuration, not the imported Donorbox campaign.
- Local process log: `/tmp/endabortionga-dev.log`.
- Account data persists in `.data/movement-map.sqlite` (ignored by git).
- Unit DB tests are isolated in memory. Browser tests create `@example.test` accounts on the dev server.
- Do not use real financial/customer records in this local preview.

## Production gates

This is a local implementation, not a claim of production readiness. Set an absolute private
`DATABASE_PATH` before starting the production server, back it up with SQLite-aware tooling, and
run one application process unless rate limiting/database concurrency is reviewed for scaling.
The movement APIs do **not** read Neon `DATABASE_URL`. That belongs to the old volunteers API.
`migrations/002_movement_accounts.sql` is a future Postgres reference schema only.

Register an account normally, then bootstrap its role locally:

```sh
DATABASE_PATH=/private/movement.sqlite node scripts/set-account-role.mjs USER_UUID admin
```

Other roles: `campaign_editor`, `finance`, `member`. The operation writes an audit event.
Content editors cannot use finance endpoints; finance cannot edit campaign content. Admin has
oversight access. Disbursement records are **approvals only**; no bank withdrawals are executed.

## Public display controls

Clean UI is the default. Set `PUBLIC_SITE_ENV=dev` and explicitly opt into
`PUBLIC_SHOW_MAP_DEBUG=true` or `PUBLIC_SHOW_PREVIEW_LABELS=true` for diagnostics.
`PUBLIC_SITE_ENV=prd` or `production` forces both off, even if their flags are true.
Omitting the site environment also fails closed. No promotional hero or RMI explanation
is included in the normal public map. Unconfigured giving shows only that giving is unavailable.

`deploy/eag-cicd.nix` includes `DATABASE_PATH=/var/lib/eag-preview/movement.sqlite` and
private systemd `StateDirectory` settings. Apply these on the host separately before using
movement accounts there: uploading a GitHub artifact does not change the host unit. Keep
SQLite outside release directories so deployment/rollback cannot erase registrations.

## Donation ingestion (explicit bridge protocol)

Native Givebutter webhook signatures/payloads and attribution have **not** been verified. Do not
point a native provider webhook at `/api/donations/webhook` and assume it works.

A trusted bridge must authenticate/retrieve Givebutter transactions, verify their campaign,
extract the opaque checkout attribution, normalize USD principal/refunds, then send:

```json
{
  "id": "provider_event_123",
  "transactionId": "provider_transaction_123",
  "event": "transaction.succeeded",
  "amountCents": 2500,
  "currency": "USD",
  "attributionToken": "opaque-token-from-our-attribution-endpoint"
}
```

Only `transaction.succeeded` and `refund.created` are accepted. Refund amounts are positive cents;
the ledger deducts them from the ORIGINAL transaction's region. Event IDs are idempotent and
refunds exceeding the captured principal are rejected. Receipts, ledger and audit commit atomically.

Headers:
- `x-movement-timestamp`: Unix seconds, within five minutes.
- `x-movement-signature`: hex HMAC-SHA256 of `timestamp + "." + exactRawJsonBody`.

Set `DONATION_INGESTION_MODE=signed-bridge-v1` and a strong server-only `DONATION_BRIDGE_SECRET`
to enable ingestion. Live checkout additionally requires `GIVEBUTTER_CAMPAIGN_CODE` and
`GIVEBUTTER_ATTRIBUTION_VERIFIED=true`, which must be set only after a real attributed gift/refund
round-trip is tested. That boolean is an operator attestation, not automated verification.
Unconfigured checkout remains disabled; creating an attribution token does not charge anyone.
Givebutter can collect billing details independently; the movement app never receives card/bank data.

## Region / geography refresh

- Runtime/server membership: `src/lib/config/regions.ts` reads `region-membership.json` (all 180 IDs).
- Geographic-v2 replaces detached number-range groups with shared-boundary contiguity and coordinator workload balancing: 34/33/34/28/25/26 districts. Connectivity is checked in unit tests and the validation script; owner review remains required.
- `scripts/generate-contiguous-regions.mjs` regenerates membership from raw shared TIGER edges. Rebuild both geometry and income/population metrics after membership changes.
- Do not silently remap existing account/event history. The account screen can explicitly re-save a district whose region changed; old attribution stays frozen.
- Rebuild the current snapshot using raw shared TIGER topology:

```sh
node scripts/build-regions.mjs ../ga-gms-map/data/districts.json ../ga-gms-map/data/raw/tl_2025_13_sldl.shp
node scripts/build-region-metrics.mjs
npm run data:validate-regions
```

- `scripts/refresh-census.mjs` downloads the latest available official annual Georgia TIGER release,
  validates/dissolves it, then stages snapshot changes. Requires `unzip`.
- `.github/workflows/data-refresh.yml` runs weekly and proposes a **draft dev PR**. No automatic
  production promotion. External Census fetch and hosted workflow still need an execution check.
- Review effective dates and ACS vintage compatibility. Existing account assignments cannot be
  geographically remapped without their address (which we deliberately do not keep). Flag changed
  boundaries and ask users to re-confirm their district; preserve historical attribution/version.

## Still needed

- Real offline street-address dataset, licensed/indexed for browser/worker lookup; current address
  entry is disabled rather than sending addresses elsewhere or guessing from ZIP centroids.
- Email ownership verification, delivery provider and one-click unsubscribe tokens. Stored opt-ins
  and global suppression exist; audience export excludes unverified addresses.
- Native provider adapter or trusted bridge implementation + actual payment/finance account testing.
- Boundary-version migration, final regional assignments, verified seed coordinates, RMI calibration.
- QuickBooks integration, actual payout-provider dual approval, and verified legal/financial disclosures.
