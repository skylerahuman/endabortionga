import { audit, getDatabase, recordDonation, resolveDonationAttribution } from './db';
import type { DonationBridgeEvent } from './givebutter';

/** Atomic, idempotent ingestion. Attribution is frozen at checkout creation, not lookup time. */
export function ingestDonation(event: DonationBridgeEvent): { duplicate: boolean } {
	const db = getDatabase();
	return db.transaction(() => {
		const duplicate = db.prepare('SELECT id FROM donation_receipts WHERE id = ?').get(event.id);
		if (duplicate) return { duplicate: true };
		const attribution = resolveDonationAttribution(event.attributionToken);
		if (event.event === 'transaction.succeeded') {
			if (!attribution) throw new Error('Unknown attribution');
			recordDonation({
				provider: 'givebutter',
				providerEventId: event.transactionId,
				userId: attribution.user_id,
				regionId: attribution.region_id,
				districtId: attribution.district_id,
				amountCents: event.amountCents
			});
		} else {
			const original = db
				.prepare('SELECT * FROM donations WHERE provider = ? AND provider_event_id = ?')
				.get('givebutter', event.transactionId) as
				| {
						id: string;
						user_id: string | null;
						amount_cents: number;
						region_id: string;
						district_id: number;
				  }
				| undefined;
			// A verified bridge refund is reconciled by provider transaction ID. It must still
			// work after account deletion removes the personal attribution token.
			if (!original || (attribution && original.user_id && original.user_id !== attribution.user_id))
				throw new Error('Unknown transaction');
			const refunded = db
				.prepare(
					"SELECT COALESCE(SUM(amount_cents), 0) AS total FROM donation_receipts WHERE transaction_id = ? AND event = 'refund.created'"
				)
				.get(event.transactionId) as { total: number };
			if (refunded.total + event.amountCents > original.amount_cents)
				throw new Error('Refund exceeds transaction');
			// Refunds subtract from the ORIGINAL transaction's district, even if the donor moved.
			recordDonation({
				provider: 'givebutter-refund',
				providerEventId: event.id,
				userId: original.user_id,
				regionId: original.region_id,
				districtId: original.district_id,
				amountCents: -event.amountCents,
				status: 'paid'
			});
		}
		db.prepare(
			'INSERT INTO donation_receipts (id, transaction_id, event, amount_cents) VALUES (?, ?, ?, ?)'
		).run(event.id, event.transactionId, event.event, event.amountCents);
		audit({
			action: event.event,
			entityType: 'donation',
			entityId: event.transactionId,
			details: { eventId: event.id, amountCents: event.amountCents }
		});
		return { duplicate: false };
	})();
}
