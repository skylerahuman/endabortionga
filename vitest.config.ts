import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['tests/setup.ts'],
		server: {
			deps: {
				inline: [/@node-rs\/argon2/]
			}
		}
	},
	resolve: {
		conditions: ['browser']
	},
	ssr: {
		noExternal: ['better-sqlite3']
	}
});
