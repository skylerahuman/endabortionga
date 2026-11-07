<script lang="ts">
	import { projectDistricts } from './projection';
	import type { DistrictFeature } from './types';

	let {
		features,
		selectedId,
		onselect
	}: {
		features: DistrictFeature[];
		selectedId: number | null;
		onselect: (id: number) => void;
	} = $props();
	let { projected, viewBox } = $derived(projectDistricts(features));

	function handleKey(event: KeyboardEvent, id: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onselect(id);
		}
		if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
			event.preventDefault();
			const step = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
			const next = ((id - 1 + step + 180) % 180) + 1;
			onselect(next);
			(event.currentTarget as SVGElement).ownerSVGElement
				?.querySelector<SVGElement>(`[data-district="${next}"]`)
				?.focus();
		}
	}
</script>

<svg viewBox={viewBox.join(' ')} role="group" aria-label="Georgia House district boundaries">
	{#each projected as item (item.feature.id)}
		<path
			d={item.path}
			class:selected={selectedId === item.feature.id}
			data-district={item.feature.id}
			role="button"
			tabindex={item.feature.id === (selectedId ?? 1) ? 0 : -1}
			aria-label={item.feature.properties.name}
			aria-pressed={selectedId === item.feature.id}
			onclick={() => onselect(item.feature.id)}
			onkeydown={(event) => handleKey(event, item.feature.id)}
		>
			<title>{item.feature.properties.name}</title>
		</path>
	{/each}
	<g aria-hidden="true">
		{#each projected as item (item.feature.id)}
			{#if item.size > 1100 || item.feature.id === selectedId}
				<text x={item.label[0]} y={item.label[1]} text-anchor="middle" dominant-baseline="central">
					{item.feature.properties.number}
				</text>
			{/if}
		{/each}
	</g>
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
		min-height: 320px;
		max-height: 650px;
	}
	path {
		fill: #353a35;
		stroke: #a4aa9e;
		stroke-width: 1;
		cursor: pointer;
	}
	path:hover {
		fill: #636b58;
	}
	path.selected,
	path:focus-visible {
		fill: #c8da87;
		stroke: #fff;
		stroke-width: 3;
		outline: none;
	}
	text {
		fill: #fff;
		font:
			13px ui-monospace,
			monospace;
		pointer-events: none;
		paint-order: stroke;
		stroke: #172017;
		stroke-width: 3px;
	}
</style>
