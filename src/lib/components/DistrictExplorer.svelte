<script lang="ts">
	import { base } from '$app/paths';
	import { onDestroy, onMount } from 'svelte';
	import type { DistrictCollection } from '$lib/map/types';
	import type GeorgiaDistrictMap from '$lib/map/GeorgiaDistrictMap.svelte';

	let collection = $state<DistrictCollection | null>(null);
	let Map = $state<typeof GeorgiaDistrictMap | null>(null);
	let loading = $state(false);
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	let failure = $state('');
	let selectedId = $state<number | null>(null);
	let selected = $derived(collection?.features.find((feature) => feature.id === selectedId));
	let controller: AbortController | undefined;
	onDestroy(() => controller?.abort());

	async function loadMap() {
		if (loading) return;
		loading = true;
		failure = '';
		controller = new AbortController();
		try {
			const [module, response] = await Promise.all([
				import('$lib/map/GeorgiaDistrictMap.svelte'),
				fetch(`${base}/data/georgia-house-districts.json`, { signal: controller.signal })
			]);
			if (!response.ok) throw new Error('Boundary request failed');
			const data: DistrictCollection = await response.json();
			if (data.type !== 'FeatureCollection' || data.features?.length !== 180) {
				throw new Error('Invalid boundary collection');
			}
			if (controller.signal.aborted) return;
			collection = data;
			Map = module.default;
		} catch (error) {
			if (!(error instanceof DOMException && error.name === 'AbortError')) {
				failure = 'The map could not load. Please try again.';
			}
		} finally {
			loading = false;
		}
	}
</script>

<section class="explorer" aria-labelledby="district-map-title">
	<header>
		<p class="eyebrow">Georgia / District atlas</p>
		<h2 id="district-map-title">One state. 180 House districts.</h2>
		<p>
			Explore Georgia’s legislative boundaries. Select a district on the map or use the district
			list.
		</p>
	</header>
	{#if Map && collection}
		<div class="workspace">
			<div class="canvas">
				<Map features={collection.features} {selectedId} onselect={(id) => (selectedId = id)} />
			</div>
			<aside aria-label="District information">
				<label for="house-district">Choose a House district</label>
				<select id="house-district" bind:value={selectedId}>
					<option value={null}>Select district</option>
					{#each collection.features as district (district.id)}
						<option value={district.id}>House District {district.properties.number}</option>
					{/each}
				</select>
				<div aria-live="polite" class="detail">
					{#if selected}
						<p class="eyebrow">Selected boundary</p>
						<h3>House District {selected.properties.number}</h3>
						<p>Georgia House of Representatives</p>
						<p>Source boundary session: {selected.properties.session}</p>
					{:else}
						<h3>Explore the state</h3>
						<p>
							Tap a district to inspect it. The district list also works with a keyboard or screen
							reader.
						</p>
					{/if}
				</div>
				<p class="note">
					Uniform shading shows boundaries only, not donations, participation, or organizational
					presence. No activity data is connected.
				</p>
				<a
					href="https://www.legis.ga.gov/find-my-legislator"
					target="_blank"
					rel="noopener noreferrer">Verify your district on Georgia’s official site ↗</a
				>
			</aside>
		</div>
	{:else}
		<div class="placeholder" aria-busy={loading}>
			<span class="atlas-number" aria-hidden="true">180</span>
			<p>District boundaries, without tracking or third-party map tiles.</p>
			<button onclick={loadMap} disabled={loading || !ready}
				>{loading
					? 'Loading boundaries…'
					: failure
						? 'Retry loading map'
						: 'Load interactive map'}</button
			>
			{#if failure}<p role="alert">{failure}</p>{/if}
		</div>
	{/if}
	<footer>
		<span>Boundary snapshot · 2024 session label</span>
		<span>Census TIGER/Line via ga-gms-map · Not an address lookup</span>
	</footer>
</section>

<style>
	.explorer {
		--atlas-accent: #c8da87;
		background: #111511;
		color: #e8eae1;
		border-block: 1px solid #465041;
		padding: clamp(20px, 4vw, 56px);
		font-family: system-ui, sans-serif;
	}
	header {
		max-width: 780px;
		margin-bottom: 28px;
	}
	.eyebrow {
		font:
			12px ui-monospace,
			monospace;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--atlas-accent);
		margin-bottom: 12px;
	}
	h2,
	h3 {
		font-family: system-ui, sans-serif;
		color: #f5f6ef;
	}
	h2 {
		font-size: clamp(28px, 4vw, 48px);
		line-height: 1.1;
		margin-bottom: 16px;
	}
	h3 {
		font-size: 24px;
		margin-bottom: 12px;
	}
	p {
		line-height: 1.65;
	}
	.workspace {
		display: grid;
		grid-template-columns: minmax(0, 1.7fr) minmax(260px, 1fr);
		border: 1px solid #465041;
	}
	.canvas {
		padding: 20px;
		background: radial-gradient(ellipse, #222b21, #111511);
	}
	aside {
		padding: 28px;
		border-left: 1px solid #465041;
	}
	label {
		display: block;
		font:
			12px ui-monospace,
			monospace;
		margin-bottom: 10px;
	}
	select {
		width: 100%;
		min-height: 48px;
		padding: 10px;
		border: 1px solid #7b876f;
		background: #171e17;
		color: #fff;
		border-radius: 0;
	}
	.detail {
		padding-block: 28px;
	}
	.note {
		font-size: 14px;
		color: #b9c1b3;
		margin-bottom: 24px;
	}
	a {
		color: var(--atlas-accent);
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.placeholder {
		padding: 30px 20px;
		text-align: center;
		border: 1px solid #465041;
	}
	.atlas-number {
		display: block;
		font:
			clamp(64px, 12vw, 120px) ui-monospace,
			monospace;
		color: #a0ad8c;
		line-height: 1.2;
	}
	button {
		display: inline-block;
		min-height: 48px;
		padding: 12px 20px;
		margin-top: 20px;
		background: var(--atlas-accent);
		color: #172017;
		font-weight: 700;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.65;
		cursor: wait;
	}
	button:focus-visible,
	select:focus-visible,
	a:focus-visible {
		outline: 3px solid #fff;
		outline-offset: 4px;
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 8px;
		margin-top: 18px;
		font:
			11px/1.6 ui-monospace,
			monospace;
		color: #b9c1b3;
	}
	@media (max-width: 700px) {
		.workspace {
			grid-template-columns: 1fr;
		}
		aside {
			border-left: 0;
			border-top: 1px solid #465041;
			padding: 20px;
		}
		.canvas {
			padding: 8px;
		}
	}
</style>
