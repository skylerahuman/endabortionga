import membership from './region-membership.json' with { type: 'json' };

// Geographic v2: contiguous district adjacency with 25–35 districts per coordinator.
export const REGION_MEMBERSHIP_VERSION = membership.version;
export const REGIONS = [
	{
		id: 'north-georgia',
		name: 'North Georgia',
		shortName: 'North',
		districts: membership.regions['north-georgia'],
		focus: 'Dense evangelical church networks and regional caravans.'
	},
	{
		id: 'west-metro',
		name: 'West Metro',
		shortName: 'West',
		districts: membership.regions['west-metro'],
		focus: 'Intown intercession, campus outreach, and legislative pressure.'
	},
	{
		id: 'east-metro',
		name: 'East Metro',
		shortName: 'East',
		districts: membership.regions['east-metro'],
		focus: 'Suburban pulpits, high-capacity giving, and local awareness.'
	},
	{
		id: 'middle-georgia',
		name: 'Middle Georgia',
		shortName: 'Middle',
		districts: membership.regions['middle-georgia'],
		focus: 'University networks and regional community hubs.'
	},
	{
		id: 'south-georgia',
		name: 'South Georgia',
		shortName: 'South',
		districts: membership.regions['south-georgia'],
		focus: 'Rural church safety nets and county-level civil resistance.'
	},
	{
		id: 'coastal-georgia',
		name: 'Coastal Georgia',
		shortName: 'Coastal',
		districts: membership.regions['coastal-georgia'],
		focus: 'Coastal church alliances, port communities, and rural networks.'
	}
] as const;

export type RegionId = (typeof REGIONS)[number]['id'];
export type Region = (typeof REGIONS)[number];

export interface RegionDefinition {
	id: RegionId;
	name: string;
	shortName: string;
	districts: number[];
	focus: string;
}

export const REGION_BY_ID = Object.fromEntries(
	REGIONS.map((region) => [region.id, region])
) as Record<RegionId, Region>;

const DISTRICT_TO_REGION = new Map<number, RegionId>();
for (const region of REGIONS) {
	for (const district of region.districts) {
		if (DISTRICT_TO_REGION.has(district)) {
			throw new Error(`District ${district} is assigned to more than one region`);
		}
		DISTRICT_TO_REGION.set(district, region.id);
	}
}

if (DISTRICT_TO_REGION.size !== 180) {
	throw new Error(`Expected 180 assigned districts, found ${DISTRICT_TO_REGION.size}`);
}

export function regionForDistrict(districtId: number): RegionId {
	const regionId = DISTRICT_TO_REGION.get(districtId);
	if (!regionId) throw new Error(`No region is configured for House District ${districtId}`);
	return regionId;
}

export function districtsForRegion(regionId: RegionId): readonly number[] {
	return REGION_BY_ID[regionId].districts;
}

export function validateRegionCoverage(): {
	valid: boolean;
	assigned: number;
	duplicates: number[];
} {
	const counts = new Map<number, number>();
	for (const region of REGIONS) {
		for (const district of region.districts) counts.set(district, (counts.get(district) ?? 0) + 1);
	}
	const duplicates = [...counts.entries()]
		.filter(([, count]) => count > 1)
		.map(([district]) => district);
	const assigned = counts.size;
	return { valid: assigned === 180 && duplicates.length === 0, assigned, duplicates };
}

export function regionCounts(): Record<RegionId, number> {
	return Object.fromEntries(
		REGIONS.map((region) => [region.id, region.districts.length])
	) as Record<RegionId, number>;
}
