import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/auth';
import { exportUser } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	const session = requireUser(event);
	return json(exportUser(session.user.id), {
		headers: { 'cache-control': 'no-store' }
	});
};
