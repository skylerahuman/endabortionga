import { describe, expect, it } from 'vitest';
import { bandFor } from '$lib/map/rmi';

describe('RMI display bands', () => {
	it('keeps a region without activity unengaged regardless of a score', () => {
		expect(bandFor(100, false)).toBe('unengaged');
		expect(bandFor(0, false)).toBe('unengaged');
	});

	it('uses increasingly engaged theme bands for positive RMI', () => {
		expect(bandFor(0.1, true)).toBe('low');
		expect(bandFor(9.99, true)).toBe('low');
		expect(bandFor(10, true)).toBe('medium');
		expect(bandFor(25, true)).toBe('high');
		expect(bandFor(50, true)).toBe('highest');
		expect(bandFor(50.01, true)).toBe('highest');
	});
});
