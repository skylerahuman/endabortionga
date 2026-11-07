import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { allCampaignContent } from '$lib/server/campaign';

export const GET: RequestHandler = async () => {
	return json({ content: allCampaignContent() });
};
