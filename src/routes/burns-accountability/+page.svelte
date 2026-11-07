<script lang="ts">
	import { base } from '$app/paths';
	import { Routes } from '$lib/config/navigation';
</script>

<svelte:head>
	<title>The Political Reality: Speaker Burns | Operation Gospel</title>
</svelte:head>

<main class="flex flex-col w-full bg-void text-parchment min-h-screen font-body">
	<aside class="hidden md:block w-64 shrink-0 border-r border-charcoal p-6">
		<h2 class="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4 pb-2 border-b border-neutral-800">
			Action Center
		</h2>
		<nav class="space-y-1">
			<a href={Routes.BURNS_ACCOUNTABILITY} class="block px-4 py-3 text-sm text-neutral-400 hover:text-paper hover:bg-neutral-800/50">Burns Accountability</a>
			<a href={Routes.BILL_ANALYSIS} class="block px-4 py-3 text-sm text-neutral-400 hover:text-paper hover:bg-neutral-800/50">View Bill Analysis</a>
			<a href={Routes.REP_CALLS} class="block px-4 py-3 text-sm text-neutral-400 hover:text-paper hover:bg-neutral-800/50">Call Your Representative</a>
			<a href={Routes.JOIN} class="block px-4 py-3 text-sm text-neutral-400 hover:text-paper hover:bg-neutral-800/50">Join the Movement</a>
		</nav>
	</aside>

	<!-- Page Header -->
	<section class="relative py-24 px-6 border-b border-charcoal bg-void">
		<div class="max-w-4xl mx-auto text-center">
			<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm border border-burgundy/30 bg-burgundy/10 text-burgundy mb-8">
				<span class="text-xs font-ui font-bold uppercase tracking-widest">The Autopsy</span>
			</div>
			<h1 class="text-5xl md:text-7xl font-display font-black text-parchment tracking-tight mb-8 leading-tight">
				What Speaker Burns Did
			</h1>
			<p class="text-2xl text-parchment/80 leading-relaxed font-body max-w-3xl mx-auto">
				HB 441 was the most comprehensive equal protection bill in Georgia history. It had 20+ co-sponsors. <span class="text-parchment font-bold border-b border-burgundy pb-1">Speaker Jon Burns killed it.</span>
			</p>
		</div>
	</section>

	<!-- The Reality -->
	<section class="py-24 px-6 bg-panel border-b border-charcoal">
		<div class="max-w-4xl mx-auto">
			<div class="grid md:grid-cols-2 gap-16 items-start">
				<div>
					<h2 class="text-3xl font-display font-bold text-parchment mb-6">The Institutional Block</h2>
					<p class="text-lg text-parchment/70 leading-relaxed mb-6">
						As Speaker of the House, Burns controls what bills reach the floor for a vote. He refused to let HB 441 out of committee. Until he is removed or motivated differently, no equal protection bill will pass in Georgia.
					</p>
					<p class="text-lg text-parchment/70 leading-relaxed">
						This isn't just about one bill—it's about the institutional blockade that prevents any meaningful protections from advancing through the legislative process, regardless of how much grassroots support exists.
					</p>
				</div>
				<div class="bg-void border-l-4 border-burgundy p-8 rounded-sm shadow-xl">
					<h3 class="text-xl font-display font-bold text-parchment mb-4">Why Did He Kill It?</h3>
					<p class="text-base text-parchment/70 leading-relaxed mb-6">
						Leadership often kills abolition bills to protect members from taking "tough votes" in an election year. By burying the bill in committee, Burns prioritized establishment pragmatism over the Republican party platform.
					</p>
					<p class="text-base text-parchment/70 leading-relaxed">
						He shielded vulnerable members from having their stance on equal protection recorded, betraying the conservative base that elected him.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Primary Challenge -->
	<section class="py-32 px-6 bg-void relative overflow-hidden">
		<!-- Decorative element -->
		<div class="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-5">
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-gold),transparent_70%)]"></div>
		</div>

		<div class="max-w-4xl mx-auto relative z-10">
			<div class="text-center mb-16">
				<span class="text-gold font-ui font-bold tracking-widest uppercase text-sm mb-4 block">The Ultimate Accountability</span>
				<h2 class="text-4xl md:text-6xl font-display font-bold text-parchment">Primary Burns</h2>
			</div>

			<div class="bg-panel border border-gold/30 p-10 md:p-16 rounded-sm shadow-2xl">
				<div class="prose prose-invert prose-lg text-parchment/80 max-w-none font-body leading-relaxed">
					<p class="text-2xl text-parchment mb-8 font-display">
						Speaker Burns represents House District 159, a heavily Republican district. He faces virtually no threat from Democrats. 
					</p>
					<p class="mb-8">
						The only mechanism for true accountability is a primary challenge from a conservative who will uphold the party platform on equal protection. If leadership will not advance the cause of justice, leadership must be replaced.
					</p>
						
					<div class="bg-void border border-charcoal p-8 rounded-sm mt-12">
						<div class="flex flex-col md:flex-row items-center gap-8">
							<div>
								<h3 class="text-2xl font-display font-bold text-parchment mb-3">Nathan Hooks for HD 159</h3>
								<p class="text-base text-parchment/70 mb-6">
									<strong>Nathan Hooks</strong> has stepped forward as a primary challenger to Speaker Burns, running on an abolitionist platform to bring equal protection to Georgia.
								</p>
								<a href="https://nathanhooksga.com" target="_blank" rel="noopener noreferrer" class="btn btn-secondary text-sm">
									Visit Nathan Hooks' Campaign
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Next Steps -->
	<section class="py-24 px-6 bg-panel border-t border-charcoal">
		<div class="max-w-4xl mx-auto">
			<h2 class="text-3xl font-display font-bold text-parchment mb-12 text-center">What Can Be Done?</h2>
			
			<div class="grid md:grid-cols-2 gap-8">
				<div class="bg-void border border-charcoal p-8 rounded-sm">
					<h3 class="text-xl font-ui font-bold text-parchment mb-4 flex items-center gap-3">
						<span class="text-burgundy">01.</span> Support the Primary
					</h3>
					<p class="text-parchment/70 mb-6">
						A primary challenge requires resources, volunteers, and sustained effort. Support candidates who will champion equal protection.
					</p>
					<a href="https://nathanhooksga.com" target="_blank" rel="noopener noreferrer" class="text-gold hover:text-gold-light text-sm font-bold uppercase tracking-widest font-ui transition-colors">
						Learn More &rarr;
					</a>
				</div>
				
				<div class="bg-void border border-charcoal p-8 rounded-sm">
					<h3 class="text-xl font-ui font-bold text-parchment mb-4 flex items-center gap-3">
						<span class="text-burgundy">02.</span> Join the Movement
					</h3>
					<p class="text-parchment/70 mb-6">
						Connect with abolitionists in your district. We are building a network to hold all representatives accountable.
					</p>
					<a href="{base}/join" class="text-gold hover:text-gold-light text-sm font-bold uppercase tracking-widest font-ui transition-colors">
						Get Involved &rarr;
					</a>
				</div>
			</div>
		</div>
	</section>
</main>
