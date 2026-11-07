import { readFile, writeFile } from 'node:fs/promises';

const input = new URL('../static/data/zip_to_district.csv', import.meta.url);
const text = await readFile(input, 'utf8');
const mapping = {};
for (const line of text.trim().split(/\r?\n/).slice(1)) {
	const [zip, district] = line.split(',');
	if (/^\d{5}$/.test(zip) && /^\d{3}$/.test(district)) mapping[zip] = district;
}
await writeFile(
	new URL('../static/data/zip_to_district.json', import.meta.url),
	JSON.stringify(mapping)
);
console.log(`Converted ${Object.keys(mapping).length} ZIP mappings.`);
