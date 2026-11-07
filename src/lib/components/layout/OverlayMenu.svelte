<script lang="ts">
	import { page } from '$app/state';
	import { fade, fly } from 'svelte/transition';
	import { NavCategories } from '$lib/config/navigation';
	import { supportModalOpen, supportModalType } from '$lib/stores';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();
	let openValue = $derived(open);

	function isActive(href: string) {
		return page.url.pathname === href;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && openValue) {
			onClose();
		}
	}

	function handleLinkClick(href: string) {
		if (href.startsWith('#support-')) {
			// Handle support modal links
			const type = href.replace('#support-', '') as 'prayer' | 'donate';
			supportModalOpen.set(true);
			supportModalType.set(type);
			onClose();
		} else {
			// Small delay to let navigation start before closing
			setTimeout(onClose, 50);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if openValue}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-[100] bg-void/98 backdrop-blur-md"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
		onkeydown={(e) => e.key === 'Enter' && onClose()}
		role="button"
		tabindex="-1"
		aria-label="Close menu"
	></div>

	<!-- Overlay Menu -->
	<div
		class="overlay-menu fixed inset-y-0 right-0 z-[101] w-full max-w-md overflow-y-auto bg-panel shadow-2xl border-l border-charcoal flex flex-col"
		transition:fly={{ x: 300, duration: 300 }}
	>
		<!-- Header Bar -->
		<div class="px-6 py-5 flex justify-end items-center sticky top-0 bg-panel z-10">
			<button
				onclick={onClose}
				class="text-parchment-muted hover:text-gold transition-colors p-2 -mr-2"
				aria-label="Close menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Navigation Content -->
		<div class="flex-1 px-6 py-8">
			<div class="flex flex-col gap-10">
				{#each NavCategories as category}
					<div>
						<h3 class="font-ui text-xs font-semibold uppercase tracking-[0.15em] text-gold mb-4 pb-2 border-b border-charcoal">
							{category.name}
						</h3>
						<ul class="space-y-1">
							{#each category.links as link}
								<li>
									<a
										href={link.href}
										onclick={() => handleLinkClick(link.href)}
										class="block py-3 px-3 transition-all duration-200 rounded-sm
											{isActive(link.href)
											? 'bg-burgundy/20 text-gold border-l-2 border-gold -ml-px'
											: 'text-parchment-muted hover:text-parchment hover:bg-charcoal/50 border-l-2 border-transparent -ml-px'}"
									>
										<span class="text-base font-ui font-medium">{link.label}</span>
										{#if link.description}
											<span class="block text-xs text-parchment-dark mt-1 font-ui">{link.description}</span>
										{/if}
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}