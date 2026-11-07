import type { MultiPolygon, Polygon } from 'geojson';
import type { RegionId } from '$lib/config/regions';

export interface RegionFeature {
	type: 'Feature';
	id: RegionId;
	properties: {
		id: RegionId;
		name: string;
		shortName: string;
		focus: string;
		districtCount: number;
	};
	geometry: Polygon | MultiPolygon;
}

export interface RegionCollection {
	type: 'FeatureCollection';
	metadata: {
		boundarySession: string;
		generatedAt: string;
	};
	features: RegionFeature[];
}

export interface DistrictCollection {
	type: 'FeatureCollection';
	metadata: {
		source: string;
		importedFrom: string;
		boundarySession: string;
	};
	features: DistrictFeature[];
}

export interface DistrictFeature {
	type: 'Feature';
	id: number;
	properties: {
		id: number;
		number: number;
		name: string;
		session: string;
		labelPoint: [number, number];
	};
	geometry: Polygon | MultiPolygon;
}
