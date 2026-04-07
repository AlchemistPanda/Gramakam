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
    price: 1,
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
    price: 1,
    stock: -1, // unlimited for now
  },
];

/** Fast lookup by product ID */
export const PRODUCT_MAP = new Map(PRODUCTS.map((p) => [p.id, p]));

/** Compute total from cart items using server-side prices (ignores client-sent prices). */
export function computeCartTotal(items: { productId: string; quantity: number }[]): number | null {
  let total = 0;
  for (const item of items) {
    const product = PRODUCT_MAP.get(item.productId);
    if (!product) return null; // unknown product
    if (item.quantity < 1 || item.quantity > 10) return null;
    total += product.price * item.quantity;
  }
  return total;
}
