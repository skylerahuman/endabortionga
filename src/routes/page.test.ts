import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Page from './+page.svelte';
vi.stubGlobal(
	'fetch',
	vi.fn(async () => new Response('{}', { status: 503 }))
);

describe('map-only homepage', () => {
	it('uses a screen-reader heading instead of a promotional hero', () => {
		render(Page);
		expect(screen.getByRole('heading', { name: 'Georgia regions' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Participation' })).toBeInTheDocument();
		expect(screen.queryByText(/See where the church/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Six regions\. One movement/)).not.toBeInTheDocument();
	});
	it('does not embed registration, giving, or technical debug text', () => {
		render(Page);
		expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument();
		expect(screen.queryByText(/Fund the next local action/)).not.toBeInTheDocument();
		expect(screen.queryByText(/RMI combines/)).not.toBeInTheDocument();
		expect(screen.queryByTestId('map-debug')).not.toBeInTheDocument();
		expect(screen.queryByTestId('preview-label')).not.toBeInTheDocument();
	});
});
