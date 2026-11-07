import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { union, rewind, simplify } from '@turf/turf';
import { read as readShapefile } from 'shapefile';
import { REGIONS, validateRegionCoverage } from '../src/lib/config/regions.ts';

if (!validateRegionCoverage().valid) throw new Error('Incomplete region assignment');
const input = resolve(process.argv[2] ?? '../ga-gms-map/data/districts.json');
const source = JSON.parse(await readFile(input, 'utf8'));
// Optional raw TIGER file preserves shared boundaries that were simplified independently upstream.
if (process.argv[3]) {
	const shapePath = resolve(process.argv[3]);
	const original = await readShapefile(shapePath, shapePath.replace(/\.shp$/, '.dbf'));
	const rawById = new Map(original.features.map((feature) => [Number(feature.properties.SLDLST), feature.geometry]));
	for (const feature of source.features) {
		const geometry = rawById.get(feature.id);
		if (!geometry) throw new Error(`Missing raw district ${feature.id}`);
		feature.geometry = geometry;
	}
}
const byId = new Map(source.features.map((feature) => [feature.id, feature]));
if (byId.size !== 180) throw new Error('Expected 180 source districts');
const features = REGIONS.map((region) => {
	const selected = region.districts.map((id) => {
		const feature = byId.get(id);
		if (!feature) throw new Error(`Missing district ${id}`);
		return feature;
	});
	const merged = union({ type: 'FeatureCollection', features: selected });
	if (!merged) throw new Error(`Could not merge ${region.id}`);
	// D3's spherical convention requires clockwise exteriors (opposite RFC 7946).
	const geometry = rewind(simplify(merged, { tolerance: 0.0005, highQuality: true }), { reverse: true }).geometry;
	return {
		type: 'Feature', id: region.id,
		properties: {
			id: region.id, name: region.name, shortName: region.shortName,
			focus: region.focus, districtCount: selected.length
		},
		geometry
	};
});
await writeFile(new URL('../static/data/georgia-regions.json', import.meta.url), JSON.stringify({
	type: 'FeatureCollection',
	metadata: {
		boundarySession: [...new Set(source.features.map((f) => f.properties.session))].join(', '),
		generatedAt: new Date().toISOString()
	}, features
}));
console.log(`Built ${features.length} regions covering 180 districts.`);
