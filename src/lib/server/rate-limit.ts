import type { RequestEvent } from '@sveltejs/kit';

interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

export function rateLimit(
	key: string,
	limit: number,
	windowMs = WINDOW_MS
): { allowed: boolean; retryAfter: number } {
	const now = Date.now();
	if (buckets.size > 1000) {
		for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
		if (buckets.size > 10_000 && !buckets.has(key)) return { allowed: false, retryAfter: 60 };
	}
	const existing = buckets.get(key);
	if (!existing || existing.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, retryAfter: 0 };
	}
	existing.count += 1;
	if (existing.count > limit) {
		return {
			allowed: false,
			retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
		};
	}
	return { allowed: true, retryAfter: 0 };
}

export function requestAddress(event: Pick<RequestEvent, 'getClientAddress'>): string {
	// Adapter-controlled address only. Never trust a client-supplied forwarding header here.
	return event.getClientAddress();
}
