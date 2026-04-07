import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { collection, query, where, getDocs, updateDoc, limit } from 'firebase/firestore';

// Razorpay sends webhooks as POST with a JSON body and X-Razorpay-Signature header.
// This endpoint catches payments that succeeded but whose client callback didn't fire
// (e.g. browser closed, network drop).

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[webhook] Signature mismatch — possible tampered request');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // We only care about successful payments
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (!payment) {
        return NextResponse.json({ status: 'ignored' });
      }

      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      // Lazily import Firebase to avoid build-time issues
      const { db } = await import('@/lib/firebase');
      if (!db) {
        console.error('[webhook] Firebase not configured — cannot process webhook for order:', razorpayOrderId);
        return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
      }

      // Find matching pending order
      const ordersRef = collection(db, 'merch_orders');
      const q = query(
        ordersRef,
        where('razorpayOrderId', '==', razorpayOrderId),
        where('status', '==', 'pending'),
        limit(1)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const orderDoc = snap.docs[0];
        const orderData = orderDoc.data();
        await updateDoc(orderDoc.ref, {
          status: 'verified',
          razorpayPaymentId,
          upiRef: razorpayPaymentId,
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'webhook',
          stockReserved: false,
          stockRestored: false,
          stockDeducted: true,
        });
        console.log(`[webhook] ✓ Verified order ${orderData.orderId} (doc: ${orderDoc.id}) via payment ${razorpayPaymentId}`);

        // Decrement stock for verified payment (only if client didn't already do it)
        if (!orderData.stockDeducted) {
          try {
            const { decrementStock } = await import('@/lib/services');
            const items = (orderData.items || []).map((i: { productId: string; size?: string; quantity: number }) => ({
              productId: i.productId,
              size: i.size && i.size !== 'N/A' ? i.size : undefined,
              quantity: i.quantity,
            }));
            await decrementStock(items);
            console.log(`[webhook] ✓ Stock decremented for order ${orderData.orderId}`);
          } catch (stockErr) {
            console.error(`[webhook] Stock decrement failed for order ${orderData.orderId}:`, stockErr);
          }
        } else {
          console.log(`[webhook] Stock already deducted for order ${orderData.orderId}, skipping`);
        }

        // Send confirmation email (webhook-recovered payment)
        if (process.env.RESEND_API_KEY && orderData.customerEmail) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const { buildOrderEmailHtml } = await import('@/lib/orderEmail');
            await resend.emails.send({
              from: 'Gramakam <orders@gramakam.org>',
              to: orderData.customerEmail,
              subject: `Order Confirmed – ${orderData.orderId} | Gramakam Merch`,
              html: buildOrderEmailHtml({
                customerName: orderData.customerName,
                orderId: orderData.orderId,
                items: orderData.items,
                total: orderData.total,
                paymentId: razorpayPaymentId,
                deliveryAddress: orderData.deliveryAddress,
              }),
            });
            console.log(`[webhook] ✓ Confirmation email sent to ${orderData.customerEmail} for order ${orderData.orderId}`);
          } catch (emailErr) {
            console.error('[webhook] Email send failed for order:', orderData.orderId, emailErr);
          }
        }
      } else {
        // Order may already be verified by the client handler — that's fine
        console.log(`[webhook] No pending order found for razorpay order ${razorpayOrderId} (likely already verified by client)`);
      }

      return NextResponse.json({ status: 'ok' });
    }

    // Acknowledge other events without processing
    return NextResponse.json({ status: 'ignored' });
  } catch (error: unknown) {
    console.error('[webhook] Processing failed:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
