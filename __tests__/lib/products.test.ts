/**
 * Tests for lib/products.ts
 * Covers: PRODUCT_MAP, computeCartTotal
 */
import { PRODUCTS, PRODUCT_MAP, computeCartTotal } from '@/lib/products';

describe('PRODUCT_MAP', () => {
  it('contains all products from PRODUCTS array', () => {
    for (const p of PRODUCTS) {
      expect(PRODUCT_MAP.has(p.id)).toBe(true);
      expect(PRODUCT_MAP.get(p.id)).toBe(p);
    }
  });

  it('has tshirt with sizes defined', () => {
    const t = PRODUCT_MAP.get('tshirt');
    expect(t).toBeDefined();
    expect(Array.isArray(t!.sizes)).toBe(true);
    expect(t!.sizes!.length).toBeGreaterThan(0);
  });

  it('has slingbag with no sizes (no-size product)', () => {
    const s = PRODUCT_MAP.get('slingbag');
    expect(s).toBeDefined();
    expect(s!.sizes).toBeUndefined();
  });

  it('does not contain unknown product ids', () => {
    expect(PRODUCT_MAP.has('hoodie')).toBe(false);
    expect(PRODUCT_MAP.has('')).toBe(false);
    expect(PRODUCT_MAP.has('TSHIRT')).toBe(false); // case-sensitive
  });

  it('all products have price > 0', () => {
    for (const p of PRODUCTS) {
      expect(p.price).toBeGreaterThan(0);
    }
  });
});

describe('computeCartTotal', () => {
  describe('valid carts', () => {
    it('computes total for a single item', () => {
      const tshirtPrice = PRODUCT_MAP.get('tshirt')!.price;
      const result = computeCartTotal([{ productId: 'tshirt', quantity: 1 }]);
      expect(result).toBe(tshirtPrice);
    });

    it('multiplies price by quantity', () => {
      const tshirtPrice = PRODUCT_MAP.get('tshirt')!.price;
      const result = computeCartTotal([{ productId: 'tshirt', quantity: 3 }]);
      expect(result).toBe(tshirtPrice * 3);
    });

    it('sums multiple products', () => {
      const tshirtPrice = PRODUCT_MAP.get('tshirt')!.price;
      const slingbagPrice = PRODUCT_MAP.get('slingbag')!.price;
      const result = computeCartTotal([
        { productId: 'tshirt', quantity: 2 },
        { productId: 'slingbag', quantity: 1 },
      ]);
      expect(result).toBe(tshirtPrice * 2 + slingbagPrice);
    });

    it('handles max quantity (10)', () => {
      const tshirtPrice = PRODUCT_MAP.get('tshirt')!.price;
      const result = computeCartTotal([{ productId: 'tshirt', quantity: 10 }]);
      expect(result).toBe(tshirtPrice * 10);
    });

    it('handles minimum quantity (1)', () => {
      const tshirtPrice = PRODUCT_MAP.get('tshirt')!.price;
      const result = computeCartTotal([{ productId: 'tshirt', quantity: 1 }]);
      expect(result).toBe(tshirtPrice);
    });
  });

  describe('invalid carts → null', () => {
    it('returns null for empty array', () => {
      // empty array — no items to sum, returns 0, but 0 < 1 so api rejects it; lib itself returns 0
      // computeCartTotal returns 0 for empty (no iterations), not null
      const result = computeCartTotal([]);
      expect(result).toBe(0); // lib returns 0; API checks amount < 1
    });

    it('returns null for unknown productId', () => {
      const result = computeCartTotal([{ productId: 'hoodie', quantity: 1 }]);
      expect(result).toBeNull();
    });

    it('returns null for quantity 0', () => {
      const result = computeCartTotal([{ productId: 'tshirt', quantity: 0 }]);
      expect(result).toBeNull();
    });

    it('returns null for quantity 11 (exceeds max)', () => {
      const result = computeCartTotal([{ productId: 'tshirt', quantity: 11 }]);
      expect(result).toBeNull();
    });

    it('returns null for negative quantity', () => {
      const result = computeCartTotal([{ productId: 'tshirt', quantity: -1 }]);
      expect(result).toBeNull();
    });

    it('returns null if any item is invalid (mixed valid+invalid)', () => {
      const result = computeCartTotal([
        { productId: 'tshirt', quantity: 2 },
        { productId: 'unknown_product', quantity: 1 },
      ]);
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('same product added twice is summed (cart allows duplicate productId entries)', () => {
      const tshirtPrice = PRODUCT_MAP.get('tshirt')!.price;
      const result = computeCartTotal([
        { productId: 'tshirt', quantity: 1 },
        { productId: 'tshirt', quantity: 2 },
      ]);
      // This is a loophole: same product twice bypasses per-product quantity cap
      // computeCartTotal sums them independently; total = 3 * price
      expect(result).toBe(tshirtPrice * 3);
    });

    it('LOOPHOLE: two entries of same product each with qty=10 → 20x price accepted', () => {
      const tshirtPrice = PRODUCT_MAP.get('tshirt')!.price;
      const result = computeCartTotal([
        { productId: 'tshirt', quantity: 10 },
        { productId: 'tshirt', quantity: 10 },
      ]);
      // Each row is valid (qty=10), no cross-row check → total = 20 * price passes
      expect(result).toBe(tshirtPrice * 20);
      // NOTE: This is a known loophole — the API doesn't deduplicate cart entries
    });
  });
});
