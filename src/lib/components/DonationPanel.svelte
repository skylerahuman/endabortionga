<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { displayFlags } from '$lib/config/display';
	const flags = $derived(displayFlags(env));
	let campaign = $state<string | null>(null);
	let token = $state<string | null>(null);
	let busy = $state(false);
	let loaded = $state(false);
	let errorMessage = $state('');
	let message = $state('');
	onMount(() => {
		const controller = new AbortController();
		void (async () => {
			try {
				const response = await fetch('/api/donations/config', { signal: controller.signal });
				if (!response.ok) throw new Error();
				campaign = (await response.json()).campaign;
			} catch { if (!controller.signal.aborted) errorMessage = 'Giving is unavailable.'; }
			finally { if (!controller.signal.aborted) loaded = true; }
		})();
		return () => controller.abort();
	});
	async function prepareDonation() {
		busy = true; errorMessage = ''; message = '';
		try {
			const identity = await (await fetch('/api/me', { cache: 'no-store' })).json();
			if (!identity.authenticated || !identity.assignment) throw new Error('Sign in and choose your district first.');
			const response = await fetch('/api/donations/attribution', {
				method: 'POST', headers: { 'x-csrf-token': identity.csrfToken }
			});
			if (!response.ok) throw new Error('Unable to open checkout.');
			token = (await response.json()).token;
			if (!campaign) message = 'Test attribution saved. No payment requested.';
		} catch (cause) { errorMessage = cause instanceof Error ? cause.message : 'Giving is unavailable.'; }
		finally { busy = false; }
	}
</script>
<section class="giving" aria-labelledby="giving-title">
	<h1 id="giving-title">Give</h1>
	{#if !loaded}<p role="status">Loading…</p>
	{:else if campaign}
		{#if token}
			<a class="checkout" href="https://givebutter.com/{encodeURIComponent(campaign)}?utm_source=movement-map&utm_content={encodeURIComponent(token)}" rel="noreferrer">Continue to checkout ↗</a>
		{:else}<button onclick={prepareDonation} disabled={busy}>{busy ? 'Opening checkout…' : 'Continue to checkout'}</button>{/if}
	{:else}<p>Giving is not available yet.</p>{/if}
	<a href="/connect">Your account</a>
	{#if flags.mapDebug && loaded && !campaign}
		<details data-testid="giving-debug"><summary>Checkout diagnostics</summary>
			<p>Givebutter is not configured.</p>
			<button onclick={prepareDonation} disabled={busy}>Test attribution</button>
		</details>
	{/if}
	{#if errorMessage}<p role="alert">{errorMessage}</p>{/if}
	{#if message}<p role="status">{message}</p>{/if}
</section>
<style>
	.giving { background: #191918; color: #f5f1e6; min-height: 65svh; padding: clamp(24px, 5vw, 64px); display: flex; flex-direction: column; align-items: flex-start; gap: 24px; }
	h1 { font: 600 36px system-ui, sans-serif; margin: 0; }
	p, a, button { font-family: system-ui, sans-serif; }
	a { color: #d4a84b; text-decoration: underline; text-underline-offset: 4px; }
	button, .checkout { background: #d4a84b; color: #191918; border: 0; padding: 14px 24px; min-height: 48px; cursor: pointer; }
	details { font: 12px/1.6 ui-monospace, monospace; color: #aaa59b; }
</style>
