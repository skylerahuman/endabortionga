import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRegionAggregates } from '$lib/server/aggregates';

export const GET: RequestHandler = async () => {
	return json(getRegionAggregates(), {
		headers: { 'cache-control': 'public, max-age=30, stale-while-revalidate=120' }
	});
};
