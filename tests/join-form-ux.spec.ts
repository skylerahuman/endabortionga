import { expect, test } from '@playwright/test';

test('account registration associates only a direct district and selected consent categories', async ({
	page
}) => {
	const sent: string[] = [];
	page.on('request', (request) => {
		if (request.method() === 'POST') sent.push(request.postData() ?? '');
	});
	await page.goto('/join');
	const email = `join-${crypto.randomUUID()}@example.test`;
	await page.getByLabel('Email', { exact: true }).fill(email);
	await page.getByLabel('Password', { exact: true }).fill('StrongGeorgia123!');
	await page.getByLabel('House District (optional)').fill('42');
	await page.getByLabel('Events', { exact: true }).check();
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByRole('heading', { name: email })).toBeVisible();
	await expect(page.getByText('Current region: West Metro')).toBeVisible();
	const registration = sent.map((body) => JSON.parse(body)).find((body) => body.email === email);
	expect(registration.district_id).toBe(42);
	expect(registration.events).toBe(true);
	expect(registration.prayer_needs).toBe(false);
	expect(registration).not.toHaveProperty('address');
	expect(registration).not.toHaveProperty('latitude');
	expect(registration).not.toHaveProperty('income');
});
