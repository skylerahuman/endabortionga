import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearSession, requireSameOrigin } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	clearSession(event.cookies);
	return json({ ok: true });
};
