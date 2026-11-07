import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

/**
 * Explicit integration boundary: signed-bridge-v1 is OUR normalized ingestion protocol,
 * not an assertion about Givebutter's native signature scheme. A trusted integration must
 * authenticate/retrieve transactions at Givebutter and normalize them before signing.
 * Live checkout stays disabled until that integration has been verified end-to-end.
 */
export interface DonationBridgeEvent {
	id: string;
	transactionId: string;
	event: 'transaction.succeeded' | 'refund.created';
	amountCents: number;
	currency: 'USD';
	attributionToken: string;
}

export function givebutterConfigured(): boolean {
	return Boolean(
		env.GIVEBUTTER_CAMPAIGN_CODE &&
		/^[a-zA-Z0-9_-]+$/.test(env.GIVEBUTTER_CAMPAIGN_CODE) &&
		env.DONATION_INGESTION_MODE === 'signed-bridge-v1' &&
		env.DONATION_BRIDGE_SECRET &&
		env.GIVEBUTTER_ATTRIBUTION_VERIFIED === 'true'
	);
}

export function givebutterCampaignCode(): string | null {
	return givebutterConfigured() ? (env.GIVEBUTTER_CAMPAIGN_CODE ?? null) : null;
}

export function givebutterAccountId(): string | null {
	return env.GIVEBUTTER_ACCOUNT_ID ?? null;
}

export function verifyBridgeSignature(
	body: string,
	signature: string | null,
	timestamp: string | null,
	secret: string | undefined = env.DONATION_BRIDGE_SECRET,
	now = Date.now()
): boolean {
	if (!secret || !signature || !timestamp || !/^\d{10}$/.test(timestamp)) return false;
	if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
	if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
	const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest();
	return timingSafeEqual(Buffer.from(signature, 'hex'), expected);
}

export function parseBridgeEvent(body: string): DonationBridgeEvent {
	const input: unknown = JSON.parse(body);
	if (!input || typeof input !== 'object') throw new Error('Invalid event');
	const data = input as Record<string, unknown>;
	if (
		!['transaction.succeeded', 'refund.created'].includes(String(data.event)) ||
		typeof data.id !== 'string' ||
		!/^[a-zA-Z0-9_:-]{1,150}$/.test(data.id) ||
		typeof data.transactionId !== 'string' ||
		!/^[a-zA-Z0-9_:-]{1,150}$/.test(data.transactionId) ||
		!Number.isSafeInteger(data.amountCents) ||
		Number(data.amountCents) <= 0 ||
		Number(data.amountCents) > 100_000_000 ||
		data.currency !== 'USD' ||
		typeof data.attributionToken !== 'string' ||
		data.attributionToken.length > 150
	)
		throw new Error('Invalid event fields');
	return data as unknown as DonationBridgeEvent;
}
