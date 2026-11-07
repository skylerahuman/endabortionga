import { test, expect } from '@playwright/test';

test.describe('For Pastors Page', () => {
	test('should display pastor resources and key concepts', async ({ page }) => {
		// Navigate to page
		await page.goto('/for-pastors');

		// Wait for load
		await page.waitForLoadState('networkidle');

		// 1. Verify Header
		await expect(
			page.getByRole('heading', { name: 'For Pastors and Church Leaders' })
		).toBeVisible();

		// 2. Verify "Turned Over Hypothesis" section
		await expect(page.getByRole('heading', { name: 'The Turned Over Hypothesis' })).toBeVisible();
		await expect(page.getByText(/Romans 1 gives us the diagnosis/)).toBeVisible();

		// 3. Verify Documentary
		await expect(
			page.getByRole('heading', { name: 'Essential Viewing: The Fatal Flaw' })
		).toBeVisible();
		// Check iframe existence
		const iframe = page.locator('iframe[title="The Fatal Flaw Documentary"]');
		await expect(iframe).toBeVisible();
		await expect(iframe).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/k33epqzJIlM');

		// 4. Verify PastorCTA
		// The PastorCTA component usually has a heading like "Are you a Pastor?" or "Add Your Church"
		// Based on JoinForm test: await expect(page.getByText('Are you a Pastor?')).toBeVisible();
		await expect(page.getByText('Are you a Pastor?')).toBeVisible();

		// Screenshot for verification
		await page.screenshot({ path: 'test-results/for-pastors.png', fullPage: true });
	});
});
