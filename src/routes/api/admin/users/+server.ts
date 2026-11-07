import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCsrf, requireRole, requireSameOrigin } from '$lib/server/auth';
import { audit, listUsers, setUserRole, type Role } from '$lib/server/db';

const ROLES = new Set<Role>(['member', 'campaign_editor', 'finance', 'admin']);

export const GET: RequestHandler = async (event) => {
	requireRole(event, ['admin']);
	return json({ users: listUsers() });
};

export const PUT: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireRole(event, ['admin']);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const body = await event.request.json().catch(() => ({}));
	const userId = typeof body.user_id === 'string' ? body.user_id : '';
	const role = typeof body.role === 'string' ? body.role : '';
	if (!userId || !ROLES.has(role)) throw error(400, 'A user and valid role are required.');
	if (userId === session.user.id && role !== 'admin') {
		throw error(409, 'You cannot remove your own administrator role.');
	}
	if (!setUserRole(userId, role as Role)) throw error(404, 'User not found.');
	audit({
		actorUserId: session.user.id,
		action: 'account.role_changed',
		entityType: 'user',
		entityId: userId,
		details: { role }
	});
	return json({ ok: true });
};
