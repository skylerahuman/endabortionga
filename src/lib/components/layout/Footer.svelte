<script lang="ts">
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { displayFlags } from '$lib/config/display';
	const flags = $derived(displayFlags(env));
	import { NavCategories, PagesWithHiddenNav } from '$lib/config/navigation';

	const isHidden = $derived(PagesWithHiddenNav.includes(page.url.pathname));
</script>

{#if !isHidden}
	<footer class="relative z-10 bg-void text-parchment-muted py-16 md:py-20 border-t border-charcoal">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<!-- Ornamental Divider -->
			<div class="mb-12">
				<div class="divider-ornate text-gold-muted">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
						<path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
					</svg>
				</div>
			</div>

			<div class="grid md:grid-cols-3 gap-10 mb-12">
				{#each NavCategories as category}
					<div>
						<h3 class="font-ui text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-4 pb-2 border-b border-charcoal">
							{category.name}
						</h3>
						<ul class="space-y-2">
							{#each category.links as link}
								<li><a href={link.href} class="text-sm text-parchment-muted hover:text-gold">{link.label}</a></li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>

			<!-- Footer Info -->
			<div class="text-center">
				{#if flags.previewLabels}
					<p class="text-center text-sm text-parchment-muted mb-6">Development preview · organization disclosures pending.</p>
				{/if}
				<div class="font-ui text-[10px] text-parchment-dark uppercase tracking-[0.2em] space-y-2 leading-relaxed">
					<p>&copy; {new Date().getFullYear()} End Abortion Georgia</p>
				</div>
			</div>
		</div>
	</footer>
{/if}
