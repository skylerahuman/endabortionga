import { readFile, writeFile } from 'node:fs/promises';
import { read as readShapefile } from 'shapefile';

// Geographic partition + coordinator workload balancing only; no individual data.
// Region membership is materialized/check-in reviewed; never changes at request time.
const input = process.argv[2] ?? '../ga-gms-map/data/raw/tl_2025_13_sldl.shp';
const original = await readShapefile(input, input.replace(/\.shp$/, '.dbf'));
const source = JSON.parse(await readFile('../ga-gms-map/data/districts.json', 'utf8'));
const centers = new Map(source.features.map((f) => [f.id, f.properties.centroid]));
const neighbors = new Map(Array.from({ length: 180 }, (_, i) => [i + 1, new Set()]));
const edges = new Map();
const key = (point) => point.map((n) => n.toFixed(6)).join(',');
for (const feature of original.features) {
	const id = Number(feature.properties.SLDLST);
	if (!neighbors.has(id)) continue;
	const polygons =
		feature.geometry.type === 'Polygon'
			? [feature.geometry.coordinates]
			: feature.geometry.coordinates;
	for (const polygon of polygons)
		for (const ring of polygon)
			for (let i = 1; i < ring.length; i++) {
				const ends = [key(ring[i - 1]), key(ring[i])].sort();
				const edge = ends.join('|');
				if (ends[0] === ends[1]) continue;
				const other = edges.get(edge);
				if (other && other !== id) {
					neighbors.get(id).add(other);
					neighbors.get(other).add(id);
				} else edges.set(edge, id);
			}
}
const anchors = {
	'north-georgia': [-84.7, 34.65],
	'west-metro': [-84.65, 33.74],
	'east-metro': [-84.0, 33.87],
	'middle-georgia': [-83.65, 32.7],
	'south-georgia': [-83.8, 31.1],
	'coastal-georgia': [-81.45, 31.85]
};
const distance = (a, b) => Math.hypot((a[0] - b[0]) * 0.84, a[1] - b[1]);
const assignments = new Map();
const members = Object.fromEntries(Object.keys(anchors).map((id) => [id, []]));
const queue = [];
for (const [region, center] of Object.entries(anchors)) {
	const seed = [...centers.keys()]
		.filter((id) => !assignments.has(id))
		.sort((a, b) => distance(centers.get(a), center) - distance(centers.get(b), center))[0];
	assignments.set(seed, region);
	members[region].push(seed);
}
function frontier(id, region, traveled) {
	for (const next of neighbors.get(id))
		if (!assignments.has(next)) {
			// Keep the mountain/northern border districts in North Georgia, not a metro finger.
			if (centers.get(next)[1] >= 34.25 && region !== 'north-georgia') continue;
			queue.push({
				next,
				region,
				traveled: traveled + distance(centers.get(id), centers.get(next))
			});
		}
}
for (const [id, region] of assignments) frontier(id, region, 0);
while (queue.length) {
	queue.sort(
		(a, b) =>
			a.traveled + members[a.region].length * 0.4 - (b.traveled + members[b.region].length * 0.4) ||
			a.next - b.next
	);
	const { next, region, traveled } = queue.shift();
	if (assignments.has(next)) continue;
	assignments.set(next, region);
	members[region].push(next);
	frontier(next, region, traveled);
}
if (assignments.size !== 180)
	throw new Error(
		`Graph disconnected; unassigned districts: ${[...neighbors.keys()].filter((id) => !assignments.has(id))}`
	);
function connected(ids) {
	const allowed = new Set(ids),
		seen = new Set([ids[0]]),
		pending = [ids[0]];
	while (pending.length)
		for (const next of neighbors.get(pending.pop())) {
			if (allowed.has(next) && !seen.has(next)) {
				seen.add(next);
				pending.push(next);
			}
		}
	return seen.size === ids.length;
}
// Transfer border districts only when both resulting regions stay contiguous.
for (const region of Object.keys(members))
	while (members[region].length < 25) {
		const candidates = [...assignments.keys()]
			.filter((id) => {
				const donor = assignments.get(id);
				return (
					donor !== region &&
					members[donor].length > 25 &&
					(centers.get(id)[1] < 34.25 || region === 'north-georgia') &&
					[...neighbors.get(id)].some((next) => assignments.get(next) === region) &&
					connected(members[donor].filter((other) => other !== id))
				);
			})
			.sort(
				(a, b) =>
					distance(centers.get(a), anchors[region]) - distance(centers.get(b), anchors[region])
			);
		if (!candidates.length) throw new Error(`Cannot balance ${region} without breaking contiguity`);
		const id = candidates[0],
			donor = assignments.get(id);
		members[donor] = members[donor].filter((other) => other !== id);
		members[region].push(id);
		assignments.set(id, region);
	}
for (const [region, list] of Object.entries(members)) {
	if (!connected(list) || list.length > 35) throw new Error(`Invalid final region ${region}`);
	list.sort((a, b) => a - b);
}
const out = {
	version: 'geographic-v2',
	method:
		'Contiguous multi-source district-adjacency partition; geographic distance with district-count workload balancing',
	anchors,
	regions: members,
	neighbors: Object.fromEntries(
		[...neighbors].map(([id, adjacent]) => [id, [...adjacent].sort((a, b) => a - b)])
	)
};
await writeFile('src/lib/config/region-membership.json', JSON.stringify(out, null, '\t') + '\n');
console.log(Object.fromEntries(Object.entries(members).map(([id, ids]) => [id, ids.length])));
