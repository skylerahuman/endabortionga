import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { closeDatabase } from './db';
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
import {
	addParticipation,
	assignmentHistory,
	createDonationAttribution,
	createUser,
	currentAssignment,
	getDatabase,
	resolveDonationAttribution,
	updateDistrict
} from './db';

beforeEach(closeDatabase);
afterEach(closeDatabase);

describe('district assignment history', () => {
	it('keeps the old district and makes the new district current', async () => {
		const user = await createUser(`${randomUUID()}@example.test`, 'StrongGeorgia123!');
		updateDistrict(user.id, 150, 'south-georgia');
		updateDistrict(user.id, 142, 'middle-georgia');
		expect(currentAssignment(user.id)?.district_id).toBe(142);
		expect(currentAssignment(user.id)?.region_id).toBe('middle-georgia');
		const history = assignmentHistory(user.id);
		expect(history).toHaveLength(2);
		expect(history.find((item) => item.district_id === 150)?.is_current).toBe(false);
		expect(history.find((item) => item.district_id === 150)?.ended_at).toBeTruthy();
	});

	it('stores and resolves an opaque donation attribution', async () => {
		const user = await createUser(`${randomUUID()}@example.test`, 'StrongGeorgia123!');
		updateDistrict(user.id, 42, 'west-metro');
		const token = createDonationAttribution(user.id, 'west-metro', 42);
		expect(token).not.toContain(user.id);
		expect(resolveDonationAttribution(token)).toMatchObject({
			user_id: user.id,
			region_id: 'west-metro',
			district_id: 42
		});
	});

	it('retains participation against the region active when it occurred', async () => {
		const user = await createUser(`${randomUUID()}@example.test`, 'StrongGeorgia123!');
		updateDistrict(user.id, 150, 'south-georgia');
		addParticipation({
			userId: user.id,
			regionId: 'south-georgia',
			districtId: 150,
			kind: 'briefing_packet'
		});
		updateDistrict(user.id, 142, 'middle-georgia');
		const rows = getDatabase()
			.prepare('SELECT region_id FROM participation_events WHERE user_id = ?')
			.all(user.id) as Array<{ region_id: string }>;
		expect(rows[0]?.region_id).toBe('south-georgia');
	});
});
