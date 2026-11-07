import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { closeDatabase, createUser, setUserRole } from './db';
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
import { decideDisbursement, requestDisbursement } from './disbursements';

beforeEach(closeDatabase);
afterEach(closeDatabase);

describe('finance dual authorization', () => {
	it('does not trust a caller-supplied finance role', async () => {
		const member = await createUser(`${randomUUID()}@example.test`, 'StrongGeorgia123!');
		expect(() =>
			requestDisbursement({ requestedBy: member.id, amountCents: 1000, reason: 'Forged role' })
		).toThrow('authorization');
	});
	it('requires a distinct authorizer above $1,000', async () => {
		const requester = await createUser(`${randomUUID()}@example.test`, 'StrongGeorgia123!');
		setUserRole(requester.id, 'finance');
		const disbursement = requestDisbursement({
			requestedBy: requester.id,
			amountCents: 100_001,
			reason: 'Approved field expense'
		});
		expect(() =>
			decideDisbursement({
				id: disbursement.id,
				decidedBy: requester.id,
				decision: 'approved',
				decidedByRole: 'finance'
			})
		).toThrow('second authorizer');
	});

	it('allows a distinct finance authorizer', async () => {
		const requester = await createUser(`${randomUUID()}@example.test`, 'StrongGeorgia123!');
		const approver = await createUser(`${randomUUID()}@example.test`, 'StrongGeorgia123!');
		setUserRole(requester.id, 'finance');
		setUserRole(approver.id, 'finance');
		const disbursement = requestDisbursement({
			requestedBy: requester.id,
			amountCents: 100_001,
			reason: 'Approved field expense'
		});
		const decided = decideDisbursement({
			id: disbursement.id,
			decidedBy: approver.id,
			decision: 'approved',
			decidedByRole: 'finance'
		});
		expect(decided.status).toBe('approved');
		expect(decided.approved_by).toBe(approver.id);
	});
});
