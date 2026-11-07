import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseBridgeEvent, verifyBridgeSignature } from '$lib/server/givebutter';
import { ingestDonation } from '$lib/server/donation-ingestion';

/** Trusted signed bridge endpoint. Native Givebutter callbacks must NOT be sent here directly. */
export const POST: RequestHandler = async ({ request }) => {
	if (env.DONATION_INGESTION_MODE !== 'signed-bridge-v1' || !env.DONATION_BRIDGE_SECRET) {
		throw error(503, 'Donation ingestion is not configured.');
	}
	const raw = await request.text();
	if (Buffer.byteLength(raw) > 16_384) throw error(413, 'Event too large');
	if (
		!verifyBridgeSignature(
			raw,
			request.headers.get('x-movement-signature'),
			request.headers.get('x-movement-timestamp')
		)
	) {
		throw error(401, 'Invalid event signature or timestamp');
	}
	let parsed;
	try {
		parsed = parseBridgeEvent(raw);
	} catch {
		throw error(400, 'Invalid event');
	}
	try {
		return json({ received: true, ...ingestDonation(parsed) });
	} catch {
		// Do not log payloads, opaque tokens, donor information, or database internals.
		throw error(409, 'Event could not be reconciled');
	}
};
