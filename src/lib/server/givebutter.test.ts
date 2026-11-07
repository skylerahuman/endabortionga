import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { parseBridgeEvent, verifyBridgeSignature } from './givebutter';

describe('explicit signed donation bridge protocol', () => {
	it('authenticates exact body and timestamp; rejects stale requests', () => {
		const timestamp = String(Math.floor(Date.now() / 1000));
		const body = '{"id":"evt_1"}';
		const signature = createHmac('sha256', 'test-secret')
			.update(`${timestamp}.${body}`)
			.digest('hex');
		expect(verifyBridgeSignature(body, signature, timestamp, 'test-secret')).toBe(true);
		expect(verifyBridgeSignature(`${body} `, signature, timestamp, 'test-secret')).toBe(false);
		expect(
			verifyBridgeSignature(body, signature, timestamp, 'test-secret', Date.now() + 301_000)
		).toBe(false);
		expect(verifyBridgeSignature(body, null, timestamp, 'test-secret')).toBe(false);
	});
	it('accepts only known events and integer USD cents', () => {
		const event = {
			id: 'evt_1',
			transactionId: 'txn_1',
			event: 'transaction.succeeded',
			amountCents: 2500,
			currency: 'USD',
			attributionToken: 'opaque-token'
		};
		expect(parseBridgeEvent(JSON.stringify(event))).toEqual(event);
		for (const change of [
			{ amountCents: 2.5 },
			{ currency: 'EUR' },
			{ event: 'transaction.failed' }
		]) {
			expect(() => parseBridgeEvent(JSON.stringify({ ...event, ...change }))).toThrow();
		}
	});
});
