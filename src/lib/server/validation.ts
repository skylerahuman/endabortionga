export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export function normalizeEmail(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const email = value.trim().toLowerCase();
	if (email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
		return undefined;
	return email;
}

export function validatePassword(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	if (value.length < MIN_PASSWORD_LENGTH || value.length > MAX_PASSWORD_LENGTH) return undefined;
	if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) return undefined;
	return value;
}

export function parseBoolean(value: unknown): boolean {
	return value === true || value === 'true' || value === 1 || value === '1';
}

export function isDistrictId(value: unknown): value is number {
	return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 180;
}

export function safeText(value: unknown, maxLength = 200): string {
	if (typeof value !== 'string') return '';
	return value.trim().slice(0, maxLength);
}
