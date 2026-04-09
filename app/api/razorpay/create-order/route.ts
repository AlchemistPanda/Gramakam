import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PRODUCT_MAP, computeCartTotal, computeCartBreakdown, isValidCoupon } from '@/lib/products';

function generateOrderId(): string {
  const bytes = crypto.randomBytes(4);
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[bytes[i % bytes.length] % chars.length];
  return `GRM-${code}`.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { items, customerName, customerEmail, customerMobile, deliveryAddress, coupon } = await req.json();

    // Validate coupon if provided
    const validCoupon = coupon && isValidCoupon(coupon) ? coupon : undefined;

    // Validate customer fields
    if (!customerName || !customerEmail || !customerMobile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!deliveryAddress?.line1 || !deliveryAddress?.city || !deliveryAddress?.state || !deliveryAddress?.pincode) {
      return NextResponse.json({ error: 'Missing delivery address' }, { status: 400 });
    }

    // Validate cart items exist and compute total from server-side prices
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    for (const item of items) {
      const product = PRODUCT_MAP.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Unknown product: ${item.productId}` }, { status: 400 });
      }
      if (product.sizes && !product.sizes.includes(item.size)) {
        return NextResponse.json({ error: `Invalid size for ${product.name}: ${item.size}` }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return NextResponse.json({ error: `Invalid quantity for ${product.name}` }, { status: 400 });
      }
    }

    // Aggregate quantities per productId — prevent bypassing the per-row cap
    // by sending the same product multiple times (e.g. two rows of qty=10).
    const qtyPerProduct = new Map<string, number>();
    for (const item of items) {
      const combined = (qtyPerProduct.get(item.productId) ?? 0) + item.quantity;
      if (combined > 10) {
        const product = PRODUCT_MAP.get(item.productId);
        return NextResponse.json(
          { error: `Maximum 10 units per product (${product?.name ?? item.productId})` },
          { status: 400 }
        );
      }
      qtyPerProduct.set(item.productId, combined);
    }

    const amount = computeCartTotal(items, validCoupon);
    if (amount === null || amount < 1) {
      return NextResponse.json({ error: 'Invalid cart total' }, { status: 400 });
    }

    const { discount } = computeCartBreakdown(items, validCoupon);

    // Check stock availability (read-only — actual decrement happens on payment verification)
    // Also check for recently-resumed-from-out-of-stock flagging
    const stockWarningItems: string[] = [];
    try {
      const { db } = await import('@/lib/firebase');
      if (db) {
        const { doc: firestoreDoc, getDoc: firestoreGetDoc } = await import('firebase/firestore');
        const { getEffectiveSizeStock } = await import('@/lib/services');
        for (const item of items) {
          const stockSnap = await firestoreGetDoc(firestoreDoc(db, 'merch_stock', item.productId));
          if (stockSnap.exists()) {
            const stockData = stockSnap.data();
            const stockDoc = { count: stockData.count ?? -1, sizes: stockData.sizes, resumedFromOutOfStock: stockData.resumedFromOutOfStock };
            const effective = getEffectiveSizeStock(stockDoc, item.size);

            if (effective !== -1 && effective < item.quantity) {
              const product = PRODUCT_MAP.get(item.productId);
              const sizeLabel = item.size && item.size !== 'N/A' ? ` (${item.size})` : '';
              return NextResponse.json(
                { error: `${product?.name ?? item.productId}${sizeLabel} is out of stock (only ${effective} left)` },
                { status: 400 }
              );
            }

            // Check if this item was recently resumed from out-of-stock (within 7 days).
            // Upper-bound check (resumedAt <= now) prevents a future timestamp from flagging forever.
            if (stockDoc.resumedFromOutOfStock) {
              const resumedAt = new Date(stockDoc.resumedFromOutOfStock).getTime();
              const now = Date.now();
              const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
              if (resumedAt > sevenDaysAgo && resumedAt <= now) {
                const product = PRODUCT_MAP.get(item.productId);
                const sizeLabel = item.size && item.size !== 'N/A' ? ` (${item.size})` : '';
                stockWarningItems.push(`${product?.name ?? item.productId}${sizeLabel}`);
              }
            }
          }
        }
      }
    } catch (stockErr) {
      console.error('[create-order] Stock check failed (proceeding anyway):', stockErr);
    }

    // Generate order ID server-side
    const orderId = generateOrderId();

    // Reserve stock before opening Razorpay so concurrent buyers cannot oversell inventory.
    const normalizedItems = items.map((item: { productId: string; size?: string; quantity: number }) => ({
      productId: item.productId,
      size: item.size && item.size !== 'N/A' ? item.size : undefined,
      quantity: item.quantity,
    }));

    const { decrementStock, restoreStock, createMerchOrder } = await import('@/lib/services');
    const reserved = await decrementStock(normalizedItems);
    if (!reserved) {
      return NextResponse.json(
        { error: 'Some items just went out of stock. Please review your cart and try again.' },
        { status: 409 }
      );
    }

    // Validate env vars are set
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      await restoreStock(normalizedItems);
      console.error('[create-order] Razorpay credentials not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Import and instantiate inside function to avoid build-time issues
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Enrich items with canonical product name & price from server-side catalog
    const enrichedItems = items.map((item: { productId: string; size?: string; quantity: number }) => {
      const product = PRODUCT_MAP.get(item.productId)!;
      return {
        productId: item.productId,
        name: product.name,
        price: product.price,
        size: item.size ?? 'N/A',
        quantity: item.quantity,
      };
    });

    let order;
    try {
      order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency: 'INR',
        receipt: orderId,
        notes: {
          customerName,
          customerEmail,
          customerMobile,
          orderId,
        },
      });

      await createMerchOrder({
        orderId,
        items: enrichedItems,
        total: amount,
        discount: discount > 0 ? discount : undefined,
        coupon: validCoupon,
        customerName,
        customerEmail,
        customerMobile,
        deliveryAddress,
        upiRef: '',
        status: 'pending',
        razorpayOrderId: order.id,
        paymentMethod: 'razorpay',
        stockDeducted: true,
        stockReserved: true,
        stockReservedAt: new Date().toISOString(),
        stockRestored: false,
        stockWarning: stockWarningItems.length > 0,
        stockWarningItems: stockWarningItems.length > 0 ? stockWarningItems : undefined,
      });
    } catch (reservationErr) {
      await restoreStock(normalizedItems);
      throw reservationErr;
    }

    console.log('[create-order] ✓ Order created:', orderId, 'razorpay:', order.id, 'amount:', amount, 'customer:', customerEmail);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      orderId,       // send server-generated ID back to client
      serverTotal: amount,
      stockWarning: stockWarningItems.length > 0,
      stockWarningItems: stockWarningItems.length > 0 ? stockWarningItems : undefined,
    });
  } catch (error: unknown) {
    console.error('[create-order] Razorpay order creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
