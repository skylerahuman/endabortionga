import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { closeDatabase } from './db';
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
import { communicationAudience } from './communication';
import {
	createUser,
	getDatabase,
	saveCommunicationPreferences,
	suppressCommunication,
	updateDistrict
} from './db';

beforeEach(closeDatabase);
afterEach(closeDatabase);

describe('communication opt-ins', () => {
	it('includes only explicit opt-ins and excludes globally suppressed contacts', async () => {
		const email = `${randomUUID()}@example.test`;
		const user = await createUser(email, 'StrongGeorgia123!');
		updateDistrict(user.id, 150, 'south-georgia');
		saveCommunicationPreferences(user.id, {
			giving_needs: true,
			prayer_needs: false,
			legislative_action: false,
			events: false
		});
		expect(communicationAudience('giving_needs')).toHaveLength(0);
		getDatabase()
			.prepare('UPDATE users SET email_verified_at = CURRENT_TIMESTAMP WHERE id = ?')
			.run(user.id);
		expect(communicationAudience('giving_needs').map((item) => item.email)).toContain(email);
		expect(communicationAudience('events').map((contact) => contact.email)).not.toContain(email);
		suppressCommunication(email, 'unsubscribed');
		expect(communicationAudience('giving_needs').map((contact) => contact.email)).not.toContain(
			email
		);
	});
});
