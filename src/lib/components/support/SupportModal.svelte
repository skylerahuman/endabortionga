<script lang="ts">
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { supportModalOpen, supportModalType } from '$lib/stores';

	function close() {
		supportModalOpen.set(false);
		supportModalType.set(null);
	}

	function handleKeydown(e: KeyboardEvent) {
		if ($supportModalOpen && e.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $supportModalOpen}
	<div
		class="fixed inset-0 bg-charcoal/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
		onclick={close}
		onkeydown={(e) => e.key === 'Enter' && close()}
		role="button"
		tabindex="-1"
		aria-label="Close modal"
	>
		<div
			class="bg-panel border border-white/5 rounded-sm shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<header class="flex items-center justify-between p-6 border-b border-gold/30">
				<h2 class="text-xl font-bold text-bone uppercase tracking-wider">
					{#if $supportModalType === 'prayer'}Prayer{:else}Donations{/if}
				</h2>
				<button
					onclick={close}
					class="text-neutral-400 hover:text-bone transition-colors p-2 -mr-2"
					aria-label="Close"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</header>

			<main class="flex-1 overflow-y-auto p-6 space-y-6">
				{#if $supportModalType === 'prayer'}
					<p class="text-neutral-300 leading-relaxed">
						The battle to end child sacrifice is fundamentally a spiritual one. We desperately need
						the prayers of the saints as we labor in Georgia.
					</p>
					<ul class="space-y-3 text-neutral-300">
						<li class="flex items-start">
							<span class="text-gold mr-3 font-bold">•</span>
							<span>Pray for the repentance of our civil magistrates</span>
						</li>
						<li class="flex items-start">
							<span class="text-gold mr-3 font-bold">•</span>
							<span>Pray for the mothers and fathers entering abortion clinics</span>
						</li>
						<li class="flex items-start">
							<span class="text-gold mr-3 font-bold">•</span>
							<span>Pray for boldness and protection for our evangelists</span>
						</li>
						<li class="flex items-start">
							<span class="text-gold mr-3 font-bold">•</span>
							<span>Pray for the awakening of the Church in Georgia</span>
						</li>
					</ul>
					<a
						href="/join"
						class="inline-block w-full bg-transparent border border-gold text-gold hover:bg-gold/10 font-black uppercase tracking-widest py-3 text-xs rounded-sm transition-all duration-300 text-center"
					>
						Join Prayer Team
					</a>
				{:else}
					<p class="text-neutral-300 leading-relaxed">
						If you have more to give for the Kingdom of Christ after supporting your local church,
						consider how you can provide for this ministry.
					</p>
					<ul class="space-y-3 text-neutral-300">
						<li class="flex items-start">
							<span class="text-gold mr-3 font-bold">•</span>
							<span>Church training materials and abolition curricula</span>
						</li>
						<li class="flex items-start">
							<span class="text-gold mr-3 font-bold">•</span>
							<span>Ongoing evangelism at abortion clinics</span>
						</li>
						<li class="flex items-start">
							<span class="text-gold mr-3 font-bold">•</span>
							<span>Full-time evangelist support</span>
						</li>
						<li class="flex items-start">
							<span class="text-gold mr-3 font-bold">•</span>
							<span>Advocacy and legislative engagement</span>
						</li>
					</ul>
					<a
						href="/support"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-block w-full bg-gold hover:bg-yellow-600 text-charcoal font-black uppercase tracking-widest py-3 text-xs rounded-sm transition-all duration-300 shadow-lg text-center"
					>
						Donate Now
					</a>
					<p class="text-neutral-600 text-xs text-center">
						Payment availability and organization disclosures are shown at checkout. No tax-deductibility claim is made.
					</p>
				{/if}
			</main>
		</div>
	</div>
{/if}