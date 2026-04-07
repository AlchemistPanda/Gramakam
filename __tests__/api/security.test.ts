/**
 * Security Tests for Merchandise Checkout
 * Covers: Price tampering, quantity manipulation, stock bypass, discount abuse
 */

import { NextRequest } from 'next/server';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRazorpayOrderCreate = jest.fn();
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: { create: mockRazorpayOrderCreate },
  }));
});

let mockStockData: Record<string, { count: number; sizes?: Record<string, number> }> = {};
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
  decrementStock: jest.fn().mockResolvedValue(true),
  restoreStock: jest.fn().mockResolvedValue(undefined),
  createMerchOrder: jest.fn().mockResolvedValue('mock-doc-id'),
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
  deliveryAddress: {
    line1: '12 Test St',
    city: 'Thrissur',
    state: 'Kerala',
    pincode: '680001',
  },
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetModules();
  mockStockData = {};
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_key';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';
  mockRazorpayOrderCreate.mockResolvedValue({
    id: 'order_mock123',
    amount: 0, // Will be set by test
    currency: 'INR',
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Security Tests: Price Tampering & Checkout', () => {

  describe('price validation', () => {
    it('rejects client-sent price and uses server-calculated price', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 1, price: 1 }], // Fraudulent price
      }));
      expect(res.status).toBe(200);
      const body = await res.json();
      const { PRODUCT_MAP } = await import('@/lib/products');
      const expectedPrice = PRODUCT_MAP.get('tshirt')!.price;
      expect(body.serverTotal).toBe(expectedPrice);
      expect(body.serverTotal).not.toBe(1);
    });

    it('rejects multiple price values for same product (uses server price consistently)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [
          { productId: 'tshirt', size: '38 (M)', quantity: 2, price: 100 },
          { productId: 'tshirt', size: '40 (L)', quantity: 1, price: 50 },
        ],
      }));
      expect(res.status).toBe(200);
      const body = await res.json();
      const { computeCartTotal } = await import('@/lib/products');
      const expectedTotal = computeCartTotal([
        { productId: 'tshirt', size: '38 (M)', quantity: 2, name: 'Gramakam T-Shirt', price: 300 },
        { productId: 'tshirt', size: '40 (L)', quantity: 1, name: 'Gramakam T-Shirt', price: 300 },
      ]);
      expect(body.serverTotal).toBe(expectedTotal);
    });

    it('recalculates total even with spoofed clientTotal in payload', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 2 }],
        clientTotal: 1, // Fraudulent
      }));
      expect(res.status).toBe(200);
      const body = await res.json();
      const { computeCartTotal } = await import('@/lib/products');
      const expectedTotal = computeCartTotal([
        { productId: 'tshirt', size: '38 (M)', quantity: 2, name: 'Gramakam T-Shirt', price: 300 },
      ]);
      expect(body.serverTotal).toBe(expectedTotal);
      expect(body.serverTotal).not.toBe(1);
    });

    it('validates Razorpay amount is in correct currency (paise)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 1 }],
      }));
      const { PRODUCT_MAP } = await import('@/lib/products');
      const price = PRODUCT_MAP.get('tshirt')!.price;
      expect(mockRazorpayOrderCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: Math.round(price * 100), // In paise
          currency: 'INR',
        })
      );
    });
  });

  describe('quantity bypass attempts', () => {
    it('blocks negative quantity values', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: -5 }],
      }));
      expect(res.status).toBe(400);
    });

    it('blocks zero quantity', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 0 }],
      }));
      expect(res.status).toBe(400);
    });

    it('blocks fractional quantity (1.5)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 1.5 }],
      }));
      expect(res.status).toBe(400);
    });

    it('blocks extremely large quantity (999)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 999 }],
      }));
      expect(res.status).toBe(400);
    });

    it('blocks null quantity', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: null }],
      }));
      expect(res.status).toBe(400);
    });

    it('blocks string quantity ("5")', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: '5' }],
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('duplicate product + quantity aggregation', () => {
    it('enforces 10 unit max per product across all sizes', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [
          { productId: 'tshirt', size: '38 (M)', quantity: 8 },
          { productId: 'tshirt', size: '40 (L)', quantity: 3 }, // 8 + 3 = 11 → exceed
        ],
      }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/maximum 10 units|exceed/i);
    });

    it('allows exactly 10 units split across sizes', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [
          { productId: 'tshirt', size: '38 (M)', quantity: 5 },
          { productId: 'tshirt', size: '40 (L)', quantity: 5 },
        ],
      }));
      expect(res.status).toBe(200);
    });

    it('allows multiple products each with 10 units (independent limits)', async () => {
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

    it('rejects 3+ duplicate entries that sum to >10', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [
          { productId: 'tshirt', size: '38 (M)', quantity: 4 },
          { productId: 'tshirt', size: '40 (L)', quantity: 4 },
          { productId: 'tshirt', size: '42 (XL)', quantity: 3 }, // 4 + 4 + 3 = 11
        ],
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('product ID validation', () => {
    it('rejects unknown productId', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'fake_product', size: 'M', quantity: 1 }],
      }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/unknown product/i);
    });

    it('rejects null productId', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: null, size: 'M', quantity: 1 }],
      }));
      expect(res.status).toBe(400);
    });

    it('rejects empty string productId', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: '', size: 'M', quantity: 1 }],
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('size validation for sized products', () => {
    it('rejects invalid size for tshirt', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: 'INVALID', quantity: 1 }],
      }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/invalid size/i);
    });

    it('accepts valid size for tshirt', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 1 }],
      }));
      expect(res.status).not.toBe(400);
    });

    it('allows any size for non-sized products', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'slingbag', size: 'random_size', quantity: 1 }],
      }));
      expect(res.status).not.toBe(400);
    });
  });

  describe('stock manipulation attempts', () => {
    it('blocks order when size stock is 0', async () => {
      mockStockData['tshirt'] = { count: 10, sizes: { '38 (M)': 0, '40 (L)': 10 } };
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 1 }],
      }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/out of stock/i);
    });

    it('allows order when size stock = quantity', async () => {
      mockStockData['tshirt'] = { count: 10, sizes: { '38 (M)': 5 } };
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 5 }],
      }));
      expect(res.status).not.toBe(400);
    });

    it('blocks when size stock < quantity', async () => {
      mockStockData['tshirt'] = { count: 10, sizes: { '38 (M)': 3 } };
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 5 }],
      }));
      expect(res.status).toBe(400);
    });

    it('allows unlimited quantity when stock = -1', async () => {
      mockStockData['tshirt'] = { count: -1 };
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 10 }],
      }));
      expect(res.status).not.toBe(400);
    });
  });

  describe('injection & payload attacks', () => {
    it('rejects oversized payload (items > 100 entries)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const items = Array.from({ length: 150 }, (_, i) => ({
        productId: `product_${i % 3}`,
        size: 'M',
        quantity: 1,
      }));
      const res = await POST(makeReq({ ...validCustomer, items }));
      // Should reject either for size or quantity violation
      expect([400, 413]).toContain(res.status);
    });

    it('rejects items array with non-objects', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: ['tshirt', 'slingbag'],
      }));
      expect(res.status).toBe(400);
    });

    it('rejects null items array', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: null,
      }));
      expect(res.status).toBe(400);
    });

    it('rejects missing deliveryAddress (required field)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const { deliveryAddress, ...customerNoAddr } = validCustomer;
      const res = await POST(makeReq({
        ...customerNoAddr,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 1 }],
      }));
      // deliveryAddress is required
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/delivery address/i);
    });
  });

  describe('edge case combinations', () => {
    it('handles order with 1 unit max qty', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 1 }],
      }));
      expect(res.status).toBe(200);
    });

    it('handles order with 10 units max qty', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [{ productId: 'tshirt', size: '38 (M)', quantity: 10 }],
      }));
      expect(res.status).toBe(200);
    });

    it('handles mixed valid + invalid items in batch (fails entire order)', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [
          { productId: 'tshirt', size: '38 (M)', quantity: 1 }, // valid
          { productId: 'invalid_product', size: 'M', quantity: 1 }, // invalid
        ],
      }));
      expect(res.status).toBe(400);
    });

    it('rejects empty items array', async () => {
      const { POST } = await import('@/app/api/razorpay/create-order/route');
      const res = await POST(makeReq({
        ...validCustomer,
        items: [],
      }));
      expect(res.status).toBe(400);
    });
  });

});
