<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { PagesWithHiddenNav } from '$lib/config/navigation';
	import { base } from '$app/paths';

	interface Props {
		onMenuToggle: () => void;
		menuOpen?: boolean;
	}

	let { onMenuToggle, menuOpen = false }: Props = $props();
	let ready = $state(false);
	onMount(() => { ready = true; });
	const isHidden = $derived(PagesWithHiddenNav.includes(page.url.pathname));

</script>

{#if !isHidden}
	<header class="nav-container bg-void/95 backdrop-blur-md text-parchment sticky top-0 z-50 border-b border-charcoal">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16 md:h-20">
				<!-- Logo -->
				<a href="{base}/" class="flex items-center gap-3 group" aria-label="End Abortion Georgia home">
					<svg class="hidden sm:block h-8 w-8" viewBox="0 0 48 48" aria-hidden="true">
						<circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="2" />
						<path d="M24 36c-9-6-15-11-15-18 0-6 4-10 9-10 3 0 5 1 6 3 1-2 3-3 6-3 5 0 9 4 9 10 0 7-6 12-15 18Z" fill="currentColor" />
					</svg>
					<span class="font-display text-base sm:text-xl md:text-2xl font-semibold tracking-tight text-parchment group-hover:text-gold transition-colors">
						End Abortion Georgia
					</span>
				</a>

				<!-- Right side: Join CTA + Menu -->
				<div class="flex items-center gap-3 md:gap-6">
					<a href="{base}/connect" class="inline-flex items-center min-h-11 text-xs font-ui text-parchment hover:text-gold">Connect</a>
					<a href="{base}/support" class="inline-flex items-center min-h-11 text-xs font-ui text-gold">Give</a>

					<!-- Menu Button -->
					<button
						type="button"
						onclick={onMenuToggle}
						class="text-parchment-muted hover:text-gold focus:outline-none p-2 transition-colors"
						aria-label="Toggle menu"
						aria-expanded={menuOpen}
						disabled={!ready}
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</header>
{/if}
