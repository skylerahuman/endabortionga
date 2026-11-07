import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	expect: {
		toHaveScreenshot: {
			maxDiffPixels: 100
		}
	},
	use: {
		baseURL: 'http://127.0.0.1:5174',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		headless: true
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
		url: 'http://127.0.0.1:5174',
		reuseExistingServer: false,
		env: {
			DATABASE_PATH: ':memory:',
			PUBLIC_SITE_ENV: 'prd',
			// Prove production suppresses diagnostic UI even with both flags enabled.
			PUBLIC_SHOW_MAP_DEBUG: 'true',
			PUBLIC_SHOW_PREVIEW_LABELS: 'true'
		},
		timeout: 120 * 1000
	}
});
