import { error, json } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import type { RequestHandler } from './$types';
import { establishSession, requireSameOrigin } from '$lib/server/auth';
import { audit, findUserByEmail } from '$lib/server/db';
import { rateLimit, requestAddress } from '$lib/server/rate-limit';
import { normalizeEmail } from '$lib/server/validation';

export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const key = `login:${requestAddress(event)}`;
	const limit = rateLimit(key, 20);
	if (!limit.allowed) {
		return json(
			{ error: 'Too many sign-in attempts. Please wait a minute and try again.' },
			{ status: 429, headers: { 'retry-after': String(limit.retryAfter) } }
		);
	}
	const body = await event.request.json().catch(() => ({}));
	const email = normalizeEmail(body.email);
	const password = typeof body.password === 'string' ? body.password : '';
	const user = email ? findUserByEmail(email) : undefined;
	const valid = user ? await verify(user.password_hash, password).catch(() => false) : false;
	if (!user || !valid) throw error(401, 'Email or password is incorrect.');
	establishSession(event.cookies, user.id, event.url.protocol === 'https:');
	audit({
		actorUserId: user.id,
		action: 'account.login',
		entityType: 'user',
		entityId: user.id
	});
	return json({ user: { id: user.id, email: user.email, role: user.role } });
};
