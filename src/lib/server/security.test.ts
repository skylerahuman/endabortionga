import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import {
	createUser,
	setUserRole,
	createSession,
	closeDatabase,
	audit,
	getDatabase,
	deleteUser,
	deleteSession,
	getSession
} from './db';
import { requireRole, requireCsrf, SESSION_COOKIE } from './auth';
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
beforeEach(closeDatabase);
afterEach(closeDatabase);

async function actor(role: 'finance' | 'campaign_editor') {
	const user = await createUser(`${role}@example.test`, 'StrongGeorgia123!');
	setUserRole(user.id, role);
	const token = createSession(user.id, 'csrf-test', new Date(Date.now() + 60_000).toISOString());
	const event = {
		cookies: { get: (name: string) => (name === SESSION_COOKIE ? token : undefined) }
	} as unknown as RequestEvent;
	return { user, token, event };
}

describe('server-side access boundaries', () => {
	it('keeps campaign editing and finance permissions separate', async () => {
		const finance = await actor('finance');
		const editor = await actor('campaign_editor');
		expect(() => requireRole(editor.event, ['finance', 'admin'])).toThrow();
		expect(() => requireRole(finance.event, ['campaign_editor', 'admin'])).toThrow();
		expect(requireRole(finance.event, ['finance']).user.id).toBe(finance.user.id);
		expect(() => requireCsrf(finance.event, 'forged')).toThrow();
		expect(() => requireCsrf(finance.event, 'csrf-test')).not.toThrow();
		deleteSession(finance.token);
		expect(getSession(finance.token)).toBeUndefined();
	});
	it('enforces audit append-only storage while allowing account anonymization', async () => {
		const { user } = await actor('campaign_editor');
		audit({ actorUserId: user.id, action: 'test.action', entityType: 'user', entityId: user.id });
		expect(() => getDatabase().exec("UPDATE audit_events SET action = 'forged'")).toThrow();
		expect(() => getDatabase().exec('DELETE FROM audit_events')).toThrow();
		deleteUser(user.id);
		const stored = getDatabase()
			.prepare('SELECT action, actor_user_id FROM audit_events')
			.get() as { action: string; actor_user_id: string | null };
		expect(stored).toEqual({ action: 'test.action', actor_user_id: null });
	});
});
