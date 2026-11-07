import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { projectDistricts } from './projection';
import type { DistrictCollection } from './types';

const data: DistrictCollection = JSON.parse(
	readFileSync('static/data/georgia-house-districts.json', 'utf8')
);

describe('imported Georgia district boundaries', () => {
	it('contains each of the 180 House districts exactly once', () => {
		expect(data.features.map((feature) => feature.id).sort((a, b) => a - b)).toEqual(
			Array.from({ length: 180 }, (_, index) => index + 1)
		);
	});

	it('excludes financial, partisan and personal fields', () => {
		for (const feature of data.features) {
			expect(Object.keys(feature.properties).sort()).toEqual(
				['id', 'number', 'name', 'session', 'labelPoint'].sort()
			);
		}
	});

	it('projects every district into finite SVG paths and bounds', () => {
		const { projected, viewBox } = projectDistricts(data.features);
		expect(projected).toHaveLength(180);
		expect(viewBox.every(Number.isFinite)).toBe(true);
		expect(viewBox[2]).toBeGreaterThan(0);
		expect(viewBox[3]).toBeGreaterThan(0);
		for (const district of projected) {
			expect(district.path).toMatch(/^M/);
			expect(district.path).not.toMatch(/NaN|Infinity/);
			expect(district.label.every(Number.isFinite)).toBe(true);
		}
	});
});
