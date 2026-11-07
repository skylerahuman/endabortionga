import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCsrf, requireSameOrigin, requireUser } from '$lib/server/auth';
import { assignmentHistory, audit, updateDistrict } from '$lib/server/db';
import { isDistrictId } from '$lib/server/validation';
import { regionForDistrict } from '$lib/config/regions';

export const PUT: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireUser(event);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const body = await event.request.json().catch(() => ({}));
	const districtId = Number(body.district_id);
	if (!isDistrictId(districtId)) throw error(400, 'House District must be from 1 to 180.');
	const regionId = regionForDistrict(districtId);
	updateDistrict(session.user.id, districtId, regionId);
	audit({
		actorUserId: session.user.id,
		action: 'district.updated',
		entityType: 'user',
		entityId: session.user.id,
		details: { districtId, regionId }
	});
	return json({ assignment: assignmentHistory(session.user.id)[0] });
};
