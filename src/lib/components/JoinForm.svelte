<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { registrationState } from '$lib/state.svelte';

	// District Finder Interaction State
	let zipCode = $state('');
	let isLoading = $state(false);
	let isSubmitting = $state(false);
	let error = $state('');
	let showDistrict = $state(false);
	let notInGeorgia = $state(false);
	let scrambleInterval: number; // Track interval for cleanup

	// Focus Management References
	let resultContainer = $state<HTMLElement>();
	let firstNameInput = $state<HTMLElement>();
	let homeChurchInput = $state<HTMLElement>();
	let step2Error = $state('');

	onMount(() => {
		// If the app state shows submitted, reset it for a fresh mount (e.g. navigation back to page)
		if (registrationState.submitted) {
			registrationState.reset();
		}

		const savedDistrict = localStorage.getItem('userDistrict');
		if (savedDistrict) {
			registrationState.form.district = savedDistrict;
			showDistrict = true;
		}

		// Cleanup interval on unmount to prevent memory leaks
		return () => {
			if (scrambleInterval) clearInterval(scrambleInterval);
		};
	});

	function handleZipInput(e: Event) {
		const input = e.target as HTMLInputElement;
		// Only allow numbers
		zipCode = input.value.replace(/\D/g, '').slice(0, 5);
		error = '';
		if (zipCode.length === 5) {
			handleZipLookup();
		}
	}

	async function handleZipLookup() {
		if (zipCode.length !== 5) {
			error = 'Enter a 5-digit ZIP code.';
			return;
		}

		if (isLoading) return;

		error = '';
		isLoading = true;
		
		// Reset previous state
		showDistrict = false;
		registrationState.form.district = null;

		// Scramble animation
		scrambleInterval = window.setInterval(() => {
			registrationState.form.district = Math.random().toString(36).substring(2, 5).toUpperCase();
		}, 50);

		try {
			const { zipToDistrict } = await import('$lib/data/zip_to_district');

			clearInterval(scrambleInterval);
			const foundDistrict = zipToDistrict[zipCode as keyof typeof zipToDistrict];

			if (foundDistrict) {
				const padded = foundDistrict.toString().padStart(3, '0');
				registrationState.form.district = padded;
				localStorage.setItem('userDistrict', padded);
				showDistrict = true;
				await tick();
				resultContainer?.focus();
			} else {
				registrationState.form.district = null;
				error = 'Georgia district not found.';
			}
		} catch (e) {
			clearInterval(scrambleInterval);
			error = 'Error loading district data.';
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (registrationState.step === 1) {
				if (showDistrict || notInGeorgia) {
					handleNextStep();
				} else if (zipCode.length === 5) {
					handleZipLookup();
				}
			} else if (registrationState.step === 2) {
				handleNextStep();
			} else if (registrationState.step === 3) {
				const form = (e.target as HTMLElement).closest('form');
				if (form) {
					form.requestSubmit();
				}
			}
		}
	}

	function resetDistrictFinder() {
		showDistrict = false;
		zipCode = '';
		registrationState.form.district = null;
		error = '';
		localStorage.removeItem('userDistrict');
	}

	function toggleInterest(interest: string) {
		if (registrationState.form.interests.includes(interest)) {
			registrationState.form.interests = registrationState.form.interests.filter(
				(i: string) => i !== interest
			);
		} else {
			registrationState.form.interests = [...registrationState.form.interests, interest];
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const snapshot = $state.snapshot(registrationState.form);
			console.log('Submitting form data:', snapshot);

			const response = await fetch('/api/volunteers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: snapshot.firstName,
					lastName: snapshot.lastName,
					email: snapshot.email,
					phone: snapshot.phone || null,
					city: snapshot.city,
					district: snapshot.district || null,
					homeChurch: snapshot.homeChurch || null,
					interests: snapshot.interests,
					outOfState: !snapshot.district
				})
			});

			console.log('Response status:', response.status);
			const data = await response.json();
			console.log('Response data:', data);

			if (!response.ok) {
				throw new Error(data.error || 'Submission failed');
			}

			localStorage.removeItem('userDistrict');
			registrationState.submitted = true;
		} catch (err) {
			console.error('Submit error:', err);
			error = err instanceof Error ? err.message : 'There was an error submitting your registration. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function handleAddAnother() {
		registrationState.reset();
		showDistrict = false;
		zipCode = '';
		error = '';
		localStorage.removeItem('userDistrict');
	}

	async function handleNextStep() {
		if (registrationState.step === 1) {
			registrationState.nextStep();
			await tick();
			firstNameInput?.focus();
		} else if (registrationState.step === 2) {
			if (
				!registrationState.form.firstName.trim() ||
				!registrationState.form.lastName.trim() ||
				!registrationState.form.email.trim() ||
				!registrationState.form.city.trim()
			) {
				step2Error = 'Please fill in all required fields.';
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationState.form.email)) {
				step2Error = 'Please enter a valid email address.';
				return;
			}
			step2Error = '';
			registrationState.nextStep();
			await tick();
			homeChurchInput?.focus();
		}
	}
</script>

<div
	class="bg-panel/80 backdrop-blur-sm border border-white/10 p-8 rounded-xl shadow-lg h-full flex flex-col"
>
	<h2 class="text-3xl font-serif font-bold text-bone mb-6">Join the Fight</h2>

	<!-- Progress Bar -->
	{#if registrationState.step > 1 && !registrationState.submitted}
		<div class="mb-6">
			<p id="progress-label" class="text-sm text-bone/60 text-center">
				Step {registrationState.step} of 3
			</p>
			<div
				role="progressbar"
				aria-labelledby="progress-label"
				aria-valuenow={((registrationState.step - 1) / 2) * 100}
				aria-valuemin="0"
				aria-valuemax="100"
				class="w-full bg-charcoal/50 rounded-full h-1.5 mt-1"
			>
				<div
					class="bg-crimson h-1.5 rounded-full transition-all duration-300"
					style="width: {((registrationState.step - 1) / 2) * 100}%"
				></div>
			</div>
		</div>
	{/if}

	{#if !registrationState.submitted}
		<form onsubmit={handleSubmit} class="flex flex-col flex-1">
			<!-- STEP 1: District Finder -->
			{#if registrationState.step === 1}
				<div
					class="flex-1 flex flex-col justify-between"
					in:fly={{ x: -20, duration: 300, delay: 300 }}
					out:fly={{ x: -20, duration: 300 }}
				>
					<div class="space-y-6">
						<div class="flex justify-between items-center mb-2">
							<label for="zip" class="block text-sm font-semibold text-bone/80"
								>Find Your Georgia House District</label
							>
						</div>
						<p class="text-sm text-bone/60 mb-4">
							Our objective is to hold leadership accountable and advance the next phase of abolition in Georgia. Please enter your ZIP code to identify your representative.
						</p>
						{#if !notInGeorgia}
							<div class="space-y-4">
								<div class="flex gap-2">
									<input
										type="text"
										id="zip"
										bind:value={zipCode}
										inputmode="numeric"
										pattern="[0-9]*"
										placeholder="Enter 5-digit ZIP Code"
										class="flex-1 bg-charcoal border {showDistrict
											? 'border-green-500/50'
											: 'border-white/20'} text-bone px-4 py-2 rounded-md focus:border-crimson outline-none transition-all font-mono"
										maxlength="5"
										oninput={handleZipInput}
										onkeydown={handleKeyDown}
										disabled={isLoading}
									/>
									{#if !showDistrict}
										<button
											type="button"
											onclick={handleZipLookup}
											disabled={isLoading || zipCode.length !== 5}
											class="bg-crimson hover:bg-ember text-bone px-6 py-2 rounded-md font-bold uppercase disabled:opacity-50 transition-colors"
											aria-label={isLoading ? 'Searching for district...' : 'Find district'}
										>
											{#if isLoading}
												<div
													class="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"
													aria-hidden="true"
												></div>
											{:else}
												Find
											{/if}
										</button>
									{/if}
								</div>
								{#if error}
									<p role="alert" class="text-ember text-xs mt-1">{error}</p>
								{/if}

								{#if showDistrict}
									<div
										bind:this={resultContainer}
										tabindex="-1"
										class="text-center bg-charcoal/50 border border-green-500/20 rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-crimson/50"
									>
										<p class="text-xs text-bone/60 uppercase tracking-widest mb-1">
											Your Georgia House District is:
										</p>
										<p class="text-4xl font-mono font-bold text-green-400 tracking-widest mb-2">
											{registrationState.form.district || 'N/A'}
										</p>
										<button
											type="button"
											onclick={resetDistrictFinder}
											class="text-xs text-bone/40 hover:text-ember underline underline-offset-4 transition-colors"
										>
											Use a different ZIP?
										</button>
									</div>
								{/if}
							</div>
						{/if}

						<label
							class="flex items-center gap-2 text-sm text-bone/60 cursor-pointer p-3 bg-charcoal/40 border border-white/10 rounded-md hover:bg-charcoal/80 transition-colors mb-6"
						>
							<input
								type="checkbox"
								bind:checked={notInGeorgia}
								class="w-5 h-5 bg-charcoal border-white/30 rounded text-crimson focus:ring-crimson/50 focus-visible:ring-2 focus-visible:ring-crimson/50 outline-none"
							/>
							I'm not in Georgia, but I want to help.
						</label>
					</div>
					<div class="flex justify-end">
						<button
							type="button"
							onclick={handleNextStep}
							disabled={!registrationState.form.district && !notInGeorgia}
							class="bg-crimson hover:bg-ember text-bone font-bold py-2 px-6 rounded-md uppercase tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-crimson/50 outline-none"
						>
							Next
						</button>
					</div>
				</div>
			{/if}

			<!-- STEP 2: Contact Info -->
			{#if registrationState.step === 2}
				<div
					class="flex-1 flex flex-col justify-between"
					in:fly={{ x: 20, duration: 300, delay: 300 }}
					out:fly={{ x: 20, duration: 300 }}
				>
					<div
						class="border border-white/10 bg-charcoal/30 p-4 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4"
					>
						<div>
							<label for="firstName" class="block text-sm font-semibold text-bone/80 mb-1"
								>First Name *</label
							>
							<input
								type="text"
								id="firstName"
								bind:this={firstNameInput}
								bind:value={registrationState.form.firstName}
								required
								aria-invalid={!!step2Error}
								aria-describedby={step2Error ? 'step2-error' : undefined}
								class="w-full bg-charcoal border border-white/20 text-bone px-4 py-2 rounded-md focus:outline-none focus:border-crimson focus-visible:ring-2 focus-visible:ring-crimson/50 transition-colors"
								oninput={() => (step2Error = '')}
								onkeydown={handleKeyDown}
							/>
						</div>
						<div>
							<label for="lastName" class="block text-sm font-semibold text-bone/80 mb-1"
								>Last Name *</label
							>
							<input
								type="text"
								id="lastName"
								bind:value={registrationState.form.lastName}
								required
								aria-invalid={!!step2Error}
								aria-describedby={step2Error ? 'step2-error' : undefined}
								class="w-full bg-charcoal border border-white/20 text-bone px-4 py-2 rounded-md focus:outline-none focus:border-crimson focus-visible:ring-2 focus-visible:ring-crimson/50 transition-colors"
								oninput={() => (step2Error = '')}
								onkeydown={handleKeyDown}
							/>
						</div>
						<div>
							<label for="email" class="block text-sm font-semibold text-bone/80 mb-1"
								>Email *</label
							>
							<input
								type="email"
								id="email"
								bind:value={registrationState.form.email}
								required
								aria-invalid={!!step2Error}
								aria-describedby={step2Error ? 'step2-error' : undefined}
								class="w-full bg-charcoal border border-white/20 text-bone px-4 py-2 rounded-md focus:outline-none focus:border-crimson focus-visible:ring-2 focus-visible:ring-crimson/50 transition-colors"
								oninput={() => (step2Error = '')}
								onkeydown={handleKeyDown}
							/>
						</div>

						<div>
							<label for="city" class="block text-sm font-semibold text-bone/80 mb-1">City *</label>
							<input
								type="text"
								id="city"
								bind:value={registrationState.form.city}
								required
								aria-invalid={!!step2Error}
								aria-describedby={step2Error ? 'step2-error' : undefined}
								class="w-full bg-charcoal border border-white/20 text-bone px-4 py-2 rounded-md focus:outline-none focus:border-crimson transition-colors"
								oninput={() => (step2Error = '')}
								onkeydown={handleKeyDown}
							/>
						</div>

						<div>
							<label for="phone" class="block text-sm font-semibold text-bone/80 mb-1"
								>Cell (Optional)</label
							>
							<input
								type="tel"
								id="phone"
								bind:value={registrationState.form.phone}
								onkeydown={handleKeyDown}
								class="w-full bg-charcoal border border-white/20 text-bone px-4 py-2 rounded-md focus:outline-none focus:border-crimson focus-visible:ring-2 focus-visible:ring-crimson/50 transition-colors"
							/>
						</div>
					</div>

					<div class="flex flex-col">
						{#if step2Error}
							<p id="step2-error" role="alert" class="text-ember text-sm mb-2 text-right">
								{step2Error}
							</p>
						{/if}
						<div class="flex justify-between">
							<button
								type="button"
								onclick={() => registrationState.prevStep()}
								class="bg-white/10 hover:bg-white/20 text-bone font-bold py-2 px-6 rounded-md uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-crimson/50 outline-none"
							>
								Back
							</button>
							<button
								type="button"
								onclick={handleNextStep}
								class="bg-crimson hover:bg-ember text-bone font-bold py-2 px-6 rounded-md uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-crimson/50 outline-none"
							>
								Next
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- STEP 3: Interests & Church -->
			{#if registrationState.step === 3}
				<div
					class="flex-1 flex flex-col justify-between"
					in:fly={{ x: 20, duration: 300, delay: 300 }}
					out:fly={{ x: 20, duration: 300 }}
				>
					<div class="border border-white/10 bg-charcoal/30 p-4 rounded-md space-y-4">
						<div>
							<label for="homeChurch" class="block text-sm font-semibold text-bone/80 mb-1"
								>Home Church</label
							>
							<input
								type="text"
								id="homeChurch"
								bind:this={homeChurchInput}
								bind:value={registrationState.form.homeChurch}
								class="w-full bg-charcoal border border-white/20 text-bone px-4 py-2 rounded-md focus:outline-none focus:border-crimson focus-visible:ring-2 focus-visible:ring-crimson/50 transition-colors"
							/>
						</div>

						<div>
							<p class="text-sm font-semibold text-bone/80 mb-2">I'm interested in...</p>
							<div class="space-y-2">
								{#each [{ value: 'find-church', label: 'I want to find an abolitionist church' }, { value: 'accountability', label: 'I want to hold my representatives accountable' }, { value: 'next-phase', label: 'I want to help advance the next phase of abolition' }, { value: 'pastor-elder', label: "I'm a pastor/elder interested in abolitionism" }, { value: 'prayer', label: 'I want to support with prayer' }] as interest}
									<label
										class="flex items-center gap-3 cursor-pointer p-2 bg-charcoal/50 border border-transparent rounded-md hover:border-white/20 transition-colors"
									>
										<input
											type="checkbox"
											value={interest.value}
											checked={registrationState.form.interests.includes(interest.value)}
											onchange={() => toggleInterest(interest.value)}
											class="w-4 h-4 bg-charcoal border-white/30 rounded text-crimson focus:ring-crimson/50 focus-visible:ring-2 focus-visible:ring-crimson/50 outline-none"
										/>
										<span class="text-sm text-bone">{interest.label}</span>
									</label>
								{/each}
							</div>
						</div>
					</div>
				</div>

				{#if error}
					<p role="alert" class="text-ember text-sm text-center mt-4">{error}</p>
				{/if}

				<div class="flex justify-between mt-4">
					<button
						type="button"
						onclick={() => registrationState.prevStep()}
						class="bg-white/10 hover:bg-white/20 text-bone font-bold py-2 px-6 rounded-md uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-crimson/50 outline-none"
					>
						Back
					</button>
					<button
					type="submit"
					disabled={isSubmitting}
					onclick={() => console.log('Submit button clicked!')}
					class="w-1/2 bg-crimson hover:bg-ember text-bone font-bold py-2 rounded-md uppercase tracking-wide transition-colors shadow-lg hover:shadow-crimson/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-crimson/50 outline-none"
				>
					{#if isSubmitting}
						<div
							class="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"
							aria-hidden="true"
						></div>
						<span>Sending...</span>
					{:else}
						Submit
					{/if}
				</button>
				</div>
			{/if}
		</form>
	{:else}
		<div
			in:fly={{ y: 20, duration: 300, delay: 300 }}
			class="bg-green-900/20 border border-green-600 p-8 rounded-md text-center flex flex-col items-center gap-6"
		>
			<div>
				<p class="text-xl font-bold text-green-400 mb-2">Thank you for joining the fight!</p>
				<p class="text-bone/80">Someone already engaged in your area will contact you soon.</p>
			</div>

			<button
				type="button"
				onclick={handleAddAnother}
				class="bg-white/10 hover:bg-white/20 text-bone px-6 py-2 rounded-md font-bold uppercase tracking-wider transition-colors text-sm"
			>
				Submit Another Entry
			</button>
		</div>
	{/if}
</div>
