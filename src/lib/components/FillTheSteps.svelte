<script lang="ts">
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Fill The Steps - Feb 20, 2026</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:wght@400;700&family=Oswald:wght@400;500;600&family=Public+Sans:wght@400;600&display=swap"
		rel="stylesheet"
	/>
	<style>
		:global(body) {
			overflow: hidden !important;
			height: 100vh !important;
			width: 100vw !important;
			margin: 0 !important;
			position: fixed;
		}
	</style>
</svelte:head>

<!-- Desktop View: Uses the vh-based, proportional flex layout -->
<div class="hidden md:flex flex-1 h-screen bg-charcoal text-bone overflow-hidden relative flex-col">
	<!-- Main Grid -->
	<div class="flex-1 grid grid-cols-12 min-h-0">
		<!-- Column 1: The Call -->
		<div class="col-span-3 flex flex-col gap-[2vh] min-h-0 pl-[4vh] pt-[4vh] pb-[6vh] pr-[2vh]">
			<!-- Press Conference Card -->
			<section
				class="bg-panel/40 border border-white/10 p-[2.5vh] flex flex-col h-fit max-h-[33vh] relative overflow-hidden"
			>
				<div
					class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-crimson/5 blur-[5vh] rounded-full"
				></div>

				<div class="relative z-10 flex flex-col font-montserrat">
					<h1
						class="text-[2.9vh] font-bold uppercase tracking-tighter text-white leading-none whitespace-nowrap mb-[1.5vh] font-oswald"
					>
						Press Conference
					</h1>

					<div class="flex flex-col gap-[1.5vh]">
						<p class="text-[1.8vh] font-bold uppercase tracking-tight leading-[1.1] text-white/80">
							Make our presence known to our representatives in the Georgia Capitol with one clear
							message:
						</p>

						<div class="space-y-[0.3vh]">
							<h2
								class="text-[1.8vh] font-bold italic tracking-tight text-crimson leading-none whitespace-nowrap font-baskerville"
							>
								Equal Justice Under the Law
							</h2>
							<p
								class="text-[0.7vh] italic font-bold text-neutral-400 tracking-[0.2em] uppercase font-montserrat"
							>
								No more exceptions
							</p>
						</div>

						<p class="text-[1.4vh] font-bold uppercase tracking-tight leading-[1.1] text-white/80">
							with Jeff Durbin and many Georgia pastors.
						</p>
					</div>

					<div class="mt-auto pt-[2vh]">
						<h3
							class="text-[1.1vh] font-medium text-gold uppercase tracking-widest italic leading-none font-oswald"
						>
							Will you be there?
						</h3>
					</div>
				</div>
			</section>

			<!-- Representative Card -->
			<section
				class="bg-panel/40 border border-white/10 flex-1 overflow-hidden flex flex-col min-h-0 relative"
			>
				<div class="p-[2.5vh] pb-[1.5vh] flex flex-col gap-[1.5vh] flex-1">
					<div class="border-b border-white/5 pb-[1.5vh] font-oswald">
						<h3
							class="text-[1.7vh] font-medium text-white tracking-[0.05em] uppercase leading-none mb-[1.5vh] whitespace-nowrap"
						>
							STRIKE WHILE THE IRON IS HOT
						</h3>
					</div>

					<div class="space-y-[1.8vh] font-montserrat">
						<div class="space-y-[0.5vh]">
							<p class="text-neutral-400 font-bold italic leading-relaxed text-[1.4vh]">
								<span
									class="text-white text-[1.6vh] font-public font-semibold block not-italic mb-[0.2vh]"
									>Arrive Early</span
								>
								Show up before the session starts to speak with them one-on-one.
							</p>
						</div>
						<ol class="space-y-[1vh] text-[1.35vh] text-neutral-200 font-bold">
							<li class="flex gap-[1.5vh] items-center">
								<span class="text-gold font-montserrat text-[1.5vh]">01</span> Go to House Chamber (3rd
								Floor).
							</li>
							<li class="flex gap-[1.5vh] items-center">
								<span class="text-gold font-montserrat text-[1.5vh]">02</span> Fill out green sheet at
								desk.
							</li>
							<li class="flex gap-[1.5vh] items-center">
								<span class="text-gold font-montserrat text-[1.5vh]">03</span> Write message about HB
								441.
							</li>
							<li class="flex gap-[1.5vh] items-center">
								<span class="text-gold font-montserrat text-[1.5vh]">04</span> Wait at the rope.
							</li>
						</ol>
					</div>

					<div
						class="mt-auto bg-black/60 p-[2vh] border-l-[0.6vh] border-crimson shadow-inner rounded-sm"
					>
						<h4
							class="text-[1vh] font-medium text-crimson tracking-[0.3em] uppercase mb-[0.8vh] font-oswald"
						>
							WHAT DO I SAY?
						</h4>
						<div class="space-y-[1vh]">
							<p
								class="text-[1.3vh] font-bold leading-relaxed text-neutral-300 italic font-baskerville"
							>
								"Do not worry about what to say or how to say it. At that time you will be given
								what to say." (Matthew 10:19)
							</p>
							<p class="text-[1.1vh] font-bold leading-relaxed text-neutral-400 font-montserrat">
								Say whatever is in your heart in honesty, love and truth with respect for your
								representative.
							</p>
						</div>
					</div>

					<!-- Subtle Legislator Link -->
					<div class="flex justify-end mt-[0.5vh]">
						<a
							href="https://pluralpolicy.com/find-your-legislator/"
							target="_blank"
							class="text-[0.8vh] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors py-1 px-2 border border-white/5 hover:border-white/20 rounded-sm"
						>
							Find Your Legislator
						</a>
					</div>
				</div>
			</section>
		</div>

		<!-- Column 2: The Event -->
		<div class="col-span-5 flex flex-col min-h-0">
			<section
				class="relative p-[6vh] flex flex-col justify-center items-center text-center flex-1 shadow-2xl overflow-hidden bg-[#07090D] border-x border-white/5"
			>
				<!-- Background Effects -->
				<div class="absolute inset-y-[-10vh] inset-x-0 z-0 bg-[#500]">
					<img
						src="{base}/images/GA-State-Capitol.jpg"
						alt=""
						class="w-full h-full object-cover object-center opacity-80 mix-blend-multiply grayscale brightness-125 contrast-125"
					/>
					<div
						class="absolute inset-0 bg-black/60"
					></div>
					<div
						class="absolute inset-0 bg-black/40"
					></div>
				</div>

				<!-- Content -->
				<div class="relative z-10 w-full max-w-[45vh]">
					<h3 class="text-[8vh] font-semibold text-white/20 mb-[2vh] leading-none font-public">
						HB 441
					</h3>
					<h2
						class="text-[2.2vh] font-medium uppercase tracking-[0.2em] mb-[4vh] text-white font-oswald underline decoration-crimson underline-offset-[1.5vh] decoration-4"
					>
						WE WILL LET THEM KNOW
					</h2>
					<p
						class="text-[1.4vh] font-medium uppercase tracking-[0.4em] mb-[1.5vh] text-crimson font-oswald"
					>
						JOIN IN THE CAPITOL SOUTH WING
					</p>
					<p class="text-[7vh] lg:text-[8vh] font-bold mb-[1vh] leading-none text-white font-bebas">
						FRIDAY<br />FEB 20TH
					</p>
					<p class="text-[4vh] font-bold text-white/90 font-bebas">1:00 PM</p>
					<div class="h-[0.4vh] w-[15vh] bg-crimson/50 mx-auto my-[4vh]"></div>
					<p
						class="text-[1.6vh] font-bold text-white uppercase tracking-[0.2em] leading-relaxed font-montserrat"
					>
						FILL THE CAPITOL STEPS AND HALLS WITH THE TRUTH OF GOD'S WORD
					</p>
					<div
						class="mt-[6vh] text-[1.4vh] font-bold tracking-[0.2em] text-white/60 font-montserrat"
					>
						206 WASHINGTON ST SW, ATLANTA, GA 30334
					</div>

					<div class="mt-[5vh] flex flex-col items-center gap-4">
						<a
							href="/support"
							target="_blank"
							class="px-[5vh] py-[1.8vh] bg-[#660000] border-[0.4vh] border-[#07090E] text-white text-[2.1vh] uppercase transition-all shadow-[0_2vh_5vh_rgba(0,0,0,0.8)] font-bebas rounded-lg hover:scale-102"
						>
							Give to Operation Gospel
						</a>
						<a
							href="{base}/"
							class="text-[1.2vh] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors font-montserrat"
						>
							More info about Operation Gospel
						</a>
					</div>
				</div>
			</section>
		</div>

		<!-- Column 3: Helpers -->
		<div class="col-span-4 flex flex-col gap-[2vh] min-h-0 pr-[4vh] pt-[4vh] pb-[4vh] pl-[2vh]">
			<!-- Fill the Steps Card -->
			<section
				class="relative bg-[#07090E] border border-white/10 p-[2.5vh] py-[6vh] flex flex-col justify-center h-fit overflow-hidden"
			>
				<!-- Background Image -->
				<div class="absolute inset-0 z-0">
					<img
						src="{base}/images/CapitolSteps.avif"
						alt=""
						class="w-full h-full object-cover opacity-70 grayscale blend-overlay"
					/>
					<div
						class="absolute inset-0 bg-black/40"
					></div>
				</div>

				<div class="relative z-10 text-center">
					<h3 class="text-[3.2vh] font-bold uppercase leading-[1.1] mb-[2vh] text-white font-bebas">
						FILL THE STEPS <br />
						<span class="text-gold block mt-[0.5vh] text-[2.4vh] font-bold"
							>(AND THE NATIONAL HEADLINES)</span
						>
					</h3>
					<p
						class="text-[1.7vh] text-white/70 font-bold italic leading-relaxed mb-[3vh] font-baskerville"
					>
						That Georgia Will Be the First State to Fully Ban Child Sacrifice
					</p>
					<div class="pt-[2vh] border-t border-white/10 mt-auto">
						<p
							class="text-[1.8vh] font-bold italic text-white tracking-[0.2em] uppercase mb-[1vh] font-baskerville"
						>
							Isaiah 1:17
						</p>
						<p class="text-[1.8vh] font-bold italic text-white leading-tight font-baskerville">
							Learn to do good; seek justice, correct oppression; bring justice to the fatherless,
							plead the widow's cause.
						</p>
					</div>
				</div>
			</section>

			<!-- How to Get There Card -->
			<section class="bg-panel/30 border border-gold/20 p-[2.5vh] flex flex-col h-fit">
				<h3
					class="text-[2vh] font-medium text-gold tracking-[0.2em] uppercase mb-[1.5vh] font-oswald"
				>
					HOW TO GET THERE
				</h3>
				<div class="flex flex-col gap-[1vh]">
					<div class="flex flex-col gap-[0.5vh] font-montserrat">
						<div class="flex items-center gap-[2.5vh] border-b border-white/5 pb-[0.5vh]">
							<span class="text-gold font-bold text-[2vh] w-[4vh] font-montserrat">01</span>
							<span class="text-[1.2vh] font-bold uppercase tracking-widest text-neutral-300"
								>Park in Hackney or Grady Garages</span
							>
						</div>
						<div class="flex items-center gap-[2.5vh] border-b border-white/5 py-[0.5vh]">
							<span class="text-gold font-bold text-[2vh] w-[4vh] font-montserrat">02</span>
							<span class="text-[1.2vh] font-bold uppercase tracking-widest text-neutral-300"
								>Enter via South Wing Public Doors</span
							>
						</div>
						<div class="flex items-center gap-[2.5vh] pt-[0.5vh]">
							<span class="text-gold font-bold text-[2vh] w-[4vh] font-montserrat">03</span>
							<span class="text-[1.2vh] font-bold uppercase tracking-widest text-neutral-300"
								>Meet at the Press Stairs</span
							>
						</div>
					</div>

					<!-- Navigation Image (Below steps) -->
					<div class="relative shadow-2xl overflow-hidden rounded-sm border border-white/10 h-fit">
						<img
							src="{base}/images/Navigation.png"
							alt="Navigation Map"
							class="w-full h-auto block"
						/>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>

<!-- Mobile View: Locked to one screen -->
<div class="flex md:hidden h-screen overflow-hidden bg-charcoal text-bone relative">
	<div class="p-6 space-y-8 pb-24">
		<!-- Impact/Hero Section (The Facts) -->
		<section
			class="relative p-8 border border-white/10 space-y-6 text-center py-16 overflow-hidden bg-[#07090D]"
		>
			<div class="absolute inset-0 z-0 bg-[#500]">
				<img
					src="{base}/images/GA-State-Capitol.jpg"
					alt=""
					class="w-full h-full object-cover object-center opacity-70 mix-blend-multiply grayscale brightness-150 contrast-125"
				/>
<div
						class="absolute inset-0 bg-black/60"
					></div>
			</div>

			<div class="relative z-10 space-y-8">
				<h3 class="text-4xl font-semibold text-white/20 mb-[-2rem] font-public">HB 441</h3>
				<h2
					class="text-2xl font-medium text-white uppercase tracking-tighter border-b border-crimson/30 pb-4 font-oswald"
				>
					WE WILL LET THEM KNOW
				</h2>
				<p class="text-[10px] font-medium text-crimson tracking-[0.4em] uppercase font-oswald">
					JOIN IN THE CAPITOL SOUTH WING
				</p>
				<div class="space-y-1">
					<p class="text-5xl font-bold uppercase text-white font-bebas leading-none">
						FRI,<br />FEB 20TH
					</p>
					<p class="text-2xl font-bold text-white/80 font-bebas">1:00 PM</p>
				</div>
				<p
					class="text-xs font-bold text-white uppercase tracking-widest leading-relaxed font-montserrat px-4"
				>
					FILL THE CAPITOL STEPS AND HALLS WITH THE TRUTH OF GOD'S WORD
				</p>
				<div class="mt-8 text-[11px] font-bold tracking-[0.2em] text-white/40 font-montserrat">
					206 WASHINGTON ST SW, ATLANTA, GA 30334
				</div>

				<div class="mt-10 flex flex-col items-center gap-6 w-full mx-auto">
					<a
						href="/support"
						target="_blank"
						class="px-12 py-5 bg-[#660000] border-[8px] border-[#07090E] text-white text-center font-bold uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.8)] font-bebas rounded-full transition-all active:scale-95"
						>Give to Operation Gospel</a
					>
					<a
						href="{base}/"
						class="text-xs font-bold uppercase tracking-widest text-white/30 font-montserrat hover:text-gold transition-colors"
						>More info about Operation Gospel</a
					>
				</div>
			</div>
		</section>

		<!-- Call to Action (Press Conference) -->
		<section class="space-y-6 bg-panel/30 p-8 border border-white/10 font-montserrat">
			<h1
				class="text-3xl font-bold uppercase text-white leading-[0.9] tracking-tighter font-oswald"
			>
				Press<br />Conference
			</h1>

			<div class="space-y-6">
				<p class="text-lg font-bold uppercase text-white/80 leading-snug">
					Make our presence known to our representatives in the Georgia Capitol with one clear
					message:
				</p>

				<div class="space-y-1">
					<h2 class="text-xl font-bold italic text-crimson leading-tight font-baskerville">
						Equal Justice Under the Law
					</h2>
					<p class="text-[10px] italic font-bold text-neutral-400 tracking-widest uppercase">
						No more exceptions
					</p>
				</div>

				<p class="text-lg font-bold uppercase text-white/80 leading-snug">
					with Jeff Durbin and many Georgia pastors.
				</p>
			</div>

			<div class="pt-6 border-t border-white/10">
				<p class="text-sm font-medium text-gold italic uppercase tracking-widest font-oswald">
					Will You Be There?
				</p>
			</div>
		</section>

		<!-- Action (Meet Your Representative) -->
		<section
			class="bg-panel p-6 border border-white/10 flex flex-col min-h-0 relative overflow-hidden"
		>
			<div class="flex flex-col gap-5 flex-1">
				<div class="border-b border-white/5 pb-4 font-oswald">
					<h3
						class="text-lg font-medium text-white tracking-[0.1em] uppercase leading-tight mb-2 whitespace-nowrap"
					>
						STRIKE WHILE THE IRON IS HOT
					</h3>
				</div>

				<div class="flex flex-col gap-6 font-montserrat">
					<div class="space-y-3">
						<p class="text-neutral-400 font-bold italic leading-snug text-sm">
							<strong class="text-white text-lg font-public font-semibold block mb-1"
								>Arrive Early</strong
							>
							Show up before the session starts to speak with them one-on-one.
						</p>
						<ol class="space-y-3 text-sm text-neutral-200 font-bold">
							<li class="flex gap-4">
								<span class="text-gold font-montserrat">01</span> Go to House Chamber (3rd Floor).
							</li>
							<li class="flex gap-4">
								<span class="text-gold font-montserrat">02</span> Fill out green sheet at desk.
							</li>
							<li class="flex gap-4">
								<span class="text-gold font-montserrat">03</span> Write message about HB 441.
							</li>
							<li class="flex gap-4">
								<span class="text-gold font-montserrat">04</span> Wait at the rope.
							</li>
						</ol>
					</div>
				</div>

				<div class="mt-4 bg-black/40 p-5 border border-white/5 rounded-sm shadow-inner relative">
					<h4
						class="text-[9px] font-medium text-crimson tracking-[0.2em] uppercase mb-2 font-oswald"
					>
						WHAT DO I SAY?
					</h4>
					<div class="space-y-3">
						<p class="text-base font-bold leading-relaxed text-neutral-300 italic font-baskerville">
							"Do not worry about what to say or how to say it. At that time you will be given what
							to say."" (Matthew 10:19)
						</p>
						<p class="text-sm font-bold leading-relaxed text-neutral-400 font-montserrat">
							Say whatever is in your heart in honesty, love and truth with respect for your
							representative.
						</p>
					</div>
				</div>

				<!-- Subtle Legislator Link for Mobile -->
				<div class="flex justify-end mt-2">
					<a
						href="https://pluralpolicy.com/find-your-legislator/"
						target="_blank"
						class="text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors py-1.5 px-2.5 border border-white/10 rounded-sm"
					>
						Find Your Legislator
					</a>
				</div>
			</div>
		</section>

		<!-- Vision (Fill the Steps) -->
		<section
			class="relative space-y-6 bg-[#07090E] p-8 py-20 border border-white/5 font-montserrat overflow-hidden"
		>
			<!-- Background Image -->
			<div class="absolute inset-0 z-0 text-center">
				<img
					src="{base}/images/CapitolSteps.avif"
					alt=""
					class="w-full h-full object-cover opacity-60 grayscale"
				/>
				<div class="absolute inset-0 bg-black/60"></div>
			</div>

			<div class="relative z-10 text-center px-4">
				<h3 class="text-3xl font-bold uppercase text-white font-bebas">
					FILL THE STEPS<br /><span class="text-gold">(AND THE NATIONAL HEADLINES)</span>
				</h3>
				<p class="text-white/70 font-bold italic leading-relaxed font-baskerville">
					That Georgia will be the first state to fully ban child sacrifice.
				</p>
				<div class="space-y-3 pt-4 border-t border-white/5">
					<p
						class="text-sm font-bold italic text-white tracking-[0.1em] uppercase font-baskerville"
					>
						ISAIAH 1:17
					</p>
					<p class="text-lg font-bold italic text-white leading-snug font-baskerville">
						learn to do good; seek justice, correct oppression; bring justice to the fatherless,
						plead the widow's cause.
					</p>
				</div>
			</div>
		</section>

		<!-- Logistics (How to Get There) -->
		<section class="space-y-8 bg-panel/30 p-8 border border-gold/10 font-montserrat">
			<h3 class="text-xs font-medium text-gold tracking-[0.3em] uppercase font-oswald">
				HOW TO GET THERE
			</h3>

			<div class="space-y-4">
				{#each ['Park in Hackney or Grady Garages', 'Enter South Wing Public Doors', 'Meet at the Press Stairs'] as step, i}
					<div class="bg-white/5 p-5 flex items-center gap-5 border border-white/5">
						<span class="text-gold font-bold text-2xl font-montserrat">{i + 1}</span>
						<span class="text-xs font-bold uppercase tracking-widest text-neutral-300">{step}</span>
					</div>
				{/each}
			</div>

			<div
				class="relative p-2 text-center shadow-2xl overflow-hidden min-h-[200px] flex items-center justify-center border border-white/10 rounded-sm bg-black/40"
			>
				<img
					src="{base}/images/Navigation.png"
					alt="Navigation Map"
					class="w-full h-full object-cover object-center"
				/>
			</div>
		</section>

		<!-- Footer/Expectations -->
		<section class="bg-black/60 p-8 border-t-[3px] border-gold space-y-4 font-montserrat">
			<h4 class="text-xs font-medium text-gold tracking-widest uppercase font-oswald">
				WHAT TO EXPECT
			</h4>
			<p class="text-sm font-bold leading-relaxed text-neutral-400 italic">
				Be at the steps a few minutes early to find your spot with hundreds of other families to
				stand in array, sing hymns, and hear pastors speak about the equal protection bill.
			</p>
		</section>
	</div>
</div>

<style>
	/* Custom font utility classes */
	.font-bebas {
		font-family: 'Bebas Neue', display;
		letter-spacing: 0.08em;
	}
	.font-oswald {
		font-family: 'Oswald', sans-serif;
		text-transform: uppercase;
	}
	.font-montserrat {
		font-family: 'Montserrat', sans-serif;
	}
	.font-baskerville {
		font-family: 'Libre Baskerville', serif;
	}
	.font-public {
		font-family: 'Public Sans', sans-serif;
	}
</style>
