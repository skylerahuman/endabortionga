import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { REGIONS, regionForDistrict } from '$lib/config/regions';
import { projectRegions } from './region-projection';
import { geoArea } from 'd3-geo';
import membership from '$lib/config/region-membership.json';
import type { RegionCollection } from './region-types';

const regions: RegionCollection = JSON.parse(
	readFileSync('static/data/georgia-regions.json', 'utf8')
);

describe('six-region mobilization map', () => {
	it('keeps each region connected by shared district boundaries and within coordinator workload range', () => {
		const neighbors: Record<string, number[]> = membership.neighbors;
		for (const region of REGIONS) {
			const allowed = new Set(region.districts);
			const queue = [region.districts[0]],
				seen = new Set(queue);
			while (queue.length)
				for (const next of neighbors[String(queue.pop())]) {
					if (allowed.has(next) && !seen.has(next)) {
						seen.add(next);
						queue.push(next);
					}
				}
			expect(seen.size).toBe(allowed.size);
			expect(allowed.size).toBeGreaterThanOrEqual(25);
			expect(allowed.size).toBeLessThanOrEqual(35);
		}
		expect(regionForDistrict(1)).toBe('north-georgia');
		expect(regionForDistrict(161)).toBe('coastal-georgia');
	});
	it('uses D3-compatible ring winding rather than drawing the complement of Georgia', () => {
		const area = regions.features.reduce((total, feature) => total + geoArea(feature), 0);
		expect(area).toBeGreaterThan(0);
		expect(area).toBeLessThan(0.02);
	});
	it('defines six regions covering all 180 districts exactly once', () => {
		const assigned = REGIONS.flatMap((region) => [...region.districts]);
		expect(REGIONS).toHaveLength(6);
		expect(assigned.sort((a, b) => a - b)).toEqual(
			Array.from({ length: 180 }, (_, index) => index + 1)
		);
		expect(new Set(assigned).size).toBe(180);
	});

	it('renders six finite SVG region paths', () => {
		const { projected, viewBox } = projectRegions(regions.features);
		expect(projected).toHaveLength(6);
		expect(viewBox.every(Number.isFinite)).toBe(true);
		for (const region of projected) {
			expect(region.path).toMatch(/^M/);
			expect(region.path).not.toMatch(/NaN|Infinity/);
		}
	});

	it('derives the same region on the server as in the checked-in map', () => {
		for (const feature of regions.features) {
			for (const district of REGIONS.find((region) => region.id === feature.id)?.districts ?? []) {
				expect(regionForDistrict(district)).toBe(feature.id);
			}
		}
	});
});
