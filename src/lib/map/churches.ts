export interface ChurchSeed {
	id: string;
	name: string;
	city: string;
	longitude: number;
	latitude: number;
	regionId: string;
	kind: 'seed_church';
	locationStatus: 'verified' | 'approximate';
	locationSource?: string;
}

export const CHURCH_SEEDS: ChurchSeed[] = [
	{
		id: 'pine-forest-baptist-macon',
		name: 'Pine Forest Baptist Church',
		city: 'Macon',
		longitude: -83.6935162,
		latitude: 32.7926406,
		locationStatus: 'approximate',
		locationSource: 'OpenStreetMap / Nominatim place-name match; confirm before public launch',
		regionId: 'middle-georgia',
		kind: 'seed_church'
	}
];
