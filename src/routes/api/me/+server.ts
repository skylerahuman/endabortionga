import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearSession, currentUser, requireCsrf, requireSameOrigin, requireUser } from '$lib/server/auth';
import {
	assignmentHistory,
	communicationPreferences,
	currentAssignment,
	deleteUser,
	exportUser
} from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	const session = currentUser(event.cookies);
	if (!session) return json({ authenticated: false });
	return json({
		authenticated: true,
		user: {
			id: session.user.id,
			email: session.user.email,
			role: session.user.role
		},
		assignment: currentAssignment(session.user.id) ?? null,
		history: assignmentHistory(session.user.id),
		preferences: communicationPreferences(session.user.id),
		csrfToken: session.csrf_token
	});
};

export const DELETE: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireUser(event);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	deleteUser(session.user.id);
	clearSession(event.cookies);
	return json({ deleted: true });
};
