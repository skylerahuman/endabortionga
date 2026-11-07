import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCsrf, requireSameOrigin, requireUser } from '$lib/server/auth';
import { createDonationAttribution, currentAssignment } from '$lib/server/db';
import { givebutterCampaignCode } from '$lib/server/givebutter';

export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireUser(event);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const assignment = currentAssignment(session.user.id);
	if (!assignment) {
		throw error(409, 'Associate a House District before creating a donation attribution.');
	}
	const token = createDonationAttribution(
		session.user.id,
		assignment.region_id,
		assignment.district_id
	);
	return json({
		token,
		campaign: givebutterCampaignCode()
	});
};
