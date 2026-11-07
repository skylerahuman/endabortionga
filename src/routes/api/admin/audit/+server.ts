import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole } from '$lib/server/auth';
import { listAuditEvents } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireRole(event, ['admin']);
	return json({ events: listAuditEvents() }, { headers: { 'cache-control': 'no-store' } });
};
