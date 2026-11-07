import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireCsrf, requireRole, requireSameOrigin } from '$lib/server/auth';
import { audit, getDatabase } from '$lib/server/db';
import { contentForRegion } from '$lib/server/campaign';
import { REGION_BY_ID, type RegionId } from '$lib/config/regions';
import { safeText } from '$lib/server/validation';

export const PUT: RequestHandler = async (event) => {
	requireSameOrigin(event.request);
	const session = requireRole(event, ['campaign_editor', 'admin']);
	requireCsrf(event, event.request.headers.get('x-csrf-token'));
	const regionId = event.params.regionId as RegionId;
	if (!REGION_BY_ID[regionId]) throw error(404, 'Region not found.');
	const body = await event.request.json().catch(() => ({}));
	const current = contentForRegion(regionId);
	const content = {
		...current,
		headline: safeText(body.headline, 160) || current.headline,
		body: safeText(body.body, 1000) || current.body,
		actionLabel: safeText(body.actionLabel, 80) || current.actionLabel,
		actionHref: safeText(body.actionHref, 200) || current.actionHref,
		updatedAt: new Date().toISOString()
	};
	getDatabase()
		.prepare(
			`INSERT INTO campaign_content
			 (region_id, headline, body, action_label, action_href, updated_at, updated_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT(region_id) DO UPDATE SET
			 headline = excluded.headline, body = excluded.body,
			 action_label = excluded.action_label, action_href = excluded.action_href,
			 updated_at = excluded.updated_at, updated_by = excluded.updated_by`
		)
		.run(
			regionId,
			content.headline,
			content.body,
			content.actionLabel,
			content.actionHref,
			content.updatedAt,
			session.user.id
		);
	audit({
		actorUserId: session.user.id,
		action: 'campaign.content_updated',
		entityType: 'region',
		entityId: regionId
	});
	return json({ content });
};
