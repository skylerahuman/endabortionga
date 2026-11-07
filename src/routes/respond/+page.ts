import { redirect } from '@sveltejs/kit';

// Retire the imported organization's contact/fundraising form. Never reuse its donor destination.
export function load() {
	throw redirect(307, '/connect');
}
