<script lang="ts">
	import type { Snippet } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	let {
		showModal = $bindable(),
		title = 'Default Title',
		children
	}: {
		showModal: boolean;
		title?: string;
		children: Snippet;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (showModal && e.key === 'Escape') {
			showModal = false;
		}
	}

	$effect(() => {
		if (showModal) {
			const previousActiveElement = document.activeElement as HTMLElement;
			return () => {
				previousActiveElement?.focus();
			};
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if showModal}
	<div
		class="fixed inset-0 bg-navy-deep/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
		onclick={(event) => {
			if (event.target === event.currentTarget) showModal = false;
		}}
		onkeydown={(event) => {
			if (event.key === "Escape") showModal = false;
		}}
		role="presentation"
		transition:fly={{ duration: 300, y: 20, opacity: 0, easing: quintOut }}
	>
		<div
			class="bg-navy-light border border-gold/20 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<header class="flex items-center justify-between p-6 border-b border-white/10">
				<h2 id="modal-title" class="text-xl font-bold text-white">{title}</h2>
				<button
					onclick={() => (showModal = false)}
					class="text-slate-400 hover:text-white transition-colors"
					aria-label="Close modal"
				>
					<span class="material-symbols-outlined">close</span>
				</button>
			</header>
			<main class="flex-1 overflow-y-auto p-8 prose prose-invert prose-lg text-slate-400">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
