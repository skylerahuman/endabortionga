import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Snippet } from 'svelte';
import Layout from './+layout.svelte';
const state = vi.hoisted(() => ({ page: { url: { pathname: '/' } } }));
vi.mock('$app/state', () => state);
vi.mock('$app/paths', () => ({ base: '' }));
const children = (() => {}) as unknown as Snippet<[]>;
beforeEach(() => {
	state.page.url.pathname = '/';
});

describe('site layout', () => {
	it('provides separate Connect and Give screens', () => {
		render(Layout, { props: { children } });
		expect(screen.getByRole('link', { name: 'Connect' })).toHaveAttribute('href', '/connect');
		expect(screen.getByRole('link', { name: 'Give' })).toHaveAttribute('href', '/support');
	});
	it('does not append a content footer below the landing map', () => {
		render(Layout, { props: { children } });
		expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
	});
	it('keeps footer navigation on secondary screens without preview copy', () => {
		state.page.url.pathname = '/about';
		render(Layout, { props: { children } });
		expect(screen.getByRole('contentinfo')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Join the Fight' })).toHaveAttribute('href', '/join');
		expect(screen.queryByText(/Development preview/)).not.toBeInTheDocument();
	});
});
