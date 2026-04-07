import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PRODUCT_MAP, computeCartTotal } from '@/lib/products';

function generateOrderId(): string {
  const bytes = crypto.randomBytes(4);
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[bytes[i % bytes.length] % chars.length];
  return `GRM-${code}`.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { items, customerName, customerEmail, customerMobile } = await req.json();

    // Validate customer fields
    if (!customerName || !customerEmail || !customerMobile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    const amount = computeCartTotal(items);
    if (amount === null || amount < 1) {
      return NextResponse.json({ error: 'Invalid cart total' }, { status: 400 });
    }

    // Check stock availability (read-only — actual decrement happens on payment verification)
    try {
      const { db } = await import('@/lib/firebase');
      if (db) {
        const { doc: firestoreDoc, getDoc: firestoreGetDoc } = await import('firebase/firestore');
        for (const item of items) {
          const stockSnap = await firestoreGetDoc(firestoreDoc(db, 'merch_stock', item.productId));
          if (stockSnap.exists()) {
            const stockCount = stockSnap.data().count ?? -1;
            if (stockCount !== -1 && stockCount < item.quantity) {
              const product = PRODUCT_MAP.get(item.productId);
              return NextResponse.json(
                { error: `${product?.name ?? item.productId} is out of stock (only ${stockCount} left)` },
                { status: 400 }
              );
            }
          }
        }
      }
    } catch (stockErr) {
      console.error('[create-order] Stock check failed (proceeding anyway):', stockErr);
      // Don't block the order if stock check fails — better to oversell than lose a sale
    }

    // Generate order ID server-side
    const orderId = generateOrderId();

    // Validate env vars are set
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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

    const order = await razorpay.orders.create({
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

    console.log('[create-order] ✓ Order created:', orderId, 'razorpay:', order.id, 'amount:', amount, 'customer:', customerEmail);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      orderId,       // send server-generated ID back to client
      serverTotal: amount,
    });
  } catch (error: unknown) {
    console.error('[create-order] Razorpay order creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
