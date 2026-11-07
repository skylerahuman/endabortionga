import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstream = resolve(root, process.argv[2] ?? '../ga-gms-map');
const refresh = process.argv.includes('--refresh');

async function main() {
	if (refresh) {
		execFileSync('npm', ['run', 'data:build'], { cwd: upstream, stdio: 'inherit' });
	}
	const source = resolve(upstream, 'data/districts.json');
	const raw = JSON.parse(await readFile(source, 'utf8'));
	const ids = raw.features.map((feature) => feature.id).sort((a, b) => a - b);
	if (ids.length !== 180 || new Set(ids).size !== 180 || ids[0] !== 1 || ids[179] !== 180) {
		throw new Error('Boundary refresh rejected: expected 180 unique districts numbered 1–180.');
	}
	const features = raw.features.map(({ id, properties, geometry }) => ({
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
			importedFrom: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim(),
			boundarySession: [...new Set(features.map((feature) => feature.properties.session))].join(', '),
			refreshedAt: new Date().toISOString()
		},
		features
	};
	await mkdir(resolve(root, 'static/data'), { recursive: true });
	await writeFile(resolve(root, 'static/data/georgia-house-districts.json'), JSON.stringify(output));
	console.log('Validated and imported district boundaries.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
