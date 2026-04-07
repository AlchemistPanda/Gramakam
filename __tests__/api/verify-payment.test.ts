/**
 * Tests for POST /api/razorpay/verify-payment
 * Covers: HMAC signature validation, missing fields, config errors
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/razorpay/verify-payment', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const TEST_SECRET = 'test_webhook_secret_12345';

function makeValidSignature(orderId: string, paymentId: string, secret = TEST_SECRET): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

beforeEach(() => {
  process.env.RAZORPAY_KEY_SECRET = TEST_SECRET;
});

describe('POST /api/razorpay/verify-payment', () => {

  describe('missing field validation', () => {
    it('returns 400 when razorpay_order_id is missing', async () => {
      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_payment_id: 'pay_abc',
        razorpay_signature: 'sig',
      }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/missing payment details/i);
    });

    it('returns 400 when razorpay_payment_id is missing', async () => {
      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_order_id: 'order_abc',
        razorpay_signature: 'sig',
      }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when razorpay_signature is missing', async () => {
      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_order_id: 'order_abc',
        razorpay_payment_id: 'pay_abc',
      }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when body is empty', async () => {
      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({}));
      expect(res.status).toBe(400);
    });
  });

  describe('signature validation', () => {
    it('returns { verified: true } for a correct signature', async () => {
      const orderId = 'order_test123';
      const paymentId = 'pay_test456';
      const sig = makeValidSignature(orderId, paymentId);

      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: sig,
      }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.verified).toBe(true);
      expect(body.razorpay_order_id).toBe(orderId);
      expect(body.razorpay_payment_id).toBe(paymentId);
    });

    it('returns 400 { verified: false } for a tampered signature', async () => {
      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_order_id: 'order_abc',
        razorpay_payment_id: 'pay_abc',
        razorpay_signature: 'deadbeefcafe',
      }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.verified).toBe(false);
    });

    it('returns 400 when payment_id is swapped with another (HMAC mismatch)', async () => {
      const orderId = 'order_real';
      const realPayId = 'pay_real';
      const fakePayId = 'pay_attacker';
      const sig = makeValidSignature(orderId, realPayId); // sig for real payment

      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_order_id: orderId,
        razorpay_payment_id: fakePayId, // attacker substitutes different payment
        razorpay_signature: sig,
      }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.verified).toBe(false);
    });

    it('returns 400 when order_id is swapped', async () => {
      const orderId = 'order_real';
      const payId = 'pay_real';
      const sig = makeValidSignature(orderId, payId);

      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_order_id: 'order_fake',
        razorpay_payment_id: payId,
        razorpay_signature: sig,
      }));
      expect(res.status).toBe(400);
    });

    it('signature is case-sensitive (uppercase hex does not match)', async () => {
      const orderId = 'order_abc';
      const payId = 'pay_abc';
      const sig = makeValidSignature(orderId, payId).toUpperCase();

      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_order_id: orderId,
        razorpay_payment_id: payId,
        razorpay_signature: sig,
      }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for empty string signature', async () => {
      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_order_id: 'order_abc',
        razorpay_payment_id: 'pay_abc',
        razorpay_signature: '',
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('environment config', () => {
    it('returns 500 when RAZORPAY_KEY_SECRET is not set', async () => {
      delete process.env.RAZORPAY_KEY_SECRET;
      const { POST } = await import('@/app/api/razorpay/verify-payment/route');
      const res = await POST(makeReq({
        razorpay_order_id: 'order_abc',
        razorpay_payment_id: 'pay_abc',
        razorpay_signature: 'anysig',
      }));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.verified).toBe(false);
    });
  });
});
