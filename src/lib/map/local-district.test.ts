import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { findDistrictByPoint, findDistrictByZip } from './local-district';
import type { DistrictCollection } from './region-types';

const districts: DistrictCollection = JSON.parse(
	readFileSync('static/data/georgia-house-districts.json', 'utf8')
);

describe('local-only district resolution', () => {
	it('finds a district from an in-polygon coordinate', () => {
		const feature = districts.features.find((item) => item.id === 1)!;
		const [longitude, latitude] = feature.properties.labelPoint;
		expect(findDistrictByPoint(districts.features, longitude, latitude)).toBe(1);
	});

	it('resolves a Georgia ZIP entirely from the local mapping', () => {
		const mapping = JSON.parse(readFileSync('static/data/zip_to_district.json', 'utf8'));
		expect(findDistrictByZip(mapping, '30303')).toBeTypeOf('number');
		expect(findDistrictByZip(mapping, '99999')).toBeNull();
	});
});
