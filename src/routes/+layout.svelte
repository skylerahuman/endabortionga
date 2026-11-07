<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import OverlayMenu from '$lib/components/layout/OverlayMenu.svelte';
	import SupportModal from '$lib/components/support/SupportModal.svelte';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	function closeMenu() {
		mobileMenuOpen = false;
	}

	onMount(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (
				mobileMenuOpen &&
				!target.closest('.nav-container') &&
				!target.closest('.overlay-menu')
			) {
				mobileMenuOpen = false;
			}
		};
		document.addEventListener('pointerup', handleClickOutside);
		return () => document.removeEventListener('pointerup', handleClickOutside);
	});

</script>

<svelte:head>
	<title>End Abortion Georgia</title>
	<link rel="icon" href="{base}/movement-seed.svg" />
</svelte:head>

<div class="min-h-screen flex flex-col bg-black text-white">
	<!-- Skip to main content link for accessibility -->
	<a
		href="#main-content"
		class="absolute -top-96 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 font-bold uppercase tracking-widest rounded-b-md focus:top-4 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white"
	>
		Skip to Main Content
	</a>

	<!-- Header with Menu Toggle -->
	<Header menuOpen={mobileMenuOpen} onMenuToggle={() => (mobileMenuOpen = !mobileMenuOpen)} />

	<!-- Full-Screen Overlay Menu -->
	<OverlayMenu open={mobileMenuOpen} onClose={closeMenu} />

	<!-- Support Modal -->
	<SupportModal />

	<!-- Main Content -->
	<main id="main-content" tabindex="-1" class="flex-1 focus:outline-none">
		{@render children()}
	</main>

	<!-- Footer -->
	{#if page.url.pathname !== '/' && page.url.pathname !== '/georgia-map'}
		<Footer />
	{/if}
</div>
