import Database from 'better-sqlite3';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';
import { hash } from '@node-rs/argon2';

export type Role = 'member' | 'campaign_editor' | 'finance' | 'admin';

export const ROLE_VALUES: readonly Role[] = [
	'member',
	'campaign_editor',
	'finance',
	'admin'
] as const;

export interface User {
	id: string;
	email: string;
	password_hash: string;
	role: Role;
	email_verified_at: string | null;
	created_at: string;
}

export interface DistrictAssignment {
	id: number;
	user_id: string;
	district_id: number;
	region_id: string;
	is_current: boolean;
	assigned_at: string;
	ended_at: string | null;
}

export interface DistrictAssignmentRow {
	id: number;
	user_id: string;
	district_id: number;
	region_id: string;
	is_current: number;
	assigned_at: string;
	ended_at: string | null;
}

export interface CommunicationPreferences {
	user_id: string;
	giving_needs: boolean;
	prayer_needs: boolean;
	legislative_action: boolean;
	events: boolean;
	updated_at: string;
}

interface CommunicationPreferenceRow {
	user_id: string;
	giving_needs: number;
	prayer_needs: number;
	legislative_action: number;
	events: number;
	updated_at: string;
}

export interface ParticipationEvent {
	id: number;
	user_id: string;
	region_id: string;
	district_id: number;
	kind: string;
	amount_cents: number;
	occurred_at: string;
}

export interface Donation {
	id: string;
	provider: string;
	provider_event_id: string;
	user_id: string | null;
	region_id: string;
	district_id: number | null;
	amount_cents: number;
	currency: string;
	status: string;
	received_at: string;
}

export interface AuditEvent {
	id: number;
	actor_user_id: string | null;
	action: string;
	entity_type: string;
	entity_id: string;
	details_json: string;
	created_at: string;
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','campaign_editor','finance','admin')),
 email_verified_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf_token TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS district_assignments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 district_id INTEGER NOT NULL CHECK (district_id BETWEEN 1 AND 180),
 region_id TEXT NOT NULL,
 is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0,1)),
 assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 ended_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON district_assignments(user_id, assigned_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_one_current ON district_assignments(user_id) WHERE is_current = 1;
CREATE TABLE IF NOT EXISTS communication_preferences (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 giving_needs INTEGER NOT NULL DEFAULT 0,
 prayer_needs INTEGER NOT NULL DEFAULT 0,
 legislative_action INTEGER NOT NULL DEFAULT 0,
 events INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS participation_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 region_id TEXT NOT NULL,
 district_id INTEGER NOT NULL CHECK (district_id BETWEEN 1 AND 180),
 kind TEXT NOT NULL,
 amount_cents INTEGER NOT NULL DEFAULT 0,
 occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_participation_region ON participation_events(region_id, occurred_at);
CREATE TABLE IF NOT EXISTS donations (
 id TEXT PRIMARY KEY,
 provider TEXT NOT NULL,
 provider_event_id TEXT NOT NULL,
 user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
 region_id TEXT NOT NULL,
 district_id INTEGER CHECK (district_id BETWEEN 1 AND 180),
 amount_cents INTEGER NOT NULL,
 currency TEXT NOT NULL DEFAULT 'USD',
 status TEXT NOT NULL,
 received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_donations_region ON donations(region_id, received_at);
CREATE TABLE IF NOT EXISTS donation_receipts (
 id TEXT PRIMARY KEY,
 transaction_id TEXT NOT NULL,
 event TEXT NOT NULL,
 amount_cents INTEGER NOT NULL,
 received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS donation_attributions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 region_id TEXT NOT NULL,
 district_id INTEGER NOT NULL CHECK (district_id BETWEEN 1 AND 180),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS communication_suppressions (
 email TEXT PRIMARY KEY COLLATE NOCASE,
 reason TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS campaign_content (
 region_id TEXT PRIMARY KEY,
 headline TEXT NOT NULL,
 body TEXT NOT NULL,
 action_label TEXT NOT NULL,
 action_href TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS disbursements (
 id TEXT PRIMARY KEY,
 amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
 reason TEXT NOT NULL,
 requested_by TEXT NOT NULL REFERENCES users(id),
 approved_by TEXT REFERENCES users(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
 requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 decided_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
 action TEXT NOT NULL,
 entity_type TEXT NOT NULL,
 entity_id TEXT NOT NULL,
 details_json TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id, created_at);
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_events
BEGIN SELECT RAISE(ABORT, 'Audit events cannot be deleted'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_edit BEFORE UPDATE ON audit_events
WHEN NOT (
 NEW.id IS OLD.id AND NEW.action IS OLD.action AND NEW.entity_type IS OLD.entity_type
 AND NEW.entity_id IS OLD.entity_id AND NEW.details_json IS OLD.details_json
 AND NEW.created_at IS OLD.created_at AND OLD.actor_user_id IS NOT NULL AND NEW.actor_user_id IS NULL
)
BEGIN SELECT RAISE(ABORT, 'Audit events cannot be edited'); END;
`;

let database: Database.Database | undefined;

export function getDatabase(): Database.Database {
	if (database) return database;
	if (process.env.NODE_ENV === 'production' && !env.DATABASE_PATH) {
		throw new Error('Set DATABASE_PATH to a persistent, private database before deployment.');
	}
	const path = env.DATABASE_PATH ?? '.data/movement-map.sqlite';
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
	database = new Database(path);
	if (path !== ':memory:') chmodSync(path, 0o600);
	database.exec(SCHEMA);
	return database;
}

export function closeDatabase(): void {
	database?.close();
	database = undefined;
}

export async function createUser(email: string, password: string): Promise<User> {
	const db = getDatabase();
	const normalized = email.trim().toLowerCase();
	const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, outputLen: 32 });
	const id = randomUUID();
	db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
		id,
		normalized,
		passwordHash
	);
	db.prepare('INSERT INTO communication_preferences (user_id) VALUES (?)').run(id);
	return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as User;
}

export function findUserByEmail(email: string): User | undefined {
	return getDatabase()
		.prepare('SELECT * FROM users WHERE email = ?')
		.get(email.trim().toLowerCase()) as unknown as User | undefined;
}

export function findUserById(id: string): User | undefined {
	return getDatabase().prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as
		| User
		| undefined;
}

export function createSession(userId: string, csrfToken: string, expiresAt: string): string {
	const token = randomUUID() + randomUUID();
	const tokenHash = hashToken(token);
	getDatabase()
		.prepare(
			'INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)'
		)
		.run(tokenHash, userId, csrfToken, expiresAt);
	return token;
}

export function getSession(token: string): { user: User; csrf_token: string } | undefined {
	const db = getDatabase();
	const row = db
		.prepare(
			`SELECT s.user_id, s.csrf_token, s.expires_at
			 FROM sessions s WHERE s.token_hash = ?`
		)
		.get(hashToken(token)) as
		| { user_id: string; csrf_token: string; expires_at: string }
		| undefined;
	if (!row || new Date(row.expires_at).getTime() <= Date.now()) return undefined;
	const user = findUserById(row.user_id);
	if (!user) return undefined;
	return { user, csrf_token: row.csrf_token };
}

export function deleteSession(token: string): void {
	getDatabase().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function updateDistrict(userId: string, districtId: number, regionId: string): void {
	const db = getDatabase();
	const now = new Date().toISOString();
	db.exec('BEGIN IMMEDIATE');
	try {
		db.prepare(
			`UPDATE district_assignments SET is_current = 0, ended_at = ?
			 WHERE user_id = ? AND is_current = 1`
		).run(now, userId);
		db.prepare(
			`INSERT INTO district_assignments (user_id, district_id, region_id, is_current)
			 VALUES (?, ?, ?, 1)`
		).run(userId, districtId, regionId);
		db.exec('COMMIT');
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}
}

export function currentAssignment(userId: string): DistrictAssignment | undefined {
	const row = getDatabase()
		.prepare(
			`SELECT * FROM district_assignments
			 WHERE user_id = ? AND is_current = 1`
		)
		.get(userId) as unknown as DistrictAssignmentRow | undefined;
	return row ? normalizeAssignment(row) : undefined;
}

export function assignmentHistory(userId: string): DistrictAssignment[] {
	return (
		getDatabase()
			.prepare(
				`SELECT * FROM district_assignments
				 WHERE user_id = ? ORDER BY id DESC`
			)
			.all(userId) as unknown as DistrictAssignmentRow[]
	).map(normalizeAssignment);
}

export function communicationPreferences(userId: string): CommunicationPreferences {
	const db = getDatabase();
	let row = db
		.prepare('SELECT * FROM communication_preferences WHERE user_id = ?')
		.get(userId) as unknown as CommunicationPreferenceRow | undefined;
	if (!row) {
		db.prepare('INSERT INTO communication_preferences (user_id) VALUES (?)').run(userId);
		row = db
			.prepare('SELECT * FROM communication_preferences WHERE user_id = ?')
			.get(userId) as unknown as CommunicationPreferenceRow;
	}
	return {
		user_id: row.user_id,
		giving_needs: Boolean(row.giving_needs),
		prayer_needs: Boolean(row.prayer_needs),
		legislative_action: Boolean(row.legislative_action),
		events: Boolean(row.events),
		updated_at: row.updated_at
	};
}

export function saveCommunicationPreferences(
	userId: string,
	preferences: Pick<
		CommunicationPreferences,
		'giving_needs' | 'prayer_needs' | 'legislative_action' | 'events'
	>
): CommunicationPreferences {
	const db = getDatabase();
	db.prepare(
		`INSERT INTO communication_preferences
		 (user_id, giving_needs, prayer_needs, legislative_action, events, updated_at)
		 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		 ON CONFLICT(user_id) DO UPDATE SET
		 giving_needs = excluded.giving_needs,
		 prayer_needs = excluded.prayer_needs,
		 legislative_action = excluded.legislative_action,
		 events = excluded.events,
		 updated_at = excluded.updated_at`
	).run(
		userId,
		Number(preferences.giving_needs),
		Number(preferences.prayer_needs),
		Number(preferences.legislative_action),
		Number(preferences.events)
	);
	return communicationPreferences(userId);
}

export function addParticipation(input: {
	userId: string;
	regionId: string;
	districtId: number;
	kind: string;
	amountCents?: number;
}): void {
	getDatabase()
		.prepare(
			`INSERT INTO participation_events
			 (user_id, region_id, district_id, kind, amount_cents)
			 SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (
			 SELECT 1 FROM participation_events WHERE user_id = ? AND kind = ?
			 AND occurred_at >= datetime('now', 'start of day'))`
		)
		.run(
			input.userId,
			input.regionId,
			input.districtId,
			input.kind,
			input.amountCents ?? 0,
			input.userId,
			input.kind
		);
}

export function recordDonation(input: {
	provider: string;
	providerEventId: string;
	userId?: string | null;
	regionId: string;
	districtId?: number | null;
	amountCents: number;
	currency?: string;
	status?: string;
}): void {
	getDatabase()
		.prepare(
			`INSERT INTO donations
			 (id, provider, provider_event_id, user_id, region_id, district_id,
			  amount_cents, currency, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			randomUUID(),
			input.provider,
			input.providerEventId,
			input.userId ?? null,
			input.regionId,
			input.districtId ?? null,
			input.amountCents,
			input.currency ?? 'USD',
			input.status ?? 'paid'
		);
}

export function createDonationAttribution(
	userId: string,
	regionId: string,
	districtId: number
): string {
	const token = randomUUID() + randomUUID();
	getDatabase()
		.prepare(
			`INSERT INTO donation_attributions
			 (token_hash, user_id, region_id, district_id) VALUES (?, ?, ?, ?)`
		)
		.run(hashToken(token), userId, regionId, districtId);
	return token;
}

export function resolveDonationAttribution(token: string):
	| {
			user_id: string;
			region_id: string;
			district_id: number;
	  }
	| undefined {
	return getDatabase()
		.prepare(
			'SELECT user_id, region_id, district_id FROM donation_attributions WHERE token_hash = ?'
		)
		.get(hashToken(token)) as
		| { user_id: string; region_id: string; district_id: number }
		| undefined;
}

export function audit(input: {
	actorUserId?: string | null;
	action: string;
	entityType: string;
	entityId: string;
	details?: Record<string, unknown>;
}): void {
	getDatabase()
		.prepare(
			`INSERT INTO audit_events
			 (actor_user_id, action, entity_type, entity_id, details_json)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.run(
			input.actorUserId ?? null,
			input.action,
			input.entityType,
			input.entityId,
			JSON.stringify(input.details ?? {})
		);
}

export function setUserRole(userId: string, role: Role): boolean {
	if (!ROLE_VALUES.includes(role)) throw new Error('Unknown role.');
	const result = getDatabase().prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
	return result.changes > 0;
}

export function listUsers(): Array<{
	id: string;
	email: string;
	role: Role;
	created_at: string;
	current_district: number | null;
}> {
	return getDatabase()
		.prepare(
			`SELECT u.id, u.email, u.role, u.created_at,
			 (SELECT district_id FROM district_assignments d
			  WHERE d.user_id = u.id AND d.is_current = 1) AS current_district
			 FROM users u ORDER BY u.created_at DESC`
		)
		.all() as unknown as Array<{
		id: string;
		email: string;
		role: Role;
		created_at: string;
		current_district: number | null;
	}>;
}

export function deleteUser(userId: string): void {
	const db = getDatabase();
	db.exec('BEGIN IMMEDIATE');
	try {
		// Preserve accounting totals while removing the personal association.
		db.prepare('UPDATE donations SET user_id = NULL WHERE user_id = ?').run(userId);
		db.prepare('DELETE FROM users WHERE id = ?').run(userId);
		db.exec('COMMIT');
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}
}

export function exportUser(userId: string): Record<string, unknown> {
	const user = findUserById(userId);
	if (!user) throw new Error('User not found.');
	return {
		account: {
			id: user.id,
			email: user.email,
			role: user.role,
			created_at: user.created_at
		},
		assignments: assignmentHistory(userId),
		preferences: communicationPreferences(userId),
		participation: getDatabase()
			.prepare(
				`SELECT kind, region_id, district_id, amount_cents, occurred_at
				 FROM participation_events WHERE user_id = ? ORDER BY occurred_at`
			)
			.all(userId)
	};
}

export function suppressCommunication(email: string, reason: string): void {
	getDatabase()
		.prepare(
			`INSERT INTO communication_suppressions (email, reason) VALUES (?, ?)
			 ON CONFLICT(email) DO UPDATE SET reason = excluded.reason`
		)
		.run(email.trim().toLowerCase(), reason.trim().slice(0, 200) || 'unsubscribed');
}

export function removeCommunicationSuppression(email: string): void {
	getDatabase()
		.prepare('DELETE FROM communication_suppressions WHERE email = ?')
		.run(email.trim().toLowerCase());
}

export function listAuditEvents(limit = 200): AuditEvent[] {
	return getDatabase()
		.prepare('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?')
		.all(Math.min(Math.max(limit, 1), 1000)) as unknown as AuditEvent[];
}

export function hashToken(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function normalizeAssignment(row: DistrictAssignmentRow): DistrictAssignment {
	return { ...row, is_current: Boolean(row.is_current) };
}
