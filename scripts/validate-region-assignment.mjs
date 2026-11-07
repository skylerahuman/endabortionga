import { REGIONS, validateRegionCoverage } from '../src/lib/config/regions.ts';
import membership from '../src/lib/config/region-membership.json' with { type: 'json' };
if (!validateRegionCoverage().valid) throw new Error('Expected 180 unique district assignments');
for (const region of REGIONS) {
	const allowed = new Set(region.districts);
	const seen = new Set([region.districts[0]]),
		queue = [region.districts[0]];
	while (queue.length)
		for (const next of membership.neighbors[queue.pop()]) {
			if (allowed.has(next) && !seen.has(next)) {
				seen.add(next);
				queue.push(next);
			}
		}
	if (seen.size !== allowed.size) throw new Error(`${region.id} is not contiguous`);
	if (allowed.size < 25 || allowed.size > 35)
		throw new Error(`${region.id} exceeds coordinator range`);
}
console.log('Validated 180 districts in six contiguous regions, 25–35 districts each.');
