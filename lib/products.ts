// Canonical product catalog — shared between client pages and server-side API routes.
// Always use this as the source of truth for prices and valid sizes.

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  sizes?: string[];
  stock: number; // total units available (-1 = unlimited)
}

export const PRODUCTS: Product[] = [
  {
    id: 'tshirt',
    name: 'Gramakam T-Shirt',
    description:
      'Premium cotton t-shirt with the iconic Gramakam festival design. A wearable piece of cultural art.',
    images: ['/images/merch/tshirt2.jpg', '/images/merch/tshirt.jpg', '/images/merch/tshirt3.png', '/images/merch/tshirt4.png'],
    price: 300,
    sizes: ['24', '28', '32', '36 (S)', '38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'],
    stock: -1, // unlimited for now — set to actual count before launch
  },
  {
    id: 'slingbag',
    name: 'Gramakam Sling Bag',
    description:
      'A stylish, everyday carry sling bag bearing the Gramakam 2026 festival design. Crafted for comfort and durability, it features a spacious main compartment and an adjustable strap — perfect for the festival and beyond.',
    images: [
      '/images/SLINGBAG/SLINGBAG1.png',
      '/images/SLINGBAG/SLINGBAG2.png',
      '/images/SLINGBAG/SLINGBAG3.png',
      '/images/SLINGBAG/SLINGBAG4.png',
    ],
    price: 200,
    stock: -1, // unlimited for now
  },
];

/** Fast lookup by product ID */
export const PRODUCT_MAP = new Map(PRODUCTS.map((p) => [p.id, p]));

// ── T-shirt bulk discount tiers ──
// 1 pc  → ₹300
// 2 pcs → ₹550  (save ₹50)
// 4 pcs → ₹1000 (save ₹200)
// For any quantity, the best combo of {4, 2, 1} packs is used.
export const TSHIRT_DISCOUNT_TIERS = [
  { qty: 4, total: 1000 },
  { qty: 2, total: 550 },
  { qty: 1, total: 300 },
] as const;

/** Compute the cheapest total for `qty` t-shirts using bulk tiers. */
export function computeTshirtTotal(qty: number): number {
  let remaining = qty;
  let total = 0;
  for (const tier of TSHIRT_DISCOUNT_TIERS) {
    const packs = Math.floor(remaining / tier.qty);
    total += packs * tier.total;
    remaining -= packs * tier.qty;
  }
  return total;
}

/** Compute total from cart items using server-side prices (ignores client-sent prices). */
export function computeCartTotal(items: { productId: string; quantity: number }[]): number | null {
  // Count total t-shirts across all sizes
  let tshirtQty = 0;
  let otherTotal = 0;

  for (const item of items) {
    const product = PRODUCT_MAP.get(item.productId);
    if (!product) return null; // unknown product
    if (item.quantity < 1 || item.quantity > 10) return null;

    if (item.productId === 'tshirt') {
      tshirtQty += item.quantity;
    } else {
      otherTotal += product.price * item.quantity;
    }
  }

  // Apply bulk discount for t-shirts
  const tshirtTotal = tshirtQty > 0 ? computeTshirtTotal(tshirtQty) : 0;
  return tshirtTotal + otherTotal;
}

/** Breakdown for UI display: subtotal (at base price), discount, final total. */
export function computeCartBreakdown(items: { productId: string; quantity: number }[]): {
  subtotal: number;
  discount: number;
  total: number;
  tshirtQty: number;
} {
  let tshirtQty = 0;
  let subtotal = 0;

  for (const item of items) {
    const product = PRODUCT_MAP.get(item.productId);
    if (!product) continue;
    subtotal += product.price * item.quantity;
    if (item.productId === 'tshirt') tshirtQty += item.quantity;
  }

  const total = computeCartTotal(items) ?? subtotal;
  return { subtotal, discount: subtotal - total, total, tshirtQty };
}
