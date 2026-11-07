import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	givebutterAccountId,
	givebutterCampaignCode,
	givebutterConfigured
} from '$lib/server/givebutter';

export const GET: RequestHandler = async () => {
	return json({
		configured: givebutterConfigured(),
		campaign: givebutterCampaignCode(),
		account: givebutterAccountId()
	});
};
