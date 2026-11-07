<script lang="ts">
	import PastorCTA from '$lib/components/PastorCTA.svelte';
</script>

<svelte:head>
	<title>For Pastors and Churches | Operation Gospel</title>
	<meta name="description" content="Equipping churches for abolition." />
</svelte:head>

<div class="min-h-screen bg-void text-parchment px-4 sm:px-6 py-12 lg:py-16">
	<div class="max-w-3xl mx-auto space-y-10">

		<!-- Hero Section -->
		<div class="text-center">
			<h1 class="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight text-parchment uppercase">
				For Pastors and Church Leaders
			</h1>
		</div>

		<!-- Documentary Embed -->
		<div class="relative w-full aspect-video rounded-sm overflow-hidden shadow-2xl border border-charcoal">
			<h2 class="sr-only">Essential Viewing: The Fatal Flaw</h2>
			<iframe
				title="The Fatal Flaw Documentary"
				src="https://www.youtube-nocookie.com/embed/k33epqzJIlM"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowfullscreen
				loading="lazy"
				class="absolute top-0 left-0 w-full h-full"
			></iframe>
		</div>

		<!-- Combined Content Card -->
		<div class="bg-panel p-5 sm:p-6 md:p-8 rounded-sm border-l-4 border-burgundy">
			<h2 class="text-lg sm:text-xl font-display font-bold mb-4 text-burgundy">The Turned Over Hypothesis</h2>
			<div class="space-y-4 text-parchment/80 text-sm sm:text-base leading-relaxed mb-8">
				<p>
					Romans 1 gives us the diagnosis: when a people refuse to honor God and give Him thanks, He gives them over to a debased mind. This is not a political problem. It is a judgment.
				</p>
				<p>
					Abortion is the visible fruit. The slaughter of the pre-born is what happens when a society rejects the Lordship of Christ. We see it in Georgia. We see it everywhere.
				</p>
				<p>
					The remedy is not "culture war" or "conservative values." The only remedy is repentance. Pastors must lead the way in calling both the Church and the State to submit to King Jesus.
				</p>
			</div>

			<h2 class="text-lg sm:text-xl font-display font-bold mb-4 text-parchment">Church Kits</h2>
			<div class="space-y-4 text-parchment/80 text-sm sm:text-base leading-relaxed">
				<p>
					We are preparing church kits to help your congregation engage in abolition work. Each kit will include teaching resources, analysis of equal protection laws, guidance for mercy ministries, and strategies for public witness.
				</p>
				<p>
					The kits are still in development. If you want to be notified when they're ready, or if you want to help us develop them, reach out.
				</p>
			</div>
		</div>

		<!-- CTA Section -->
		<PastorCTA />

	</div>
</div>