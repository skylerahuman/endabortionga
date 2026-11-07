import { REGIONS, type RegionId } from '$lib/config/regions';
import { getDatabase } from './db';

export interface CampaignContent {
	id: string;
	regionId: RegionId;
	headline: string;
	body: string;
	actionLabel: string;
	actionHref: string;
	updatedAt: string;
}

const CONTENT: CampaignContent[] = [
	{
		id: 'north-georgia-default',
		regionId: 'north-georgia',
		headline: 'Build a north Georgia church convoy',
		body: 'Gather pastors and students for a regional prayer walk and a direct meeting with your civil magistrate.',
		actionLabel: 'Plan a regional action',
		actionHref: '/join',
		updatedAt: '2026-11-07T00:00:00.000Z'
	},
	{
		id: 'west-metro-default',
		regionId: 'west-metro',
		headline: 'Take a sidewalk stand this month',
		body: 'Organize a church prayer team to stand outside an abortion clinic with a clear, peaceful Gospel witness.',
		actionLabel: 'Find your next step',
		actionHref: '/join',
		updatedAt: '2026-11-07T00:00:00.000Z'
	},
	{
		id: 'east-metro-default',
		regionId: 'east-metro',
		headline: 'Put a briefing in an elder’s hands',
		body: 'Deliver the Pastoral Briefing Packet to a pastor, elder, or campus minister and follow up for a concrete response.',
		actionLabel: 'Get the briefing packet',
		actionHref: '/for-pastors',
		updatedAt: '2026-11-07T00:00:00.000Z'
	},
	{
		id: 'middle-georgia-default',
		regionId: 'middle-georgia',
		headline: 'Link students with Macon churches',
		body: 'Bring university students, church families, and local pregnancy-resource workers into one practical network.',
		actionLabel: 'Organize locally',
		actionHref: '/join',
		updatedAt: '2026-11-07T00:00:00.000Z'
	},
	{
		id: 'south-georgia-default',
		regionId: 'south-georgia',
		headline: 'Ask your county to protect its neighbors',
		body: 'Prepare for a respectful county-commission meeting and build a local church safety net for mothers in crisis.',
		actionLabel: 'Prepare the meeting',
		actionHref: '/get-involved',
		updatedAt: '2026-11-07T00:00:00.000Z'
	},
	{
		id: 'coastal-georgia-default',
		regionId: 'coastal-georgia',
		headline: 'Strengthen the coastal church alliance',
		body: 'Connect rural churches with port, campus, and community leaders for prayer, practical support, and local civil resistance.',
		actionLabel: 'Connect the network',
		actionHref: '/join',
		updatedAt: '2026-11-07T00:00:00.000Z'
	}
];

export function contentForRegion(regionId: RegionId): CampaignContent {
	const stored = getDatabase()
		.prepare('SELECT * FROM campaign_content WHERE region_id = ?')
		.get(regionId) as
		| {
				region_id: RegionId;
				headline: string;
				body: string;
				action_label: string;
				action_href: string;
				updated_at: string;
		  }
		| undefined;
	if (stored) {
		return {
			id: stored.region_id,
			regionId: stored.region_id,
			headline: stored.headline,
			body: stored.body,
			actionLabel: stored.action_label,
			actionHref: stored.action_href,
			updatedAt: stored.updated_at
		};
	}
	return (
		CONTENT.find((content) => content.regionId === regionId) ?? {
			id: `${regionId}-default`,
			regionId,
			headline: 'Organize your local church',
			body: 'Begin with a pastoral briefing and one concrete act of faithful resistance in your community.',
			actionLabel: 'Get involved',
			actionHref: '/join',
			updatedAt: '2026-11-07T00:00:00.000Z'
		}
	);
}

export function allCampaignContent(): CampaignContent[] {
	return REGIONS.map((region) => contentForRegion(region.id));
}
