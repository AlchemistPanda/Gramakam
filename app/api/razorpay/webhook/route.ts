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
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
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
      console.error('Webhook signature mismatch');
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
        console.error('Firebase not configured — cannot process webhook');
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
        });
        console.log(`Webhook: verified order ${orderDoc.id} via payment ${razorpayPaymentId}`);

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
            console.log(`Webhook: confirmation email sent to ${orderData.customerEmail}`);
          } catch (emailErr) {
            console.error('Webhook: email send failed:', emailErr);
          }
        }
      } else {
        // Order may already be verified by the client handler — that's fine
        console.log(`Webhook: no pending order found for razorpay order ${razorpayOrderId}`);
      }

      return NextResponse.json({ status: 'ok' });
    }

    // Acknowledge other events without processing
    return NextResponse.json({ status: 'ignored' });
  } catch (error: unknown) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
