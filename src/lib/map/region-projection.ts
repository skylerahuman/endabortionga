import { geoAlbers, geoPath, type GeoProjection } from 'd3-geo';
import type { RegionFeature } from './region-types';

const PADDING = 16;

export interface ProjectedRegion {
	feature: RegionFeature;
	path: string;
	centroid: [number, number];
}

export function projectRegions(features: RegionFeature[]): {
	projected: ProjectedRegion[];
	viewBox: [number, number, number, number];
} {
	const projection = createRegionProjection(features);
	const path = geoPath(projection);
	const projected = features.map((feature) => {
		const center = path.centroid(feature);
		return {
			feature,
			path: path(feature) ?? '',
			centroid: [center[0] ?? 0, center[1] ?? 0] as [number, number]
		};
	});
	const bounds = path.bounds({ type: 'FeatureCollection', features } as never);
	return {
		projected,
		viewBox: [
			bounds[0][0] - PADDING,
			bounds[0][1] - PADDING,
			bounds[1][0] - bounds[0][0] + PADDING * 2,
			bounds[1][1] - bounds[0][1] + PADDING * 2
		]
	};
}

export function projectLongitudeLatitude(
	longitude: number,
	latitude: number,
	features: RegionFeature[]
): [number, number] {
	const projection = createRegionProjection(features);
	return projection([longitude, latitude]) ?? [0, 0];
}

export function createRegionProjection(features: RegionFeature[]): GeoProjection {
	return geoAlbers()
		.rotate([84, 0])
		.parallels([31, 34])
		.fitExtent(
			[
				[PADDING, PADDING],
				[1000 - PADDING, 1000 - PADDING]
			],
			{ type: 'FeatureCollection', features } as never
		);
}
