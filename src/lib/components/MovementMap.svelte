<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { displayFlags } from '$lib/config/display';
	import GeorgiaRegionMap from '$lib/map/GeorgiaRegionMap.svelte';
	import type { RegionCollection } from '$lib/map/region-types';
	import type { RegionAggregate, RegionAggregatesResponse } from '$lib/server/aggregates';

	const flags = $derived(displayFlags(env));
	let collection = $state<RegionCollection | null>(null);
	let aggregates = $state<RegionAggregate[]>([]);
	let selectedId = $state<string | null>(null);
	let loadError = $state('');
	let statsError = $state('');
	let loading = $state(true);
	let disposed = false;
	const controller = new AbortController();
	const bandById = $derived(Object.fromEntries(aggregates.map((r) => [r.regionId, r.band])));
	const selected = $derived(aggregates.find((r) => r.regionId === selectedId));
	const ranked = $derived([...aggregates].sort((a, b) => b.rmi - a.rmi));

	async function refreshStats() {
		try {
			const response = await fetch('/api/regions', { signal: controller.signal, cache: 'no-store' });
			if (!response.ok) throw new Error();
			const data: RegionAggregatesResponse = await response.json();
			if (!Array.isArray(data.regions)) throw new Error();
			if (!disposed) { aggregates = data.regions; statsError = ''; }
		} catch { if (!disposed) statsError = 'Participation totals are unavailable.'; }
	}
	async function loadMap() {
		loading = true; loadError = '';
		try {
			const response = await fetch('/data/georgia-regions.json', { signal: controller.signal });
			if (!response.ok) throw new Error();
			const next: RegionCollection = await response.json();
			if (!Array.isArray(next.features) || next.features.length !== 6) throw new Error();
			if (!disposed) collection = next;
		} catch { if (!disposed) loadError = 'The map could not load.'; }
		finally { if (!disposed) loading = false; }
	}
	onMount(() => {
		void loadMap(); void refreshStats();
		const timer = setInterval(() => { if (!document.hidden) void refreshStats(); }, 30_000);
		window.addEventListener('movement:activity', refreshStats);
		return () => {
			disposed = true; controller.abort(); clearInterval(timer);
			window.removeEventListener('movement:activity', refreshStats);
		};
	});
</script>

<section class="movement" aria-label="Georgia regions">
	<h1 class="sr-only">Georgia regions</h1>
	{#if flags.previewLabels}
		<p class="preview-note" data-testid="preview-label">Development preview</p>
	{/if}
	<div class="layout">
		<div class="map-panel">
			{#if collection}
				<GeorgiaRegionMap features={collection.features} {selectedId} {bandById}
					onselect={(id) => selectedId = id === selectedId ? null : id} />
			{:else if loading}
				<div class="loading" role="status">Loading map…</div>
			{:else}
				<div class="loading"><p role="alert">{loadError}</p><button onclick={loadMap}>Retry map</button></div>
			{/if}
			<div class="legend" aria-label="Map legend">
				<span><i class="unengaged"></i> Unengaged</span>
				<span><i class="ramp"></i> Engaged</span>
			</div>
		</div>
		<aside aria-label="Region participation and rankings">
			<div class="ranking">
				<div class="ranking-head"><h2>Participation</h2><span>RMI</span></div>
				{#if statsError}<p role="status">{statsError}</p>{/if}
				<ol>
					{#each ranked as region, index (region.regionId)}
						<li><button class:active={region.regionId === selectedId} onclick={() => selectedId = region.regionId} aria-pressed={region.regionId === selectedId}>
							<span class="rank">{region.rmi > 0 ? index + 1 : '—'}</span>
							<span>{region.name}</span><span class="score">{region.rmi.toFixed(2)}</span>
						</button></li>
					{/each}
				</ol>
			</div>
			{#if selected}
				<div class="detail" aria-live="polite">
					<h2>{selected.name}</h2><p class="state">{selected.engaged ? 'Engaged' : 'Unengaged'}</p>
					<dl>
						<div><dt>Relative mobilization</dt><dd>{selected.rmi.toFixed(2)}</dd></div>
						<div><dt>Participating people</dt><dd>{selected.participatingPeople}</dd></div>
						<div><dt>Giving recorded</dt><dd>${(selected.donationCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd></div>
					</dl>
					<div class="actions"><a href="/connect">Connect</a><a href="/support">Give</a></div>
				</div>
			{/if}
			<p class="privacy">The map shows aggregate movement activity only. No household or personal data is published.</p>
			{#if flags.mapDebug}
				<details class="debug" data-testid="map-debug"><summary>Map diagnostics</summary>
					<p>Boundary session: {collection?.metadata.boundarySession ?? 'loading'}</p>
					<p>RMI: ($ / 100 + people) / capacity × 100,000. Bands: 10 / 25 / 50.</p>
				</details>
			{/if}
		</aside>
	</div>
</section>

<style>
	.movement { background: #171716; color: #f5f1e6; padding: clamp(10px, 2vw, 24px); font-family: system-ui, sans-serif; }
	.layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(290px, 0.7fr); max-width: 1440px; margin: auto; border: 1px solid #41403c; }
	.map-panel { min-width: 0; padding: 16px; background: radial-gradient(ellipse, #292927, #191918); }
	.loading { min-height: 400px; display: grid; align-content: center; justify-items: center; gap: 12px; }
	.legend { display: flex; justify-content: center; gap: 24px; padding: 12px; font: 11px ui-monospace, monospace; color: #cecac1; }
	.legend span { display: inline-flex; align-items: center; gap: 8px; }
	.legend i { width: 20px; height: 14px; border: 1px solid #65635b; }
	.unengaged { background: repeating-linear-gradient(135deg, #292927 0 3px, #62615a 3px 4px, #292927 4px 8px); }
	.ramp { background: linear-gradient(to right, #59664b, #889552, #c8a84b, #9b453e); width: 56px !important; }
	aside { border-left: 1px solid #41403c; display: flex; flex-direction: column; }
	.ranking, .detail { padding: 24px; }
	.ranking-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
	.ranking-head > span { font: 11px ui-monospace, monospace; color: #aaa59a; }
	h2 { color: #f5f1e6; font: 600 23px/1.2 system-ui, sans-serif; margin: 0; }
	ol { list-style: none; padding: 0; margin: 18px 0 0; }
	li + li { border-top: 1px solid #3b3934; }
	button { cursor: pointer; }
	li button { width: 100%; display: grid; grid-template-columns: 20px 1fr auto; gap: 10px; align-items: center; min-height: 52px; padding: 10px 0; border: 0; background: none; color: #f5f1e6; text-align: left; font-size: 14px; }
	li button:hover, li button.active { color: #d4a84b; }
	.rank { color: #8f8a80; font: 12px ui-monospace, monospace; }
	.score { color: #d4a84b; font: 700 12px ui-monospace, monospace; }
	.detail { border-top: 1px solid #41403c; }
	.state { margin-top: 10px; font: 12px ui-monospace, monospace; color: #bfb9ae; }
	dl { margin: 20px 0; }
	dl > div { display: flex; justify-content: space-between; padding: 8px 0; gap: 12px; font-size: 13px; }
	dt { color: #bfb9ae; } dd { margin: 0; font-family: ui-monospace, monospace; }
	.actions { display: flex; gap: 24px; }
	a { color: #d4a84b; text-decoration: underline; text-underline-offset: 4px; }
	.privacy { color: #b0aa9f; font-size: 12px; line-height: 1.65; padding: 24px; margin: auto 0 0; border-top: 1px solid #41403c; }
	.preview-note, .debug { font: 11px/1.6 ui-monospace, monospace; padding: 12px; color: #b0aa9f; }
	button:focus-visible, a:focus-visible { outline: 2px solid #d4a84b; outline-offset: 4px; }
	@media (max-width: 760px) {
		.layout { grid-template-columns: 1fr; } aside { border-left: 0; border-top: 1px solid #41403c; }
		.map-panel { padding: 8px; } .ranking, .detail { padding: 18px; }
		.privacy { padding: 18px; } .ranking li button { min-height: 44px; }
	}
</style>
