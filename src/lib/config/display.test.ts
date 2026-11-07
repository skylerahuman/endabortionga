import { describe, expect, it } from 'vitest';
import { displayFlags } from './display';

describe('environment-driven display flags', () => {
	it('hides preview labels and diagnostics by default', () => {
		expect(displayFlags({})).toEqual({ mapDebug: false, previewLabels: false });
	});
	it('allows explicit flags on dev builds', () => {
		expect(
			displayFlags({
				PUBLIC_SITE_ENV: 'dev',
				PUBLIC_SHOW_MAP_DEBUG: 'true',
				PUBLIC_SHOW_PREVIEW_LABELS: 'true'
			})
		).toEqual({ mapDebug: true, previewLabels: true });
	});
	it('hard-disables them in prd even if flags were accidentally left enabled', () => {
		for (const siteEnv of ['prd', 'production']) {
			expect(
				displayFlags({
					PUBLIC_SITE_ENV: siteEnv,
					PUBLIC_SHOW_MAP_DEBUG: 'true',
					PUBLIC_SHOW_PREVIEW_LABELS: 'true'
				})
			).toEqual({ mapDebug: false, previewLabels: false });
		}
	});
});
