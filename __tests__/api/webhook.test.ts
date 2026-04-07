/**
 * Tests for POST /api/razorpay/webhook
 * Covers: signature verification, payment.captured handling, stock dedup,
 *         order-not-found case, other event types
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

// ─── Mock Firebase + Firestore ─────────────────────────────────────────────

const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDocs = jest.fn();
const mockDecrementStock = jest.fn().mockResolvedValue(true);
const mockSendEmail = jest.fn().mockResolvedValue({});

// Simulated order document
function makePendingOrderDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: 'firestoreDocId',
    ref: { id: 'firestoreDocId' },
    data: () => ({
      orderId: 'GRM-ABC123',
      status: 'pending',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      items: [{ productId: 'tshirt', size: '38 (M)', quantity: 1 }],
      total: 399,
      stockDeducted: false,
      ...overrides,
    }),
  };
}

jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));
jest.mock('@/lib/services', () => ({
  decrementStock: (...args: unknown[]) => mockDecrementStock(...args),
}));
jest.mock('@/lib/orderEmail', () => ({
  buildOrderEmailHtml: jest.fn(() => '<html>Order confirmed</html>'),
}));
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: (...args: unknown[]) => mockSendEmail(...args) },
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'wh_secret_test_abc';

function makeWebhookReq(body: unknown, secret = WEBHOOK_SECRET): NextRequest {
  const rawBody = JSON.stringify(body);
  const sig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return new NextRequest('http://localhost/api/razorpay/webhook', {
    method: 'POST',
    body: rawBody,
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': sig,
    },
  });
}

function makeCapturedEvent(orderId = 'order_rp_xyz', paymentId = 'pay_rp_abc') {
  return {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: { id: paymentId, order_id: orderId },
      },
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.RESEND_API_KEY = 'resend_test_key';
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/razorpay/webhook', () => {

  describe('webhook secret / config', () => {
    it('returns 500 when RAZORPAY_WEBHOOK_SECRET is not configured', async () => {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      const res = await POST(makeWebhookReq(makeCapturedEvent()));
      expect(res.status).toBe(500);
    });
  });

  describe('signature validation', () => {
    it('returns 400 for a tampered body (wrong signature)', async () => {
      process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
      const rawBody = JSON.stringify(makeCapturedEvent());
      const req = new NextRequest('http://localhost/api/razorpay/webhook', {
        method: 'POST',
        body: rawBody,
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'badfeed1234',
        },
      });
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when x-razorpay-signature header is absent', async () => {
      const rawBody = JSON.stringify(makeCapturedEvent());
      const req = new NextRequest('http://localhost/api/razorpay/webhook', {
        method: 'POST',
        body: rawBody,
        headers: { 'Content-Type': 'application/json' },
      });
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('event handling', () => {
    it('returns { status: ignored } for non-payment events', async () => {
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      const res = await POST(makeWebhookReq({ event: 'order.paid', payload: {} }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ignored');
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('returns { status: ignored } for payment.failed event', async () => {
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      const res = await POST(makeWebhookReq({ event: 'payment.failed', payload: {} }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ignored');
    });

    it('handles payment.captured with no payload gracefully', async () => {
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      const res = await POST(makeWebhookReq({ event: 'payment.captured', payload: {} }));
      expect(res.status).toBe(200);
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('payment.captured — successful path', () => {
    beforeEach(() => {
      // Return a pending order
      mockGetDocs.mockResolvedValue({ empty: false, docs: [makePendingOrderDoc()] });
    });

    it('updates order status to verified with payment details', async () => {
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      await POST(makeWebhookReq(makeCapturedEvent('order_rp_xyz', 'pay_rp_abc')));

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'verified',
          razorpayPaymentId: 'pay_rp_abc',
          verifiedBy: 'webhook',
          stockDeducted: true,
        })
      );
    });

    it('sets verifiedAt timestamp on update', async () => {
      const before = Date.now();
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      await POST(makeWebhookReq(makeCapturedEvent()));

      const call = mockUpdateDoc.mock.calls[0][1];
      expect(new Date(call.verifiedAt).getTime()).toBeGreaterThanOrEqual(before);
    });

    it('calls decrementStock when stockDeducted is false', async () => {
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      await POST(makeWebhookReq(makeCapturedEvent()));
      expect(mockDecrementStock).toHaveBeenCalledWith([
        { productId: 'tshirt', size: '38 (M)', quantity: 1 },
      ]);
    });

    it('skips decrementStock when stockDeducted is already true (client already did it)', async () => {
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [makePendingOrderDoc({ stockDeducted: true })],
      });
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      await POST(makeWebhookReq(makeCapturedEvent()));
      expect(mockDecrementStock).not.toHaveBeenCalled();
    });

    it('sends confirmation email to customer', async () => {
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      await POST(makeWebhookReq(makeCapturedEvent()));
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Order Confirmed'),
        })
      );
    });

    it('still returns ok if email send fails (fire-and-forget)', async () => {
      mockSendEmail.mockRejectedValueOnce(new Error('SMTP error'));
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      const res = await POST(makeWebhookReq(makeCapturedEvent()));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
    });

    it('returns ok even if stock decrement fails (non-blocking)', async () => {
      mockDecrementStock.mockRejectedValueOnce(new Error('Firestore tx failed'));
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      const res = await POST(makeWebhookReq(makeCapturedEvent()));
      expect(res.status).toBe(200);
    });
  });

  describe('payment.captured — order already verified', () => {
    it('does not update or decrement stock when no pending order found', async () => {
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      const res = await POST(makeWebhookReq(makeCapturedEvent()));
      expect(res.status).toBe(200);
      expect(mockUpdateDoc).not.toHaveBeenCalled();
      expect(mockDecrementStock).not.toHaveBeenCalled();
    });
  });

  describe('slingbag (no-size product) stock decrement via webhook', () => {
    it('passes size=undefined for N/A size items', async () => {
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [makePendingOrderDoc({
          items: [{ productId: 'slingbag', size: 'N/A', quantity: 2 }],
          stockDeducted: false,
        })],
      });
      const { POST } = await import('@/app/api/razorpay/webhook/route');
      await POST(makeWebhookReq(makeCapturedEvent()));
      expect(mockDecrementStock).toHaveBeenCalledWith([
        { productId: 'slingbag', size: undefined, quantity: 2 },
      ]);
    });
  });
});
