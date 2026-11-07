import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const upstream = resolve(process.argv[2] ?? '../ga-gms-map');
const current = JSON.parse(await readFile('static/data/georgia-house-districts.json', 'utf8'));
const latest = JSON.parse(await readFile(resolve(upstream, 'data/districts.json'), 'utf8'));
const canonical = (feature) => JSON.stringify({ geometry: feature.geometry, labelPoint: feature.properties.labelPoint });
const currentById = new Map(current.features.map((feature) => [feature.id, feature]));
const changed = latest.features.filter((feature) => {
	const existing = currentById.get(feature.id);
	return !existing || canonical(existing) !== canonical(feature);
});
if (changed.length) {
	console.error(`Boundary drift detected in ${changed.length} districts: ${changed.map((feature) => feature.id).join(', ')}`);
	console.error('Run: npm run data:update && npm run data:regions && npm run data:metrics');
	process.exit(1);
}
console.log('No boundary drift detected.');
