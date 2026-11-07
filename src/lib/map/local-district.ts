import type { DistrictFeature } from './types';

/**
 * Resolve a longitude/latitude point to a Georgia House district entirely in the browser.
 * No address or coordinate is sent to the application server.
 */
export function findDistrictByPoint(
	features: DistrictFeature[],
	longitude: number,
	latitude: number
): number | null {
	for (const feature of features) {
		if (pointInGeometry(feature.geometry, longitude, latitude)) return feature.id;
	}
	return null;
}

function pointInGeometry(
	geometry: DistrictFeature['geometry'],
	longitude: number,
	latitude: number
): boolean {
	const polygons =
		geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
	return polygons.some((polygon) => pointInPolygon(polygon, longitude, latitude));
}

function pointInPolygon(
	polygon: number[][][],
	longitude: number,
	latitude: number
): boolean {
	let inside = false;
	for (const ring of polygon) {
		for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
			const [currentX, currentY] = ring[current];
			const [previousX, previousY] = ring[previous];
			const crosses =
				currentY > latitude !== previousY > latitude &&
				longitude <
					((previousX - currentX) * (latitude - currentY)) /
						(previousY - currentY) +
						currentX;
			if (crosses) inside = !inside;
		}
	}
	return inside;
}

/**
 * A privacy-preserving fallback for Georgia ZIP codes. This resolves at ZIP precision and
 * never transmits the entered value. Users should always be able to choose a district manually.
 */
export function findDistrictByZip(
	zipToDistrict: Record<string, string>,
	zip: string
): number | null {
	const normalized = zip.trim().replace(/\D/g, '').slice(0, 5).padStart(5, '0');
	const value = zipToDistrict[normalized];
	if (!value) return null;
	const district = Number(value.replace(/\D/g, ''));
	return Number.isInteger(district) && district >= 1 && district <= 180 ? district : null;
}
