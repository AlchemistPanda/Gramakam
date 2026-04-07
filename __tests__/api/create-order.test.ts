/**
 * Tests for POST /api/razorpay/create-order
 * Covers: input validation, stock checks, Razorpay integration, loopholes
 */

import { NextRequest } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRazorpayOrderCreate = jest.fn();
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: { create: mockRazorpayOrderCreate },
  }));
});

// Mock Firebase (stock check path)
let mockStockData: Record<string, { count: number; sizes?: Record<string, number>; resumedFromOutOfStock?: string }> = {};
jest.mock('@/lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db, _col, id) => ({ id })),
  getDoc: jest.fn(async (ref) => {
    const data = mockStockData[ref.id];
    return {
      exists: () => !!data,
      data: () => data,
    };
  }),
}));
jest.mock('@/lib/services', () => ({
  getEffectiveSizeStock: jest.fn((stockDoc, size) => {
    if (stockDoc.sizes?.[size] !== undefined) return stockDoc.sizes[size];
    return stockDoc.count ?? -1;
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const validCustomer = {
  customerName: 'Test User',
  customerEmail: 'test@example.com',
  customerMobile: '9876543210',
};

const validItems = [{ productId: 'tshirt', size: '38 (M)', quantity: 1 }];

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetModules();
  mockStockData = {};
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_key';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';
  mockRazorpayOrderCreate.mockResolvedValue({
    id: 'order_mock123',
    amount: 100,
    currency: 'INR',
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/razorpay/create-order', () => {

  describe('customer field validation', () => {
    it('returns 400 when customerName is missing', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ customerEmail: 'a@b.com', customerMobile: '1234567890', items: validItems }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/missing required fields/i);
    });

    it('returns 400 when customerEmail is missing', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ customerName: 'A', customerMobile: '1234567890', items: validItems }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when customerMobile is missing', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ customerName: 'A', customerEmail: 'a@b.com', items: validItems }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when all customer fields are absent', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ items: validItems }));
      expect(res.status).toBe(400);
    });
  });

  describe('cart validation', () => {
    it('returns 400 when items array is empty', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [] }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/cart is empty/i);
    });

    it('returns 400 when items is not an array', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: 'tshirt' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for unknown productId', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [{ productId: 'hoodie', size: 'M', quantity: 1 }] }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/unknown product/i);
    });

    it('returns 400 for invalid size on sized product (tshirt)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [{ productId: 'tshirt', size: 'XXXL', quantity: 1 }] }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/invalid size/i);
    });

    it('accepts slingbag with any size (no sizes defined)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      // slingbag has no sizes array, so any size or undefined should pass
      const res = await POST(makeReq({ ...validCustomer, items: [{ productId: 'slingbag', size: 'N/A', quantity: 1 }] }));
      // Should NOT 400 on size check — may pass or fail on Razorpay mock
      expect(res.status).not.toBe(400);
    });
  });

  describe('quantity validation', () => {
    const mkItem = (quantity: number) => ({ productId: 'tshirt', size: '38 (M)', quantity });

    it('returns 400 for quantity = 0', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [mkItem(0)] }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/invalid quantity/i);
    });

    it('returns 400 for quantity = 11 (exceeds max)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [mkItem(11)] }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for negative quantity', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [mkItem(-1)] }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for fractional quantity (1.5)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [mkItem(1.5)] }));
      expect(res.status).toBe(400);
    });

    it('accepts quantity = 1 (minimum)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [mkItem(1)] }));
      expect(res.status).not.toBe(400);
    });

    it('accepts quantity = 10 (maximum)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [mkItem(10)] }));
      expect(res.status).not.toBe(400);
    });
  });

  describe('stock checks', () => {
    it('returns 400 when stock is insufficient for requested quantity', async () => {
      mockStockData['tshirt'] = { count: 1, sizes: { '38 (M)': 0 } };
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [{ productId: 'tshirt', size: '38 (M)', quantity: 2 }] }));
      // Stock 0 < qty 2 → should be blocked
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/out of stock/i);
    });

    it('allows order when stock exactly matches quantity', async () => {
      mockStockData['tshirt'] = { count: 5, sizes: { '38 (M)': 2 } };
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [{ productId: 'tshirt', size: '38 (M)', quantity: 2 }] }));
      expect(res.status).not.toBe(400);
    });

    it('allows order when stock is -1 (unlimited)', async () => {
      mockStockData['tshirt'] = { count: -1 };
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: [{ productId: 'tshirt', size: '38 (M)', quantity: 10 }] }));
      expect(res.status).not.toBe(400);
    });

    it('proceeds when stock check throws (fire-and-forget)', async () => {
      // Simulate Firebase failure — stock check is wrapped in try/catch and non-blocking
      const { getDoc } = await import('firebase/firestore');
      (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore down'));
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: validItems }));
      // Should still succeed (stock failure is non-blocking)
      expect(res.status).toBe(200);
    });

    it('flags stockWarning when item was recently resumed from out-of-stock', async () => {
      // Set resumedFromOutOfStock to 3 days ago
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      mockStockData['tshirt'] = { count: -1, resumedFromOutOfStock: threeDaysAgo };
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: validItems }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stockWarning).toBe(true);
      expect(body.stockWarningItems).toContainEqual(expect.stringContaining('T-Shirt'));
    });

    it('does NOT flag stockWarning for resumedFromOutOfStock older than 7 days', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      mockStockData['tshirt'] = { count: -1, resumedFromOutOfStock: eightDaysAgo };
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: validItems }));
      const body = await res.json();
      expect(body.stockWarning).toBeFalsy();
    });
  });

  describe('successful order creation', () => {
    it('returns orderId in GRM-XXXXXX format', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: validItems }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.orderId).toMatch(/^GRM-[A-Z0-9]{6}$/);
    });

    it('returns Razorpay order id, amount, currency', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: validItems }));
      const body = await res.json();
      expect(body.id).toBe('order_mock123');
      expect(body.currency).toBe('INR');
      expect(body.amount).toBeGreaterThan(0);
    });

    it('returns serverTotal calculated from server-side prices (not client-sent price)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 3, price: 999999 }], // injected price ignored
      }));
      const body = await res.json();
      const { PRODUCT_MAP } = await import('@/lib/products');
      const expectedTotal = PRODUCT_MAP.get('tshirt')!.price * 3;
      expect(body.serverTotal).toBe(expectedTotal);
    });

    it('rejects duplicate productId entries whose combined qty exceeds 10 (fixed loophole)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [
          { productId: 'tshirt', size: '38 (M)', quantity: 10 },
          { productId: 'tshirt', size: '40 (L)', quantity: 1 },  // combined = 11 → rejected
        ],
      }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/maximum 10 units/i);
    });

    it('allows different products each at qty=10 (different productIds are independent)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [
          { productId: 'tshirt', size: '38 (M)', quantity: 10 },
          { productId: 'slingbag', size: 'N/A', quantity: 10 },
        ],
      }));
      expect(res.status).toBe(200);
    });

    it('calls Razorpay with amount in paise', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      await POST(makeReq({ ...validCustomer, items: [{ productId: 'tshirt', size: '38 (M)', quantity: 1 }] }));
      const { PRODUCT_MAP } = await import('@/lib/products');
      const price = PRODUCT_MAP.get('tshirt')!.price;
      expect(mockRazorpayOrderCreate).toHaveBeenCalledWith(
        expect.objectContaining({ amount: Math.round(price * 100), currency: 'INR' })
      );
    });
  });

  describe('environment / config errors', () => {
    it('returns 500 when Razorpay keys are missing', async () => {
      delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({ ...validCustomer, items: validItems }));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toMatch(/not configured/i);
    });
  });
});
