import { randomUUID } from 'node:crypto';
import { getDatabase, audit, findUserById, type Role } from './db';

export interface Disbursement {
	id: string;
	amount_cents: number;
	reason: string;
	requested_by: string;
	approved_by: string | null;
	status: 'pending' | 'approved' | 'rejected' | 'paid';
	requested_at: string;
	decided_at: string | null;
}

export function requestDisbursement(input: {
	requestedBy: string;
	amountCents: number;
	reason: string;
}): Disbursement {
	if (!['finance', 'admin'].includes(findUserById(input.requestedBy)?.role ?? '')) {
		throw new Error('Finance authorization is required.');
	}
	if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
		throw new Error('Disbursement amount must be positive.');
	}
	const db = getDatabase();
	const id = randomUUID();
	db.prepare(
		`INSERT INTO disbursements (id, amount_cents, reason, requested_by)
		 VALUES (?, ?, ?, ?)`
	).run(id, input.amountCents, input.reason.trim().slice(0, 500), input.requestedBy);
	audit({
		actorUserId: input.requestedBy,
		action: 'disbursement.requested',
		entityType: 'disbursement',
		entityId: id,
		details: { amountCents: input.amountCents }
	});
	return db.prepare('SELECT * FROM disbursements WHERE id = ?').get(id) as unknown as Disbursement;
}

export function decideDisbursement(input: {
	id: string;
	decidedBy: string;
	decision: 'approved' | 'rejected';
	decidedByRole: Role;
}): Disbursement {
	const db = getDatabase();
	const current = db
		.prepare('SELECT * FROM disbursements WHERE id = ?')
		.get(input.id) as unknown as Disbursement | undefined;
	if (!current) throw new Error('Disbursement not found.');
	if (current.status !== 'pending') throw new Error('Disbursement has already been decided.');
	if (!['finance', 'admin'].includes(findUserById(input.decidedBy)?.role ?? '')) {
		throw new Error('Finance authorization is required.');
	}
	if (current.amount_cents > 100_000 && current.requested_by === input.decidedBy) {
		throw new Error('Disbursements over $1,000 require a second authorizer.');
	}
	db.prepare(
		`UPDATE disbursements SET approved_by = ?, status = ?, decided_at = CURRENT_TIMESTAMP
		 WHERE id = ? AND status = 'pending'`
	).run(input.decidedBy, input.decision, input.id);
	audit({
		actorUserId: input.decidedBy,
		action: `disbursement.${input.decision}`,
		entityType: 'disbursement',
		entityId: input.id,
		details: { amountCents: current.amount_cents }
	});
	return db
		.prepare('SELECT * FROM disbursements WHERE id = ?')
		.get(input.id) as unknown as Disbursement;
}

export function listDisbursements(): Disbursement[] {
	return getDatabase()
		.prepare('SELECT * FROM disbursements ORDER BY requested_at DESC')
		.all() as unknown as Disbursement[];
}
