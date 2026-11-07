import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	if (event.url.pathname.startsWith('/api/')) {
		response.headers.set('cache-control', 'no-store');
	}
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('x-frame-options', 'DENY');
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	response.headers.set('permissions-policy', 'geolocation=(), camera=(), microphone=()');
	response.headers.set(
		'content-security-policy',
		"default-src 'self'; script-src 'self' 'unsafe-inline' https://widgets.givebutter.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://widgets.givebutter.com https://api.givebutter.com; frame-src https://widgets.givebutter.com https://givebutter.com; base-uri 'self'; form-action 'self' https://givebutter.com; frame-ancestors 'none'"
	);
	return response;
};
