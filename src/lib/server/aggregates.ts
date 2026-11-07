import { getDatabase } from './db';
import { REGIONS, type RegionId } from '$lib/config/regions';
import { bandFor, type EngagementBand } from '$lib/map/rmi';
import {
	REGION_METRICS,
	REGION_METRICS_SOURCE,
	STATEWIDE_MEDIAN_INCOME
} from '$lib/config/region-metrics';

export interface RegionAggregate {
	regionId: RegionId;
	name: string;
	engaged: boolean;
	rmi: number;
	participationCount: number;
	participatingPeople: number;
	donationCents: number;
	population: number;
	medianIncome: number;
	statewideMedianIncome: number;
	band: EngagementBand;
}

export interface RegionAggregatesResponse {
	regions: RegionAggregate[];
	updatedAt: string;
	metricsSource: string;
}

export function getRegionAggregates(): RegionAggregatesResponse {
	const db = getDatabase();
	const participation = db
		.prepare(
			`SELECT region_id,
			 COUNT(*) AS event_count,
			 COUNT(DISTINCT user_id) AS people,
			 COALESCE(SUM(CASE WHEN kind = 'donation' THEN amount_cents ELSE 0 END), 0) AS cents
			 FROM participation_events GROUP BY region_id`
		)
		.all() as Array<{
		region_id: RegionId;
		event_count: number;
		people: number;
		cents: number;
	}>;
	const donationRows = db
		.prepare(
			`SELECT region_id, COALESCE(SUM(amount_cents), 0) AS cents
			 FROM donations WHERE status = 'paid' GROUP BY region_id`
		)
		.all() as Array<{ region_id: RegionId; cents: number }>;
	const participationByRegion = new Map(participation.map((row) => [row.region_id, row]));
	const donationByRegion = new Map(donationRows.map((row) => [row.region_id, row.cents]));

	const regions = REGIONS.map((region) => {
		const events = participationByRegion.get(region.id);
		const participationCount = events?.event_count ?? 0;
		const participatingPeople = events?.people ?? 0;
		const donationCents = donationByRegion.get(region.id) ?? 0;
		const population = REGION_METRICS[region.id].population;
		const medianIncome = REGION_METRICS[region.id].medianHouseholdIncome;
		const capacity = population * (medianIncome / STATEWIDE_MEDIAN_INCOME);
		const givingIndex = donationCents / 10_000;
		const participationIndex = participatingPeople;
		const engagementIndex = givingIndex + participationIndex;
		const rawRmi = capacity > 0 ? (engagementIndex / capacity) * 100_000 : 0;
		const rmi = Math.round(rawRmi * 100) / 100;
		const engaged = participationCount > 0 || donationCents > 0;
		return {
			regionId: region.id,
			name: region.name,
			engaged,
			rmi,
			participationCount,
			participatingPeople,
			donationCents,
			population,
			medianIncome,
			statewideMedianIncome: STATEWIDE_MEDIAN_INCOME,
			band: bandFor(rmi, engaged)
		};
	});
	return {
		regions,
		updatedAt: new Date().toISOString(),
		metricsSource: REGION_METRICS_SOURCE
	};
}

export { bandFor } from '$lib/map/rmi';
