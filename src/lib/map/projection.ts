import { geoAlbers, geoEquirectangular, geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import type { DistrictFeature } from './types';

const PADDING = 14; // room around the state for the outline and the labels

/**
 * Expects: the districts that are published and the kind of projection.
 * Executes: builds the projection. The Albers conic projection is the default because it is the
 *           right one for a state: its central meridian and parallels follow the bounding box of
 *           the data, so the same code is right for Georgia, for Tennessee and for a merged state.
 *           The Mercator and the equirectangular projection are there for the cases where a
 *           different look is wanted.
 * Exits:   a projection that is ready to be fitted into the viewport.
 * Exceptions: none - an unknown kind falls back to the Albers projection.
 */
export function createProjection(
	features: DistrictFeature[],
	kind: 'albers' | 'mercator' | 'equirectangular' = 'albers'
): GeoProjection {
	const box = boundingBox(features);
	const centre = (box.minX + box.maxX) / 2;
	const span = box.maxY - box.minY;

	if (kind === 'mercator') {
		return geoMercator()
			.center([-centre, (box.minY + box.maxY) / 2])
			.translate([0, 0])
			.scale(1);
	}
	if (kind === 'equirectangular') {
		return geoEquirectangular()
			.center([-centre, (box.minY + box.maxY) / 2])
			.translate([0, 0])
			.scale(1);
	}
	return geoAlbers()
		.rotate([-centre, 0])
		.parallels([box.minY + span * 0.25, box.maxY - span * 0.25])
		.translate([0, 0])
		.scale(1);
}

/**
 * Expects: the districts that are published.
 * Executes: walks every coordinate of every district.
 * Exits:   the smallest box that holds all of them.
 * Exceptions: none - an empty list gives a box around the origin.
 */
function boundingBox(features: DistrictFeature[]) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const feature of features) {
		const geometry = feature.geometry;
		const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
		for (const polygon of polygons) {
			for (const ring of polygon) {
				for (const [x, y] of ring) {
					if (x < minX) minX = x;
					if (y < minY) minY = y;
					if (x > maxX) maxX = x;
					if (y > maxY) maxY = y;
				}
			}
		}
	}
	if (!Number.isFinite(minX)) return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
	return { minX, minY, maxX, maxY };
}

/** One district on the map, ready to be drawn. */
export interface ProjectedDistrict {
	feature: DistrictFeature;
	/** The SVG path of the district. */
	path: string;
	/** Where the label of the district goes. */
	label: [number, number];
	/** Rough on-screen size, used to hide the labels of the tiny districts. */
	size: number;
}

/**
 * Expects: the districts that are published.
 * Executes: projects every district, fits the result into a square and measures how much room
 *           the drawing needs.
 * Exits:   the projected districts and the viewBox that frames them exactly.
 * Exceptions: none.
 */
export function projectDistricts(
	features: DistrictFeature[],
	kind: 'albers' | 'mercator' | 'equirectangular' = 'albers'
): {
	projected: ProjectedDistrict[];
	viewBox: [number, number, number, number];
} {
	const projection = createProjection(features, kind);
	const path = geoPath(projection);
	const collection = { type: 'FeatureCollection', features } as never;

	projection.fitExtent(
		[
			[PADDING, PADDING],
			[1000 - PADDING, 1000 - PADDING]
		],
		collection
	);

	const projected: ProjectedDistrict[] = features.map((feature) => {
		const label = projection(feature.properties.labelPoint);
		const [[minX, minY], [maxX, maxY]] = path.bounds(feature as never);
		return {
			feature,
			path: path(feature) ?? '',
			label: (label ?? [0, 0]) as [number, number],
			size: Math.abs(maxX - minX) * Math.abs(maxY - minY)
		};
	});

	const [[minX, minY], [maxX, maxY]] = path.bounds(collection);
	return {
		projected,
		viewBox: [minX - PADDING, minY - PADDING, maxX - minX + PADDING * 2, maxY - minY + PADDING * 2]
	};
}
