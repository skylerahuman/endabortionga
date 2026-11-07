import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCsrf, requireSameOrigin, requireUser } from '$lib/server/auth';
import { audit, saveCommunicationPreferences } from '$lib/server/db';
import { parseBoolean } from '$lib/server/validation';

export const PUT: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireUser(event);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const body = await event.request.json().catch(() => ({}));
	const preferences = saveCommunicationPreferences(session.user.id, {
		giving_needs: parseBoolean(body.giving_needs),
		prayer_needs: parseBoolean(body.prayer_needs),
		legislative_action: parseBoolean(body.legislative_action),
		events: parseBoolean(body.events)
	});
	audit({
		actorUserId: session.user.id,
		action: 'communication.preferences_updated',
		entityType: 'user',
		entityId: session.user.id,
		details: { ...preferences }
	});
	return json({ preferences });
};
