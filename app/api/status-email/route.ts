import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { buildStatusEmailHtml } from '@/lib/orderEmail';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('[status-email] RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { to, customerName, orderId, status, trackingCarrier, trackingId } = await req.json();

    if (!to || !orderId || !customerName || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['packed', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const subjectMap: Record<string, string> = {
      packed: `Order Packed – ${orderId} | Gramakam Merch`,
      shipped: `Order Shipped – ${orderId} | Gramakam Merch`,
      delivered: `Order Delivered – ${orderId} | Gramakam Merch`,
    };

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'Gramakam <orders@gramakam.org>',
      to,
      subject: subjectMap[status],
      html: buildStatusEmailHtml({ customerName, orderId, status, trackingCarrier, trackingId }),
    });

    if (error) {
      console.error('[status-email] Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    console.log(`[status-email] ✓ Sent ${status} email for ${orderId} to ${to}`);
    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error: unknown) {
    console.error('[status-email] Exception:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
