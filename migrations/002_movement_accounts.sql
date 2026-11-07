-- PostgreSQL REFERENCE schema for a future database adapter; not executed by the current app.
-- Current runtime is persistent SQLite (DATABASE_PATH), with schema initialization in db.ts.
-- Do not configure DATABASE_URL expecting these movement APIs to use it.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member'
        CHECK (role IN ('member', 'campaign_editor', 'finance', 'admin')),
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS district_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    district_id INTEGER NOT NULL CHECK (district_id BETWEEN 1 AND 180),
    region_id TEXT NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON district_assignments(user_id, assigned_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_one_current
    ON district_assignments(user_id) WHERE is_current;

CREATE TABLE IF NOT EXISTS communication_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    giving_needs BOOLEAN NOT NULL DEFAULT FALSE,
    prayer_needs BOOLEAN NOT NULL DEFAULT FALSE,
    legislative_action BOOLEAN NOT NULL DEFAULT FALSE,
    events BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participation_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region_id TEXT NOT NULL,
    district_id INTEGER NOT NULL CHECK (district_id BETWEEN 1 AND 180),
    kind TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_participation_region ON participation_events(region_id, occurred_at);

CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    region_id TEXT NOT NULL,
    district_id INTEGER CHECK (district_id BETWEEN 1 AND 180),
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_donations_region ON donations(region_id, received_at);

CREATE TABLE IF NOT EXISTS donation_receipts (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    event TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donation_attributions (
    token_hash TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region_id TEXT NOT NULL,
    district_id INTEGER NOT NULL CHECK (district_id BETWEEN 1 AND 180),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_suppressions (
    email CITEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_content (
    region_id TEXT PRIMARY KEY,
    headline TEXT NOT NULL,
    body TEXT NOT NULL,
    action_label TEXT NOT NULL,
    action_href TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    reason TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id, created_at);

-- The audit trail is append-only to application accounts.
REVOKE UPDATE, DELETE ON audit_events FROM PUBLIC;
