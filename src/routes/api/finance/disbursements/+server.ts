import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCsrf, requireRole, requireSameOrigin } from '$lib/server/auth';
import { decideDisbursement, listDisbursements, requestDisbursement } from '$lib/server/disbursements';

export const GET: RequestHandler = async (event) => {
	requireRole(event, ['finance', 'admin']);
	return json({ disbursements: listDisbursements() });
};

export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireRole(event, ['finance', 'admin']);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const body = await event.request.json().catch(() => ({}));
	const amountCents = Math.round(Number(body.amount_cents));
	const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
	if (!Number.isFinite(amountCents) || amountCents <= 0 || !reason) {
		throw error(400, 'A positive amount and reason are required.');
	}
	try {
		const disbursement = requestDisbursement({
			requestedBy: session.user.id,
			amountCents,
			reason
		});
		return json({ disbursement }, { status: 201 });
	} catch (cause) {
		throw error(400, cause instanceof Error ? cause.message : 'Could not request disbursement.');
	}
};

export const PUT: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireRole(event, ['finance', 'admin']);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const body = await event.request.json().catch(() => ({}));
	const id = typeof body.id === 'string' ? body.id : '';
	const decision = body.decision === 'approved' || body.decision === 'rejected' ? body.decision : null;
	if (!id || !decision) throw error(400, 'A disbursement and decision are required.');
	try {
		const disbursement = decideDisbursement({
			id,
			decidedBy: session.user.id,
			decision,
			decidedByRole: session.user.role
		});
		return json({ disbursement });
	} catch (cause) {
		throw error(409, cause instanceof Error ? cause.message : 'Could not decide disbursement.');
	}
};
