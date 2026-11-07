import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole } from '$lib/server/auth';
import {
	communicationAudience,
	type CommunicationCategory
} from '$lib/server/communication';

const CATEGORIES = new Set<CommunicationCategory>([
	'giving_needs',
	'prayer_needs',
	'legislative_action',
	'events'
]);

export const GET: RequestHandler = async (event) => {
	requireRole(event, ['finance', 'admin']);
	const category = event.url.searchParams.get('category') as CommunicationCategory | null;
	if (!category || !CATEGORIES.has(category)) throw error(400, 'A valid communication category is required.');
	return json(
		{ category, contacts: communicationAudience(category) },
		{ headers: { 'cache-control': 'no-store' } }
	);
};
