import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCsrf, requireSameOrigin, requireUser } from '$lib/server/auth';
import { addParticipation, audit, currentAssignment } from '$lib/server/db';
import { safeText } from '$lib/server/validation';

const ALLOWED_KINDS = new Set(['briefing_packet', 'volunteer', 'prayer', 'event', 'outreach']);

export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireUser(event);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const body = await event.request.json().catch(() => ({}));
	const kind = safeText(body.kind, 40);
	if (!ALLOWED_KINDS.has(kind)) throw error(400, 'Unknown participation type.');
	const assignment = currentAssignment(session.user.id);
	if (!assignment) throw error(409, 'Associate a House District before recording participation.');
	addParticipation({
		userId: session.user.id,
		regionId: assignment.region_id,
		districtId: assignment.district_id,
		kind
	});
	audit({
		actorUserId: session.user.id,
		action: 'participation.recorded',
		entityType: 'participation',
		entityId: kind,
		details: { regionId: assignment.region_id, districtId: assignment.district_id }
	});
	return json({ ok: true });
};
