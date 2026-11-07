import { test, expect } from '@playwright/test';

test('landing page opens to the map and rankings, without promotional or technical copy', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.locator('path[data-region]')).toHaveCount(6);
	await expect(page.getByRole('heading', { name: 'Participation', exact: true })).toBeVisible();
	await expect(page.locator('.seed')).toHaveAttribute('aria-label', /Pine Forest Baptist Church/);
	await expect(
		page.getByText(
			'The map shows aggregate movement activity only. No household or personal data is published.'
		)
	).toBeVisible();
	for (const text of [
		'See where the church is mobilizing.',
		'Six regions. One movement',
		'RMI combines',
		'Georgia Mobilization Atlas',
		'Local development preview',
		'Fund the next local action',
		'The church is the primary instrument.'
	]) {
		await expect(page.getByText(text, { exact: false })).toHaveCount(0);
	}
	await expect(page.getByRole('button', { name: 'Create account' })).toHaveCount(0);
	await expect(page.getByTestId('map-debug')).toHaveCount(0);
	await expect(page.getByTestId('preview-label')).toHaveCount(0);
});

test('unengaged regions use charcoal hatching and remain keyboard selectable', async ({ page }) => {
	await page.goto('/');
	const region = page.getByRole('button', { name: 'Middle Georgia region' });
	await expect(region).toHaveAttribute('fill', /^url\(#/);
	await region.focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Middle Georgia', exact: true })).toBeVisible();
	await expect(page.getByText('Relative mobilization')).toBeVisible();
});

test('Connect is a separate screen, with private registration and opt-ins', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Connect', exact: true }).click();
	await expect(page).toHaveURL(/\/connect$/);
	await expect(page.getByRole('heading', { name: 'Connect', exact: true })).toBeVisible();
	const email = `movement-${crypto.randomUUID()}@example.test`;
	await page.getByLabel('Email', { exact: true }).fill(email);
	await page.getByLabel('Password', { exact: true }).fill('StrongGeorgia123!');
	await page.getByLabel('House District (optional)').fill('150');
	await page.getByLabel('Giving needs').check();
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByRole('heading', { name: email })).toBeVisible();
	await expect(page.getByText('Current region: South Georgia')).toBeVisible();
	await page.reload();
	await expect(page.getByLabel('Giving needs')).toBeChecked();
	await expect(page.getByLabel('Prayer needs')).not.toBeChecked();
	await page.getByLabel('House District', { exact: true }).fill('142');
	await page.getByRole('button', { name: 'Save account' }).click();
	await expect(page.getByText('Current region: Middle Georgia')).toBeVisible();
	await page.getByText('District history').click();
	await expect(page.getByText(/House District 150/)).toBeVisible();
	await expect(page.getByText(/House District 142/)).toBeVisible();
});

test('giving is separate and does not expose unconfigured checkout internals', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Give', exact: true }).click();
	await expect(page).toHaveURL(/\/support$/);
	await expect(page.getByRole('heading', { name: 'Give', exact: true })).toBeVisible();
	await expect(page.getByText('Giving is not available yet.')).toBeVisible();
	await expect(page.getByRole('button', { name: /attribution/i })).toHaveCount(0);
	await expect(page.getByText(/Hosted Givebutter checkout/)).toHaveCount(0);
});
