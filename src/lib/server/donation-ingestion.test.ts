import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createUser,
	updateDistrict,
	createDonationAttribution,
	closeDatabase,
	deleteUser
} from './db';
import { ingestDonation } from './donation-ingestion';
import { getRegionAggregates } from './aggregates';
import type { DonationBridgeEvent } from './givebutter';
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
beforeEach(closeDatabase);
afterEach(closeDatabase);

describe('donation accounting and attribution', () => {
	it('retains old-region attribution after a move; deduplicates delivery; reconciles partial refunds', async () => {
		const user = await createUser('donor@example.test', 'StrongGeorgia123!');
		updateDistrict(user.id, 150, 'south-georgia');
		const token = createDonationAttribution(user.id, 'south-georgia', 150);
		updateDistrict(user.id, 142, 'middle-georgia');
		const paid: DonationBridgeEvent = {
			id: 'evt1',
			transactionId: 'txn1',
			event: 'transaction.succeeded',
			amountCents: 5000,
			currency: 'USD',
			attributionToken: token
		};
		expect(ingestDonation(paid).duplicate).toBe(false);
		expect(ingestDonation(paid).duplicate).toBe(true);
		const refund = { ...paid, id: 'evt2', event: 'refund.created' as const, amountCents: 1000 };
		ingestDonation(refund);
		expect(ingestDonation(refund).duplicate).toBe(true);
		const totals = getRegionAggregates().regions;
		expect(totals.find((r) => r.regionId === 'south-georgia')?.donationCents).toBe(4000);
		expect(totals.find((r) => r.regionId === 'middle-georgia')?.donationCents).toBe(0);
		expect(() => ingestDonation({ ...refund, id: 'evt3', amountCents: 5000 })).toThrow('exceeds');
		deleteUser(user.id);
		expect(
			getRegionAggregates().regions.find((r) => r.regionId === 'south-georgia')?.donationCents
		).toBe(4000);
	});
	it('does not credit unknown or failed transactions', () => {
		expect(() =>
			ingestDonation({
				id: 'fake',
				transactionId: 'txn',
				event: 'transaction.succeeded',
				amountCents: 100,
				currency: 'USD',
				attributionToken: 'unknown'
			})
		).toThrow();
		expect(getRegionAggregates().regions.every((region) => region.donationCents === 0)).toBe(true);
	});
});
