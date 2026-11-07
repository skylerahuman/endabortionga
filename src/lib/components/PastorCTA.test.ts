import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import PastorCTA from './PastorCTA.svelte';

describe('PastorCTA', () => {
	it('should render the pastor question and link', () => {
		render(PastorCTA);

		const question = screen.getByText('Are you a Pastor?');
		expect(question).toBeInTheDocument();

		const link = screen.getByRole('link', { name: /add your church/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/join');
	});
});
