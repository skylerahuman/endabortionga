import { error, json, type Cookies, type RequestEvent } from '@sveltejs/kit';
import { createSession, deleteSession, getSession } from './db';

export const SESSION_COOKIE = 'movement_session';
export const CSRF_COOKIE = 'movement_csrf';
const SESSION_DAYS = 30;

export function sessionCookieOptions(secure: boolean) {
	return {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax' as const,
		maxAge: SESSION_DAYS * 24 * 60 * 60
	};
}

export function csrfCookieOptions(secure: boolean) {
	return {
		path: '/',
		httpOnly: false,
		secure,
		sameSite: 'lax' as const,
		maxAge: SESSION_DAYS * 24 * 60 * 60
	};
}

export function establishSession(cookies: Cookies, userId: string, secure: boolean): string {
	const csrfToken = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
	const token = createSession(userId, csrfToken, expiresAt);
	cookies.set(SESSION_COOKIE, token, sessionCookieOptions(secure));
	cookies.set(CSRF_COOKIE, csrfToken, csrfCookieOptions(secure));
	return csrfToken;
}

export function clearSession(cookies: Cookies): void {
	const token = cookies.get(SESSION_COOKIE);
	if (token) deleteSession(token);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	cookies.delete(CSRF_COOKIE, { path: '/' });
}

export function currentUser(cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return undefined;
	return getSession(token);
}

export function requireUser(event: RequestEvent) {
	const session = currentUser(event.cookies);
	if (!session) throw error(401, 'Sign in required');
	return session;
}

export function requireRole(event: RequestEvent, roles: string[]) {
	const session = requireUser(event);
	if (!roles.includes(session.user.role))
		throw error(403, 'You do not have access to this resource');
	return session;
}

export function requireCsrf(event: RequestEvent, csrfToken: string | null | undefined): void {
	const session = requireUser(event);
	if (!csrfToken || csrfToken !== session.csrf_token) throw error(403, 'Invalid request token');
}

export function requireSameOrigin(request: Request): void {
	const origin = request.headers.get('origin');
	if (!origin) return;
	const requestUrl = new URL(request.url);
	if (new URL(origin).origin !== requestUrl.origin)
		throw error(403, 'Cross-origin request rejected');
}

export function noStoreJson(data: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	headers.set('cache-control', 'no-store');
	return json(data, { ...init, headers });
}
