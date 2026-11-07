<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { regionForDistrict } from '$lib/config/regions';
	import { REGION_BY_ID } from '$lib/config/regions';

	interface Me {
		authenticated: boolean;
		user?: { id: string; email: string; role: string };
		assignment?: { district_id: number; region_id: string; assigned_at: string } | null;
		history?: Array<{
			district_id: number;
			region_id: string;
			assigned_at: string;
			ended_at: string | null;
		}>;
		preferences?: {
			giving_needs: boolean;
			prayer_needs: boolean;
			legislative_action: boolean;
			events: boolean;
		};
		csrfToken?: string;
	}

	let me = $state<Me | null>(null);
	let mode = $state<'register' | 'login'>('register');
	let email = $state('');
	let password = $state('');
	let districtId = $state<number | null>(null);
	let districtText = $state('');
	let ready = $state(false);
	let participationKind = $state('briefing_packet');
	let givingNeeds = $state(false);
	let prayerNeeds = $state(false);
	let legislativeAction = $state(false);
	let events = $state(false);
	let message = $state('');
	let errorMessage = $state('');
	let busy = $state(false);
	let authRevision = 0;
	function applyIdentity(identity: Me) {
		me = identity;
		givingNeeds = Boolean(identity.preferences?.giving_needs);
		prayerNeeds = Boolean(identity.preferences?.prayer_needs);
		legislativeAction = Boolean(identity.preferences?.legislative_action);
		events = Boolean(identity.preferences?.events);
		districtId = identity.assignment?.district_id ?? null;
		districtText = districtId === null ? '' : String(districtId);
	}
	onMount(() => {
		const controller = new AbortController();
		const revision = authRevision;
		void (async () => {
			try {
				const response = await fetch('/api/me', { signal: controller.signal, cache: 'no-store' });
				if (!response.ok) throw new Error('Account service unavailable');
				const identity: Me = await response.json();
				if (revision !== authRevision || controller.signal.aborted) return;
				applyIdentity(identity);
			} catch {
				if (!controller.signal.aborted)
					errorMessage = 'Account service is temporarily unavailable.';
			} finally {
				if (!controller.signal.aborted) ready = true;
			}
		})();
		return () => controller.abort();
	});

	async function submitAuth(event: SubmitEvent) {
		authRevision += 1;
		busy = true;
		errorMessage = '';
		message = '';
		try {
			const formData = new FormData(event.currentTarget as HTMLFormElement);
			const submittedDistrict = String(formData.get('district') ?? '').trim();
			if (submittedDistrict) {
				districtText = submittedDistrict;
				districtId = Number(submittedDistrict);
			}
			const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					district_id:
						mode === 'register' && submittedDistrict ? Number(submittedDistrict) : undefined,
					giving_needs: givingNeeds,
					prayer_needs: prayerNeeds,
					legislative_action: legislativeAction,
					events
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? 'Request failed.');
			message = mode === 'register' ? 'Account created.' : 'Signed in.';
			applyIdentity((await (await fetch('/api/me')).json()) as Me);
			password = '';
			await tick();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Request failed.';
		} finally {
			busy = false;
		}
	}

	async function recordParticipation() {
		if (!me?.authenticated || !me.assignment) return;
		busy = true;
		errorMessage = '';
		try {
			const response = await fetch('/api/participation', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-csrf-token': me.csrfToken ?? '' },
				body: JSON.stringify({ kind: participationKind })
			});
			if (!response.ok) throw new Error('Could not record participation.');
			message = 'Participation recorded for your current region.';
			window.dispatchEvent(new Event('movement:activity'));
		} catch (cause) {
			errorMessage = cause instanceof Error ? cause.message : 'Request failed.';
		} finally {
			busy = false;
		}
	}

	async function saveAccount(event: SubmitEvent) {
		if (!me?.authenticated) return;
		busy = true;
		errorMessage = '';
		message = '';
		try {
			const formData = new FormData(event.currentTarget as HTMLFormElement);
			const submittedDistrict = String(formData.get('district') ?? '').trim();
			if (submittedDistrict) {
				districtText = submittedDistrict;
				districtId = Number(submittedDistrict);
			}
			const headers = {
				'content-type': 'application/json',
				'x-csrf-token': me.csrfToken ?? ''
			};
			if (districtId !== null && (districtId !== me.assignment?.district_id || regionForDistrict(districtId) !== me.assignment?.region_id)) {
				const response = await fetch('/api/me/district', {
					method: 'PUT',
					headers,
					body: JSON.stringify({ district_id: districtId })
				});
				const data = await response.json();
				if (!response.ok) throw new Error(data.error ?? 'District update failed.');
			}
			const response = await fetch('/api/me/preferences', {
				method: 'PUT',
				headers,
				body: JSON.stringify({
					giving_needs: givingNeeds,
					prayer_needs: prayerNeeds,
					legislative_action: legislativeAction,
					events
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? 'Preferences update failed.');
			me = (await (await fetch('/api/me')).json()) as Me;
			message = 'Your district and communication choices are saved.';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Update failed.';
		} finally {
			busy = false;
		}
	}

	async function signOut() {
		await fetch('/api/auth/logout', { method: 'POST' });
		me = null;
		message = 'Signed out.';
	}

	async function exportAccount() {
		if (!me?.authenticated) return;
		const response = await fetch('/api/me/export');
		if (!response.ok) return;
		const data = await response.json();
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'georgia-movement-account.json';
		link.click();
		URL.revokeObjectURL(url);
	}

	async function deleteAccount() {
		if (!me?.authenticated) return;
		if (!confirm('Delete your account and personal movement history? This cannot be undone.'))
			return;
		const response = await fetch('/api/me', {
			method: 'DELETE',
			headers: { 'x-csrf-token': me.csrfToken ?? '' }
		});
		if (response.ok) {
			me = null;
			message = 'Your account was deleted.';
		}
	}

	function regionName(id: number | null): string {
		if (!id) return 'Not associated';
		return REGION_BY_ID[regionForDistrict(id)].name;
	}
</script>

<section class="account" aria-labelledby="account-title" aria-busy={!ready}>
	{#if !ready}<p role="status">Checking account…</p>{/if}
	<fieldset disabled={!ready} class="account-ready">
		{#if !me?.authenticated}
			<header>
				<h1 id="account-title">Connect</h1>
				<p>Your address is never required.</p>
			</header>

			<div class="tabs" role="tablist" aria-label="Account action">
				<button role="tab" aria-selected={mode === 'register'} onclick={() => (mode = 'register')}
					>Register</button
				>
				<button role="tab" aria-selected={mode === 'login'} onclick={() => (mode = 'login')}
					>Sign in</button
				>
			</div>

			<form
				onsubmit={(event) => {
					event.preventDefault();
					submitAuth(event);
				}}
			>
				<label>Email<input type="email" bind:value={email} autocomplete="email" required /></label>
				<label
					>Password<input
						type="password"
						bind:value={password}
						autocomplete={mode === 'register' ? 'new-password' : 'current-password'}
						minlength="12"
						required
					/></label
				>
				{#if mode === 'register'}
					<label
						>House District (optional)<input
							type="number"
							name="district"
							value={districtText}
							oninput={(event) => {
								const value = (event.target as HTMLInputElement).value;
								districtText = value;
								districtId = value === '' ? null : Number(value);
							}}
							min="1"
							max="180"
							placeholder="1–180"
						/></label
					>
					<fieldset>
						<legend>Communication choices</legend>
						<p>Each choice is off until you select it.</p>
						<label class="check"
							><input type="checkbox" bind:checked={givingNeeds} /> Giving needs</label
						>
						<label class="check"
							><input type="checkbox" bind:checked={prayerNeeds} /> Prayer needs</label
						>
						<label class="check"
							><input type="checkbox" bind:checked={legislativeAction} /> Legislative action</label
						>
						<label class="check"><input type="checkbox" bind:checked={events} /> Events</label>
					</fieldset>
				{/if}
				<button class="primary" disabled={busy}
					>{busy ? 'Working…' : mode === 'register' ? 'Create account' : 'Sign in'}</button
				>
			</form>
		{:else}
			<header>
				<p class="kicker">Your account</p>
				<h2 id="account-title">{me.user?.email}</h2>
				<p>Current region: {regionName(me.assignment?.district_id ?? null)}</p>
			</header>
			<form
				onsubmit={(event) => {
					event.preventDefault();
					saveAccount(event);
				}}
			>
				<label
					>House District<input
						type="number"
						name="district"
						value={districtText}
						oninput={(event) => {
							const value = (event.target as HTMLInputElement).value;
							districtText = value;
							districtId = value === '' ? null : Number(value);
						}}
						min="1"
						max="180"
						required
					/></label
				>
				<p class="privacy">
					Changing districts closes the old assignment but keeps it in your history. Earlier
					activity stays attributed to the region where it occurred.
				</p>
				<fieldset>
					<legend>Communication choices</legend>
					<label class="check"
						><input type="checkbox" bind:checked={givingNeeds} /> Giving needs</label
					>
					<label class="check"
						><input type="checkbox" bind:checked={prayerNeeds} /> Prayer needs</label
					>
					<label class="check"
						><input type="checkbox" bind:checked={legislativeAction} /> Legislative action</label
					>
					<label class="check"><input type="checkbox" bind:checked={events} /> Events</label>
				</fieldset>
				<button class="primary" disabled={busy}>{busy ? 'Saving…' : 'Save account'}</button>
				<button class="text-button" type="button" onclick={signOut}>Sign out</button>
				<div class="account-actions">
					<button class="text-button" type="button" onclick={exportAccount}>Export my data</button>
					<button class="text-button danger" type="button" onclick={deleteAccount}
						>Delete my account</button
					>
				</div>
			</form>
			{#if me.history && me.history.length > 1}
				<details>
					<summary>District history</summary>
					<ul>
						{#each me.history as item}<li>
								House District {item.district_id} · {item.region_id} · {item.assigned_at.slice(
									0,
									10
								)}
							</li>{/each}
					</ul>
				</details>
			{/if}
		{/if}

		{#if me?.authenticated && me.assignment}
			<div class="participation">
				<label for="participation-kind">Record an action you completed</label>
				<select id="participation-kind" bind:value={participationKind}>
					<option value="briefing_packet">Delivered a pastoral briefing</option>
					<option value="volunteer">Volunteered</option>
					<option value="prayer">Joined intercession</option>
					<option value="event">Attended an event</option>
					<option value="outreach">Participated in outreach</option>
				</select>
				<button type="button" onclick={recordParticipation} disabled={busy}
					>Record participation</button
				>
				<p class="privacy">
					Self-reported activity. One action of each type per day counts; repeated clicks do not
					increase the people count.
				</p>
			</div>
		{/if}
		<details class="address">
			<summary>Use an address instead</summary>
			<p>
				Street-address lookup is pending an offline Georgia address index. No address is collected
				or submitted to our server. Enter a House District number directly for now.
			</p>
			<p>
				A ZIP code can cross multiple House districts and is not a reliable substitute for address
				containment.
			</p>
		</details>

		{#if message}<p class="notice" role="status">{message}</p>{/if}
		{#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}
	</fieldset>
</section>

<style>
	.account-ready {
		border: 0;
		padding: 0;
		min-width: 0;
		display: block;
	}
	.participation {
		display: grid;
		gap: 12px;
		max-width: 700px;
		margin-top: 24px;
	}
	select {
		min-height: 48px;
		padding: 10px;
		background: white;
		border: 1px solid #69715f;
	}
	.account {
		background: #f0ede4;
		color: #171b15;
		padding: clamp(20px, 4vw, 52px);
		font-family: system-ui, sans-serif;
	}
	header {
		max-width: 680px;
		margin-bottom: 28px;
	}
	.kicker {
		color: #536534;
		font:
			700 11px ui-monospace,
			monospace;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	h1, h2 {
		color: #171b15;
		font-size: clamp(28px, 4vw, 48px);
		margin: 8px 0 14px;
	}
	p {
		line-height: 1.55;
	}
	.tabs {
		display: flex;
		border-bottom: 2px solid #242a21;
		margin-bottom: 24px;
	}
	.tabs button {
		min-height: 48px;
		border: 0;
		background: none;
		padding: 12px 20px;
		cursor: pointer;
		font-weight: 800;
	}
	.tabs button[aria-selected='true'] {
		color: #536534;
		box-shadow: inset 0 -4px #829b4a;
	}
	form {
		display: grid;
		gap: 18px;
		max-width: 700px;
	}
	label,
	legend {
		font-weight: 750;
	}
	input:not([type='checkbox']) {
		display: block;
		width: 100%;
		min-height: 50px;
		margin-top: 7px;
		padding: 10px 13px;
		border: 1px solid #69715f;
		border-radius: 0;
		background: #fff;
		color: #111;
		font: inherit;
	}
	fieldset {
		border: 1px solid #aeb5a5;
		padding: 18px;
		display: grid;
		gap: 12px;
	}
	legend {
		padding-inline: 8px;
	}
	fieldset p {
		margin: 0;
		color: #596052;
		font-size: 14px;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-weight: 600;
	}
	.check input {
		width: 20px;
		height: 20px;
		accent-color: #61783a;
	}
	button {
		min-height: 48px;
		padding: 11px 18px;
		border: 1px solid #252c21;
		background: #fff;
		color: #171b15;
		cursor: pointer;
		font-weight: 800;
	}
	.primary {
		background: #20271b;
		color: #fff;
	}
	.text-button {
		border: 0;
		background: none;
		text-decoration: underline;
	}
	.account-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px 20px;
	}
	.danger {
		color: #8a3029;
	}
	.address {
		margin-top: 28px;
		border-top: 1px solid #aeb5a5;
		padding-top: 18px;
		display: grid;
		gap: 16px;
	}
	summary {
		cursor: pointer;
		font-weight: 800;
		min-height: 44px;
		display: flex;
		align-items: center;
	}
	.privacy {
		color: #596052;
		font-size: 14px;
	}
	.notice {
		padding: 12px;
		border-left: 4px solid #61783a;
		background: #dde4cb;
	}
	.error {
		padding: 12px;
		border-left: 4px solid #9b453e;
		background: #eedbd7;
	}
	details ul {
		padding-left: 20px;
		line-height: 1.7;
	}
	@media (max-width: 520px) {
		.account {
			padding-inline: 16px;
		}
	}
</style>
