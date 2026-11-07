<script lang="ts">
	import { projectRegions, projectLongitudeLatitude } from './region-projection';
	import { CHURCH_SEEDS } from './churches';
	import type { RegionFeature } from './region-types';

	interface Props {
		features: RegionFeature[];
		selectedId?: string | null;
		bandById?: Record<string, string>;
		labels?: boolean;
		onhover?: (id: string | null) => void;
		onselect?: (id: string) => void;
	}

	let {
		features,
		selectedId = null,
		bandById = {},
		labels = true,
		onhover,
		onselect
	}: Props = $props();
	const patternId = $props.id();
	let { projected, viewBox } = $derived(projectRegions(features));
	let seeds = $derived(
		CHURCH_SEEDS.map((seed) => ({
			...seed,
			point: projectLongitudeLatitude(seed.longitude, seed.latitude, features)
		}))
	);

	function handleKey(event: KeyboardEvent, id: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onselect?.(id);
		}
	}
</script>

<svg viewBox={viewBox.join(' ')} role="group" aria-label="Six Georgia mobilization regions">
	<defs>
		<pattern id={patternId} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(35)">
			<rect width="12" height="12" fill="#292927" />
			<path d="M0 0V12" stroke="#65635c" stroke-width="1.3" />
		</pattern>
	</defs>
	{#each projected as item (item.feature.id)}
		<path
			d={item.path}
			fill={(bandById[item.feature.id] ?? 'unengaged') === 'unengaged' ? `url(#${patternId})` : undefined}
			class="region {bandById[item.feature.id] ?? 'unengaged'}"
			class:selected={selectedId === item.feature.id}
			data-region={item.feature.id}
			role="button"
			tabindex="0"
			aria-label="{item.feature.properties.name} region"
			aria-pressed={selectedId === item.feature.id}
			onpointerenter={() => onhover?.(item.feature.id)}
			onpointerleave={() => onhover?.(null)}
			onfocus={() => onhover?.(item.feature.id)}
			onblur={() => onhover?.(null)}
			onclick={() => onselect?.(item.feature.id)}
			onkeydown={(event) => handleKey(event, item.feature.id)}
		>
			<title>{item.feature.properties.name}</title>
		</path>
	{/each}
	{#if labels}
		<g class="labels" aria-hidden="true">
			{#each projected as item (item.feature.id)}
				<text
					x={item.centroid[0]}
					y={item.centroid[1]}
					text-anchor="middle"
					dominant-baseline="central"
				>
					{item.feature.properties.shortName}
				</text>
			{/each}
		</g>
	{/if}
	{#each seeds as seed (seed.id)}
		<g
			class="seed"
			transform="translate({seed.point[0]}, {seed.point[1]})"
			role="img"
			aria-label="{seed.name}, seed church, approximate location"
		>
			<title>{seed.name} · Macon · approximate location pending verification</title>
			<ellipse
				rx="5"
				ry="8"
				transform="rotate(35)"
				fill="#d4a84b"
				stroke="#fff1b2"
				stroke-width="1"
			/>
			<path d="M-2 5L2-5" stroke="#6f4b16" stroke-width="1" fill="none" />
		</g>
	{/each}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: min(80svh, 780px);
		min-height: 320px;
	}
	.region {
		stroke: #080b08;
		stroke-width: 2;
		cursor: pointer;
		transition:
			fill 180ms ease,
			filter 180ms ease;
	}
	.region:hover,
	.region:focus-visible {
		filter: brightness(1.18);
		outline: none;
	}
	.region.selected {
		stroke: #f5f1e6;
		stroke-width: 4;
		filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
	}
	.region.low {
		fill: #59664b;
	}
	.region.medium {
		fill: #889552;
	}
	.region.high {
		fill: #c8a84b;
	}
	.region.highest {
		fill: #9b453e;
	}
	.labels text {
		fill: #fff;
		font:
			700 20px ui-monospace,
			monospace;
		letter-spacing: 0.06em;
		pointer-events: none;
		paint-order: stroke;
		stroke: rgba(5, 8, 5, 0.75);
		stroke-width: 3px;
	}
	@media (max-width: 700px) {
		svg {
			height: 48svh;
			min-height: 290px;
		}
	}
</style>
