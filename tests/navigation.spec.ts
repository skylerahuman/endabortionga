import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
	test(`navigation opens and closes at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 844 });
		await page.goto('/');
		const toggle = page.getByRole('button', { name: 'Toggle menu' });
		await toggle.click();
		const menu = page.locator('.overlay-menu');
		await expect(menu).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		for (const category of ['Learn', 'Take Action', 'About']) {
			await expect(menu.getByRole('heading', { name: category, exact: true })).toBeVisible();
		}
		await page.keyboard.press('Escape');
		await expect(menu).toHaveCount(0);
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});
}

test('menu links navigate without bypassing the actual click handler', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Toggle menu' }).click();
	await page.locator('.overlay-menu').getByRole('link', { name: 'FAQs', exact: true }).click();
	await expect(page).toHaveURL(/\/faqs$/);
	await expect(page.locator('.overlay-menu')).toHaveCount(0);
	await page.getByRole('button', { name: 'Toggle menu' }).click();
	await page
		.locator('.overlay-menu')
		.getByRole('link', { name: 'Join the Fight', exact: true })
		.click();
	await expect(page).toHaveURL(/\/join$/);
	await expect(page.getByRole('heading', { name: 'Connect', exact: true })).toBeVisible();
});

test('landing map has no footer content; secondary screens keep navigation', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('contentinfo')).toHaveCount(0);
	await page.getByRole('link', { name: 'Connect', exact: true }).click();
	await expect(page).toHaveURL(/\/connect$/);
	const footer = page.getByRole('contentinfo');
	await expect(footer).toBeVisible();
	await footer.getByRole('link', { name: 'FAQs', exact: true }).click();
	await expect(page).toHaveURL(/\/faqs$/);
});

test('active menu link is marked on secondary pages', async ({ page }) => {
	await page.goto('/faqs');
	await page.getByRole('button', { name: 'Toggle menu' }).click();
	await expect(
		page.locator('.overlay-menu').getByRole('link', { name: 'FAQs', exact: true })
	).toHaveClass(/bg-burgundy/);
});

test('legacy action links remain navigable', async ({ page }) => {
	await page.goto('/burns-accountability');
	await page
		.locator('#main-content')
		.getByRole('link', { name: 'Call Your Representative' })
		.click();
	await expect(page).toHaveURL(/\/rep-calls$/);
	await page.getByRole('link', { name: 'Learn more about the accountability campaign' }).click();
	await expect(page).toHaveURL(/\/burns-accountability$/);
});
