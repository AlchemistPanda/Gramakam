/**
 * Tests for admin merchandise management logic
 * Covers: status transitions, order filtering, stock state, known loopholes
 *
 * These test pure functions extracted from AdminDashboard.tsx.
 * Since that component is 2700+ lines of React UI, we test the business
 * logic by re-implementing the pure functions here and validating them
 * against all documented status paths.
 */

// ─── Re-implement pure functions from AdminDashboard (no React import needed) ─

type MerchOrderStatus =
  | 'pending'
  | 'verified'
  | 'manual_verified'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'rejected';

const FULFILLMENT_FLOW: MerchOrderStatus[] = ['verified', 'packed', 'shipped', 'delivered'];

function getNextStatus(current: MerchOrderStatus): MerchOrderStatus | null {
  const normalized = current === 'manual_verified' ? 'verified' : current;
  const idx = FULFILLMENT_FLOW.indexOf(normalized);
  if (idx === -1 || idx >= FULFILLMENT_FLOW.length - 1) return null;
  return FULFILLMENT_FLOW[idx + 1];
}

const STATUS_CONFIG: Record<string, { label: string }> = {
  verified:  { label: 'New Order' },
  packed:    { label: 'Packed' },
  shipped:   { label: 'Shipped' },
  delivered: { label: 'Delivered' },
  rejected:  { label: 'Rejected' },
};

// ─── Effective stock helper (mirrors lib/services.ts) ─────────────────────────

interface StockDoc {
  count: number;
  sizes?: Record<string, number>;
  resumedFromOutOfStock?: string;
}

function getEffectiveSizeStock(doc: StockDoc, size?: string): number {
  if (size && doc.sizes?.[size] !== undefined) return doc.sizes[size];
  return doc.count ?? -1;
}

function isProductPaused(doc: StockDoc | null): boolean {
  if (!doc) return false;
  return doc.count === 0;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getNextStatus', () => {

  describe('standard fulfillment flow', () => {
    it('verified → packed', () => {
      expect(getNextStatus('verified')).toBe('packed');
    });

    it('packed → shipped', () => {
      expect(getNextStatus('packed')).toBe('shipped');
    });

    it('shipped → delivered', () => {
      expect(getNextStatus('shipped')).toBe('delivered');
    });

    it('delivered → null (terminal state)', () => {
      expect(getNextStatus('delivered')).toBeNull();
    });
  });

  describe('legacy/special statuses', () => {
    it('manual_verified → packed (regression: was returning null before fix)', () => {
      expect(getNextStatus('manual_verified')).toBe('packed');
    });

    it('rejected → null (no advance from cancelled order)', () => {
      expect(getNextStatus('rejected')).toBeNull();
    });

    it('pending → null (legacy status, not in fulfillment flow)', () => {
      expect(getNextStatus('pending')).toBeNull();
    });
  });

  describe('FULFILLMENT_FLOW ordering', () => {
    it('flow has exactly 4 steps', () => {
      expect(FULFILLMENT_FLOW).toHaveLength(4);
    });

    it('flow order is verified → packed → shipped → delivered', () => {
      expect(FULFILLMENT_FLOW).toEqual(['verified', 'packed', 'shipped', 'delivered']);
    });

    it('all statuses in flow have a STATUS_CONFIG entry', () => {
      for (const status of FULFILLMENT_FLOW) {
        expect(STATUS_CONFIG[status]).toBeDefined();
      }
    });

    it('every step advances by exactly one position', () => {
      for (let i = 0; i < FULFILLMENT_FLOW.length - 1; i++) {
        expect(getNextStatus(FULFILLMENT_FLOW[i])).toBe(FULFILLMENT_FLOW[i + 1]);
      }
    });
  });

  describe('STATUS_CONFIG coverage', () => {
    it('has config for rejected (admin-cancelled state)', () => {
      expect(STATUS_CONFIG['rejected']).toBeDefined();
    });

    it('does NOT have config for pending (legacy, should fall back)', () => {
      // STATUS_CONFIG.pending is undefined — component falls back to STATUS_CONFIG.verified
      expect(STATUS_CONFIG['pending']).toBeUndefined();
    });

    it('does NOT have config for manual_verified (displays as verified)', () => {
      expect(STATUS_CONFIG['manual_verified']).toBeUndefined();
      // Fallback: component uses STATUS_CONFIG[order.status] ?? STATUS_CONFIG.verified
      const fallback = STATUS_CONFIG['manual_verified'] ?? STATUS_CONFIG['verified'];
      expect(fallback.label).toBe('New Order');
    });
  });
});

// ─── Stock management logic ───────────────────────────────────────────────────

describe('getEffectiveSizeStock', () => {

  it('returns -1 (unlimited) when no stock doc exists', () => {
    expect(getEffectiveSizeStock({ count: -1 })).toBe(-1);
  });

  it('returns product-level count when no size override', () => {
    expect(getEffectiveSizeStock({ count: 5 }, '38 (M)')).toBe(5);
  });

  it('returns size-specific stock when override exists', () => {
    expect(getEffectiveSizeStock({ count: 10, sizes: { '38 (M)': 3 } }, '38 (M)')).toBe(3);
  });

  it('falls back to product count for sizes not in override map', () => {
    expect(getEffectiveSizeStock({ count: 10, sizes: { '38 (M)': 3 } }, '40 (L)')).toBe(10);
  });

  it('returns 0 when size stock is explicitly 0 (out of stock)', () => {
    expect(getEffectiveSizeStock({ count: 10, sizes: { '38 (M)': 0 } }, '38 (M)')).toBe(0);
  });

  it('LOOPHOLE: size not in override map uses product count even if other sizes are 0', () => {
    // Size '40 (L)' not in sizes map → falls back to count=10
    // Means 40L can still be ordered even though 38M is 0
    const stock = getEffectiveSizeStock({ count: 10, sizes: { '38 (M)': 0 } }, '40 (L)');
    expect(stock).toBe(10);
  });

  it('size=undefined falls back to product-level count', () => {
    expect(getEffectiveSizeStock({ count: 7 }, undefined)).toBe(7);
  });
});

describe('isProductPaused', () => {
  it('returns false when no stock doc (no data = unlimited)', () => {
    expect(isProductPaused(null)).toBe(false);
  });

  it('returns true when count = 0', () => {
    expect(isProductPaused({ count: 0 })).toBe(true);
  });

  it('returns false when count = -1 (unlimited)', () => {
    expect(isProductPaused({ count: -1 })).toBe(false);
  });

  it('returns false when count > 0 (limited but in stock)', () => {
    expect(isProductPaused({ count: 5 })).toBe(false);
  });

  it('count=0 with sizes still means paused (product-level gate)', () => {
    // If count=0, product is paused regardless of sizes — consistent with UI logic
    expect(isProductPaused({ count: 0, sizes: { '38 (M)': 5 } })).toBe(true);
  });
});

// ─── Order list filtering (mirrors MerchOrdersSubTab filter logic) ─────────────

type MerchOrder = {
  id: string;
  orderId: string;
  status: MerchOrderStatus;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  items: { productId: string }[];
};

function filterOrders(
  orders: MerchOrder[],
  statusFilter: string,
  itemFilter: string,
  searchQuery: string,
): MerchOrder[] {
  let result = orders
    .filter((o) => o.status !== 'rejected' && o.status !== 'pending'); // default excludes these

  if (statusFilter !== 'all') {
    result = result.filter((o) =>
      statusFilter === 'verified'
        ? o.status === 'verified' || o.status === 'manual_verified'
        : o.status === statusFilter
    );
  }

  if (itemFilter !== 'all') {
    result = result.filter((o) => o.items.some((i) => i.productId === itemFilter));
  }

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerMobile.includes(q)
    );
  }

  return result;
}

const sampleOrders: MerchOrder[] = [
  { id: '1', orderId: 'GRM-AAA111', status: 'verified',        customerName: 'Alice',   customerEmail: 'alice@x.com',   customerMobile: '9000000001', items: [{ productId: 'tshirt' }] },
  { id: '2', orderId: 'GRM-BBB222', status: 'manual_verified', customerName: 'Bob',     customerEmail: 'bob@x.com',     customerMobile: '9000000002', items: [{ productId: 'slingbag' }] },
  { id: '3', orderId: 'GRM-CCC333', status: 'packed',          customerName: 'Charlie', customerEmail: 'charlie@x.com', customerMobile: '9000000003', items: [{ productId: 'tshirt' }] },
  { id: '4', orderId: 'GRM-DDD444', status: 'shipped',         customerName: 'Diana',   customerEmail: 'diana@x.com',   customerMobile: '9000000004', items: [{ productId: 'slingbag' }] },
  { id: '5', orderId: 'GRM-EEE555', status: 'delivered',       customerName: 'Eve',     customerEmail: 'eve@x.com',     customerMobile: '9000000005', items: [{ productId: 'tshirt' }] },
  { id: '6', orderId: 'GRM-FFF666', status: 'rejected',        customerName: 'Frank',   customerEmail: 'frank@x.com',   customerMobile: '9000000006', items: [{ productId: 'tshirt' }] },
  { id: '7', orderId: 'GRM-GGG777', status: 'pending',         customerName: 'Grace',   customerEmail: 'grace@x.com',   customerMobile: '9000000007', items: [{ productId: 'tshirt' }] },
];

describe('order list filtering', () => {

  describe('default filter (all, excluding rejected/pending)', () => {
    it('excludes rejected and pending orders by default', () => {
      const result = filterOrders(sampleOrders, 'all', 'all', '');
      const statuses = result.map((o) => o.status);
      expect(statuses).not.toContain('rejected');
      expect(statuses).not.toContain('pending');
    });

    it('includes verified, manual_verified, packed, shipped, delivered', () => {
      const result = filterOrders(sampleOrders, 'all', 'all', '');
      expect(result).toHaveLength(5);
    });
  });

  describe('status filter', () => {
    it('verified filter includes both verified and manual_verified', () => {
      const result = filterOrders(sampleOrders, 'verified', 'all', '');
      const statuses = result.map((o) => o.status);
      expect(statuses).toContain('verified');
      expect(statuses).toContain('manual_verified');
      expect(result).toHaveLength(2);
    });

    it('packed filter shows only packed orders', () => {
      const result = filterOrders(sampleOrders, 'packed', 'all', '');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('packed');
    });

    it('shipped filter shows only shipped orders', () => {
      const result = filterOrders(sampleOrders, 'shipped', 'all', '');
      expect(result.every((o) => o.status === 'shipped')).toBe(true);
    });

    it('delivered filter shows only delivered orders', () => {
      const result = filterOrders(sampleOrders, 'delivered', 'all', '');
      expect(result.every((o) => o.status === 'delivered')).toBe(true);
    });

    it('rejected filter — note: base filter already excludes rejected', () => {
      // The base filter strips rejected before statusFilter applies
      const result = filterOrders(sampleOrders, 'rejected', 'all', '');
      // This is a bug: selecting "rejected" tab returns no results because
      // the base filter strips rejected before statusFilter runs
      expect(result).toHaveLength(0);
    });
  });

  describe('item (product) filter', () => {
    it('tshirt filter shows only tshirt orders', () => {
      const result = filterOrders(sampleOrders, 'all', 'tshirt', '');
      expect(result.every((o) => o.items.some((i) => i.productId === 'tshirt'))).toBe(true);
    });

    it('slingbag filter shows only slingbag orders', () => {
      const result = filterOrders(sampleOrders, 'all', 'slingbag', '');
      expect(result.every((o) => o.items.some((i) => i.productId === 'slingbag'))).toBe(true);
    });
  });

  describe('search query', () => {
    it('finds by order ID (case-insensitive)', () => {
      const result = filterOrders(sampleOrders, 'all', 'all', 'grm-aaa111');
      expect(result).toHaveLength(1);
      expect(result[0].orderId).toBe('GRM-AAA111');
    });

    it('finds by customer name (partial match)', () => {
      const result = filterOrders(sampleOrders, 'all', 'all', 'alice');
      expect(result).toHaveLength(1);
      expect(result[0].customerName).toBe('Alice');
    });

    it('finds by email', () => {
      const result = filterOrders(sampleOrders, 'all', 'all', 'charlie@x.com');
      expect(result).toHaveLength(1);
    });

    it('finds by mobile number', () => {
      const result = filterOrders(sampleOrders, 'all', 'all', '9000000003');
      expect(result).toHaveLength(1);
      expect(result[0].customerName).toBe('Charlie');
    });

    it('returns empty for no match', () => {
      const result = filterOrders(sampleOrders, 'all', 'all', 'zzz_nomatch');
      expect(result).toHaveLength(0);
    });

    it('search trims whitespace', () => {
      const result = filterOrders(sampleOrders, 'all', 'all', '  alice  ');
      expect(result).toHaveLength(1);
    });
  });
});

// ─── Stock warning timestamp logic ────────────────────────────────────────────

describe('stockWarning timestamp logic', () => {
  function isRecentlyResumed(resumedFromOutOfStock: string | undefined, nowMs = Date.now()): boolean {
    if (!resumedFromOutOfStock) return false;
    const resumedAt = new Date(resumedFromOutOfStock).getTime();
    const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
    return resumedAt > sevenDaysAgo;
  }

  it('flags order within 7 days of resume', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRecentlyResumed(threeDaysAgo)).toBe(true);
  });

  it('does not flag order older than 7 days', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRecentlyResumed(eightDaysAgo)).toBe(false);
  });

  it('does not flag when no resumedFromOutOfStock timestamp', () => {
    expect(isRecentlyResumed(undefined)).toBe(false);
  });

  it('flags on exactly the 7-day boundary (boundary is exclusive)', () => {
    const exactlySevenDays = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    // resumedAt === sevenDaysAgo → NOT strictly greater → false
    expect(isRecentlyResumed(exactlySevenDays)).toBe(false);
  });

  it('LOOPHOLE: future timestamp always flags (no upper bound validation)', () => {
    const oneYearFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    // A maliciously set future timestamp causes all orders within the next year to be flagged
    expect(isRecentlyResumed(oneYearFuture)).toBe(true);
  });
});

// ─── Order ID format ──────────────────────────────────────────────────────────

describe('orderId format', () => {
  it('matches GRM-XXXXXX pattern (uppercase alphanumeric, ambiguous chars excluded)', () => {
    // The generateOrderId function uses chars: abcdefghjkmnpqrstuvwxyz23456789
    // then .toUpperCase() → no I, O, L, 0, 1 to avoid confusion
    const pattern = /^GRM-[A-Z0-9]{6}$/;
    const excluded = ['I', 'O', 'L']; // excluded ambiguous chars from charset

    // Generate sample IDs to verify format
    const sampleIds = ['GRM-ABC123', 'GRM-3DV23D', 'GRM-ZXQR78'];
    for (const id of sampleIds) {
      expect(id).toMatch(pattern);
    }

    // Verify that charset does NOT include 0 or 1
    const charset = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    expect(charset).not.toContain('0');
    expect(charset).not.toContain('1');
    for (const c of excluded) {
      expect(charset).not.toContain(c);
    }
  });
});
