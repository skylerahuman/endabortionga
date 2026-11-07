import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Re-run explicitly when updating the upstream boundary snapshot.
const input = resolve(process.argv[2] ?? '../ga-gms-map/data/districts.json');
const original = JSON.parse(await readFile(input, 'utf8'));
const ids = original.features.map((feature) => feature.id);
if (
	ids.length !== 180 ||
	new Set(ids).size !== 180 ||
	ids.some((id) => !Number.isInteger(id) || id < 1 || id > 180)
) {
	throw new Error('Expected exactly 180 unique Georgia House districts (1–180)');
}
const features = original.features.map(({ id, properties, geometry }) => ({
	type: 'Feature',
	id,
	properties: {
		id,
		number: properties.number,
		name: properties.name,
		session: properties.session,
		labelPoint: properties.labelPoint
	},
	geometry
}));
const output = {
	type: 'FeatureCollection',
	metadata: {
		source: 'ga-gms-map / Census TIGER-Line state legislative lower chamber boundaries',
		importedFrom: 'b14e91a3cb147b73e942826e2bd43a74da995118',
		boundarySession: [...new Set(features.map((feature) => feature.properties.session))].join(', ')
	},
	features
};
await writeFile(
	new URL('../static/data/georgia-house-districts.json', import.meta.url),
	JSON.stringify(output)
);
console.log(
	`Imported ${features.length} districts; excluded financial, partisan and personal contact fields.`
);
