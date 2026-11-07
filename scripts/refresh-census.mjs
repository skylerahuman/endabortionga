// Self-contained official-data refresh. Does not execute code from a sibling repository.
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { read as readShapefile } from 'shapefile';
import { pointOnFeature, union, rewind, simplify } from '@turf/turf';
import { REGIONS, validateRegionCoverage } from '../src/lib/config/regions.ts';

if (!validateRegionCoverage().valid) throw new Error('Invalid region assignments');
const timeout = () => AbortSignal.timeout(120_000);
const currentYear = new Date().getUTCFullYear();
let year, response;
for (let candidate = currentYear; candidate >= currentYear - 3; candidate--) {
	const url = `https://www2.census.gov/geo/tiger/TIGER${candidate}/SLDL/tl_${candidate}_13_sldl.zip`;
	const attempt = await fetch(url, { signal: timeout() });
	if (attempt.ok) { year = candidate; response = attempt; break; }
	if (attempt.status !== 404) throw new Error(`Census returned ${attempt.status}; retained existing snapshot`);
}
if (!response || !year) throw new Error('No recent official Georgia lower-chamber geometry found');
const dir = await mkdtemp(join(tmpdir(), 'georgia-census-'));
try {
	const bytes = Buffer.from(await response.arrayBuffer());
	const zip = join(dir, 'districts.zip');
	await writeFile(zip, bytes);
	execFileSync('unzip', ['-q', zip, '-d', dir]);
	const prefix = join(dir, `tl_${year}_13_sldl`);
	const raw = await readShapefile(`${prefix}.shp`, `${prefix}.dbf`);
	const features = raw.features.map((feature) => {
		const id = Number(feature.properties.SLDLST);
		return {
			type: 'Feature', id,
			properties: { id, number: id, name: `Georgia House District ${id}`, session: String(year), labelPoint: pointOnFeature(feature).geometry.coordinates },
			geometry: feature.geometry
		};
	}).filter((feature) => feature.id > 0 && feature.id <= 180);
	const byId = new Map(features.map((feature) => [feature.id, feature]));
	if (byId.size !== 180 || features.length !== 180) throw new Error('Rejected incomplete or duplicate district release');
	// Merge BEFORE simplifying, retaining shared district topology and eliminating internal seams.
	const regions = REGIONS.map((region) => {
		const merged = union({ type: 'FeatureCollection', features: region.districts.map((id) => byId.get(id)) });
		if (!merged) throw new Error(`Cannot dissolve ${region.id}`);
		return {
			type: 'Feature', id: region.id,
			properties: { id: region.id, name: region.name, shortName: region.shortName, focus: region.focus, districtCount: region.districts.length },
			geometry: rewind(simplify(merged, { tolerance: 0.0005, highQuality: true }), { reverse: true }).geometry
		};
	});
	const metadata = {
		source: `Census TIGER/Line ${year} / Georgia SLDL`, boundarySession: String(year),
		importedFrom: createHash('sha256').update(bytes).digest('hex'),
		generatedAt: new Date().toISOString()
	};
	const existing = JSON.parse(await readFile(new URL('../static/data/georgia-house-districts.json', import.meta.url), 'utf8'));
	const changed = JSON.stringify(existing.features) !== JSON.stringify(features);
	if (!changed) { console.log('No geometry change.'); } else {
		// All geometry validation/dissolution completes before replacing either checked-in artifact.
		await writeFile(new URL('../static/data/georgia-house-districts.json', import.meta.url), JSON.stringify({ type: 'FeatureCollection', metadata, features }));
		await writeFile(new URL('../static/data/georgia-regions.json', import.meta.url), JSON.stringify({ type: 'FeatureCollection', metadata, features: regions }));
		console.log(`Staged ${year} boundaries. Review boundary/ACS vintage compatibility before publishing RMI.`);
	}
} finally { await rm(dir, { recursive: true, force: true }); }
