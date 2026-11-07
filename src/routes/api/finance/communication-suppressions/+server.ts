import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCsrf, requireRole, requireSameOrigin } from '$lib/server/auth';
import {
	removeCommunicationSuppression,
	suppressCommunication
} from '$lib/server/db';
import { normalizeEmail, safeText } from '$lib/server/validation';

export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireRole(event, ['finance', 'admin']);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const body = await event.request.json().catch(() => ({}));
	const email = normalizeEmail(body.email);
	if (!email) throw error(400, 'A valid email is required.');
	suppressCommunication(email, safeText(body.reason, 200) || 'unsubscribed');
	return json({ suppressed: true });
};

export const DELETE: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireRole(event, ['finance', 'admin']);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const email = normalizeEmail(event.url.searchParams.get('email'));
	if (!email) throw error(400, 'A valid email is required.');
	removeCommunicationSuppression(email);
	return json({ suppressed: false });
};
