import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	audit,
	createUser,
	findUserByEmail,
	saveCommunicationPreferences,
	updateDistrict
} from '$lib/server/db';
import { establishSession, requireSameOrigin } from '$lib/server/auth';
import { rateLimit, requestAddress } from '$lib/server/rate-limit';
import {
	isDistrictId,
	normalizeEmail,
	parseBoolean,
	validatePassword
} from '$lib/server/validation';
import { regionForDistrict } from '$lib/config/regions';

export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const limit = rateLimit(`register:${requestAddress(event)}`, 20);
	if (!limit.allowed) {
		return json(
			{ error: 'Too many registration attempts. Please wait a minute and try again.' },
			{ status: 429, headers: { 'retry-after': String(limit.retryAfter) } }
		);
	}
	const body = await event.request.json().catch(() => ({}));
	const email = normalizeEmail(body.email);
	const password = validatePassword(body.password);
	if (!email || !password) {
		throw error(
			400,
			'Use a valid email and a password of at least 12 characters with upper-case, lower-case, and a number.'
		);
	}
	if (findUserByEmail(email)) throw error(409, 'An account already exists for that email.');

	const districtId =
		body.district_id === undefined || body.district_id === null || body.district_id === ''
			? null
			: Number(body.district_id);
	if (districtId !== null && !isDistrictId(districtId)) {
		throw error(400, 'House District must be from 1 to 180.');
	}
	// Validate every field before creating the account; invalid district input must not leave an account behind.
	const user = await createUser(email, password);
	const preferences = saveCommunicationPreferences(user.id, {
		giving_needs: parseBoolean(body.giving_needs),
		prayer_needs: parseBoolean(body.prayer_needs),
		legislative_action: parseBoolean(body.legislative_action),
		events: parseBoolean(body.events)
	});
	let assignment = null;
	if (districtId !== null) {
		updateDistrict(user.id, districtId, regionForDistrict(districtId));
		assignment = { districtId, regionId: regionForDistrict(districtId) };
	}
	audit({
		actorUserId: user.id,
		action: 'account.registered',
		entityType: 'user',
		entityId: user.id,
		details: { hasDistrict: Boolean(assignment) }
	});
	establishSession(event.cookies, user.id, event.url.protocol === 'https:');
	return json(
		{
			user: { id: user.id, email: user.email, role: user.role },
			preferences,
			assignment
		},
		{ status: 201 }
	);
};
