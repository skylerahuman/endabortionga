import { test, expect } from '@playwright/test';

test('join opens the private account flow, not the legacy volunteer form', async ({ page }) => {
	await page.goto('/join');
	await expect(page.getByRole('heading', { name: 'Connect', exact: true })).toBeVisible();
	await expect(page.getByLabel('House District (optional)')).toBeVisible();
	await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
	await expect(page.getByLabel('Giving needs')).not.toBeChecked();
	await expect(page.getByLabel('Prayer needs')).not.toBeChecked();
	await expect(page.getByLabel('Legislative action')).not.toBeChecked();
	await expect(page.getByLabel('Events', { exact: true })).not.toBeChecked();
	await expect(page.getByLabel('City')).toHaveCount(0);
	await expect(page.getByLabel('Street address')).toHaveCount(0);
});

test('join provides a return to the primary region map', async ({ page }) => {
	await page.goto('/join');
	await page.getByRole('link', { name: 'Back to the region map' }).click();
	await expect(page.locator('path[data-region]')).toHaveCount(6);
});
