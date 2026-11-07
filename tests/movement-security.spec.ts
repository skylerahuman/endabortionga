import { expect, test } from '@playwright/test';

test('registration validates district before creating an account; server derives region; private APIs are not cached', async ({
	request
}) => {
	const email = `security-${crypto.randomUUID()}@example.test`;
	const account = { email, password: 'StrongGeorgia123!' };
	const invalid = await request.post('/api/auth/register', {
		data: { ...account, district_id: 181 }
	});
	expect(invalid.status()).toBe(400);
	const valid = await request.post('/api/auth/register', {
		data: { ...account, district_id: 150, region_id: 'east-metro' }
	});
	expect(valid.status()).toBe(201);
	const identity = await request.get('/api/me');
	expect(identity.headers()['cache-control']).toBe('no-store');
	const me = await identity.json();
	expect(me.assignment.region_id).toBe('south-georgia');
	expect(Object.values(me.preferences).filter((value) => value === true)).toHaveLength(0);
	const denied = await request.put('/api/me/district', { data: { district_id: 42 } });
	expect(denied.status()).toBe(403);
	expect((await request.get('/api/finance/disbursements')).status()).toBe(403);
	expect(
		(
			await request.put('/api/campaign/regions/east-metro', { data: { headline: 'forged' } })
		).status()
	).toBe(403);
	const headers = { 'x-csrf-token': me.csrfToken };
	for (let i = 0; i < 2; i++) {
		expect(
			(await request.post('/api/participation', { headers, data: { kind: 'volunteer' } })).status()
		).toBe(200);
	}
	const exported = await (await request.get('/api/me/export')).json();
	expect(exported.participation).toHaveLength(1);
	expect((await request.delete('/api/me', { headers })).status()).toBe(200);
	expect((await (await request.get('/api/me')).json()).authenticated).toBe(false);
});

test('unconfigured payment ingestion fails closed and checkout is disabled', async ({
	request
}) => {
	const config = await (await request.get('/api/donations/config')).json();
	expect(config.configured).toBe(false);
	expect(config.campaign).toBeNull();
	expect((await request.post('/api/donations/webhook', { data: { amount: 9999 } })).status()).toBe(
		503
	);
});
