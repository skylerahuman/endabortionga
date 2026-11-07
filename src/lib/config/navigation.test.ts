import { describe, it, expect } from 'vitest';
import { Routes, NavCategories, ExternalLinks, PagesWithHiddenNav } from '$lib/config/navigation';

describe('Navigation Configuration', () => {
	describe('Routes', () => {
		it('should have all required routes defined', () => {
			expect(Routes.HOME).toBeDefined();
			expect(Routes.GEORGIA_BATTLE).toBeDefined();
			expect(Routes.TIMELINE).toBeDefined();
			expect(Routes.FAQS).toBeDefined();
			expect(Routes.JOIN).toBeDefined();
			expect(Routes.SUPPORT).toBeDefined();
			expect(Routes.ABOUT).toBeDefined();
			expect(Routes.BILL_ANALYSIS).toBeDefined();
			expect(Routes.BURNS_ACCOUNTABILITY).toBeDefined();
			expect(Routes.REP_CALLS).toBeDefined();

			expect(Routes.GET_INVOLVED).toBeDefined();
			expect(Routes.ABOLITION_BASICS).toBeDefined();
			expect(Routes.FOR_PASTORS).toBeDefined();
		});

		it('should have unique route paths', () => {
			const routes = Object.values(Routes);
			const paths = routes.map((route) => route);
			const uniquePaths = new Set(paths);
			expect(uniquePaths.size).toBe(paths.length);
		});

		it('should have all routes starting with / or /base path', () => {
			const routes = Object.values(Routes);
			routes.forEach((route) => {
				expect(route).toMatch(/^\/.*/);
			});
		});
	});

	describe('NavCategories', () => {
		it('should have Learn, Take Action, and About categories', () => {
			const categoryNames = NavCategories.map((cat) => cat.name);
			expect(categoryNames).toContain('Learn');
			expect(categoryNames).toContain('Take Action');
			expect(categoryNames).toContain('About');
		});

		it('should have at least 3 links in Learn category', () => {
			const learnCategory = NavCategories.find((cat) => cat.name === 'Learn');
			expect(learnCategory).toBeDefined();
			expect(learnCategory!.links.length).toBeGreaterThanOrEqual(3);
		});

		it('should have at least 3 links in Take Action category', () => {
			const takeActionCategory = NavCategories.find((cat) => cat.name === 'Take Action');
			expect(takeActionCategory).toBeDefined();
			expect(takeActionCategory!.links.length).toBeGreaterThanOrEqual(3);
		});

		it('should have at least 3 links in About category', () => {
			const aboutCategory = NavCategories.find((cat) => cat.name === 'About');
			expect(aboutCategory).toBeDefined();
			expect(aboutCategory!.links.length).toBeGreaterThanOrEqual(3);
		});

		it('should have valid hrefs for all category links', () => {
			NavCategories.forEach((category) => {
				category.links.forEach((link) => {
					expect(link.href).toBeDefined();
					expect(link.href.length).toBeGreaterThan(0);
					expect(link.label).toBeDefined();
					expect(link.label.length).toBeGreaterThan(0);
				});
			});
		});

		it('should include Georgia Battle and Join links', () => {
			const allLinks = NavCategories.flatMap((cat) => cat.links);
			const hasGeorgiaBattle = allLinks.some((link) =>
				link.label.toLowerCase().includes('georgia battle')
			);
			const hasJoin = allLinks.some((link) => link.label.toLowerCase().includes('join'));
			expect(hasGeorgiaBattle).toBe(true);
			expect(hasJoin).toBe(true);
		});
	});

	describe('ExternalLinks', () => {
		it('routes donations through the independent movement checkout', () => {
			expect(ExternalLinks.DONATE).toBe('/support');
		});

		it('should have Plural Policy URL', () => {
			expect(ExternalLinks.PLURAL_POLICY).toContain('pluralpolicy.com');
		});

		it('routes registration to the private movement account flow', () => {
			expect(ExternalLinks.ACCOUNT).toBe('/join');
		});

		it('should have YouTube URL', () => {
			expect(ExternalLinks.YOUTUBE).toContain('youtube.com');
		});
	});

	describe('PagesWithHiddenNav', () => {
		it('should have valid paths for hidden nav pages', () => {
			PagesWithHiddenNav.forEach((path) => {
				expect(path).toMatch(/^\//);
			});
		});

		it('should have fill-the-steps and feb pages hidden', () => {
			expect(PagesWithHiddenNav).toContainEqual(expect.stringContaining('fill-the-steps'));
			expect(PagesWithHiddenNav).toContainEqual(expect.stringContaining('feb-20-2026'));
		});
	});
});
