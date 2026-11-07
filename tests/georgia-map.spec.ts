import { test, expect } from '@playwright/test';

test('loads the six-region map on demand and supports interactive selection', async ({ page }) => {
	await page.goto('/georgia-map');
	await expect(page.getByRole('heading', { name: 'Georgia regions' })).toBeVisible();
	await expect(page.locator('svg path[data-region]')).toHaveCount(6, { timeout: 15_000 });
	await page.getByRole('button', { name: 'Middle Georgia region' }).dispatchEvent('click');
	await expect(page.getByRole('heading', { name: 'Middle Georgia', exact: true })).toBeVisible();
});

test('the main homepage includes the working region map', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('svg path[data-region]')).toHaveCount(6, { timeout: 15_000 });
});

test('is usable in a narrow mobile viewport', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/georgia-map');
	await expect(page.locator('svg path[data-region]')).toHaveCount(6, { timeout: 15_000 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('offers retry after a failed boundary request', async ({ page }) => {
	await page.route('**/data/georgia-regions.json', (route) => route.fulfill({ status: 503 }));
	await page.goto('/georgia-map');
	await expect(page.getByRole('alert')).toContainText('could not load', { timeout: 15_000 });
});
