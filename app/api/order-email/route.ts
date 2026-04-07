import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { MerchCartItem, DeliveryAddress } from '@/types';
import { buildOrderEmailHtml } from '@/lib/orderEmail';

interface OrderEmailPayload {
  to: string;
  customerName: string;
  orderId: string;
  items: MerchCartItem[];
  total: number;
  discount?: number;
  paymentId: string;
  deliveryAddress?: DeliveryAddress;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const payload: OrderEmailPayload = await req.json();

    if (!payload.to || !payload.orderId || !payload.customerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'Gramakam <orders@gramakam.org>',
      to: payload.to,
      subject: `Order Confirmed – ${payload.orderId} | Gramakam Merch`,
      html: buildOrderEmailHtml(payload),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error: unknown) {
    console.error('Email send failed:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
