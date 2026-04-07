import type { MerchCartItem, DeliveryAddress } from '@/types';

interface OrderEmailData {
  customerName: string;
  orderId: string;
  items: MerchCartItem[];
  total: number;
  paymentId: string;
  deliveryAddress?: DeliveryAddress;
}

interface StatusEmailData {
  customerName: string;
  orderId: string;
  status: 'packed' | 'shipped' | 'delivered';
  trackingCarrier?: string;
  trackingId?: string;
}

export function buildOrderEmailHtml(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0ebe3;font-size:14px;color:#333">${item.name}${item.size !== 'N/A' ? ` <span style="color:#888">(${item.size})</span>` : ''}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0ebe3;font-size:14px;color:#333;text-align:center">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0ebe3;font-size:14px;color:#333;text-align:right">₹${item.price * item.quantity}</td>
        </tr>`
    )
    .join('');

  const addr = data.deliveryAddress;
  const addressBlock = addr
    ? `<div style="margin-top:20px;padding:16px;background:#faf7f2;border-radius:8px">
        <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888">Delivery Address</p>
        <p style="margin:0;font-size:14px;color:#333;line-height:1.6">
          ${addr.line1}${addr.line2 ? `<br>${addr.line2}` : ''}<br>
          ${addr.city}, ${addr.state} – ${addr.pincode}
        </p>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
    <!-- Header -->
    <div style="background:#6B1D1D;padding:28px 24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px">Gramakam 2026</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Order Confirmation</p>
    </div>

    <div style="padding:28px 24px">
      <!-- Greeting -->
      <p style="margin:0 0 4px;font-size:16px;color:#333">Hi <strong>${data.customerName}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.5">
        Thank you for your purchase! Your payment has been verified and your order is confirmed.
      </p>

      <!-- Order details box -->
      <div style="padding:16px;background:#faf7f2;border-radius:8px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:4px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Order ID</td>
            <td style="padding:4px 0;font-size:14px;color:#333;font-weight:600;text-align:right;font-family:monospace">${data.orderId}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Payment ID</td>
            <td style="padding:4px 0;font-size:12px;color:#333;text-align:right;font-family:monospace">${data.paymentId}</td>
          </tr>
        </table>
      </div>

      <!-- Items table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
        <thead>
          <tr style="background:#faf7f2">
            <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;text-align:left">Item</th>
            <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;text-align:center">Qty</th>
            <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;text-align:right">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;font-size:15px;font-weight:700;color:#6B1D1D">Total</td>
            <td style="padding:12px;font-size:15px;font-weight:700;color:#6B1D1D;text-align:right">₹${data.total}</td>
          </tr>
        </tfoot>
      </table>

      ${addressBlock}

      <!-- Track order CTA -->
      <div style="text-align:center;margin-top:28px">
        <a href="https://gramakam.org/track?orderId=${data.orderId}" style="display:inline-block;background:#6B1D1D;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Track Your Order</a>
      </div>

      <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;line-height:1.5">
        Questions? Reply to this email or contact us at
        <a href="mailto:Ifcreationsvelur@gmail.com" style="color:#6B1D1D">Ifcreationsvelur@gmail.com</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#faf7f2;padding:16px 24px;text-align:center;border-top:1px solid #f0ebe3">
      <p style="margin:0;font-size:11px;color:#aaa">© 2026 Gramakam Theatre Festival, Velur, Thrissur</p>
    </div>
  </div>
</body>
</html>`;
}

const STATUS_EMAIL_CONFIG: Record<string, { emoji: string; heading: string; message: string; color: string }> = {
  packed: {
    emoji: '📦',
    heading: 'Your Order is Packed!',
    message: 'Your order has been carefully packed and is ready to be shipped. We\'ll update you once it\'s on its way.',
    color: '#2563eb',
  },
  shipped: {
    emoji: '🚚',
    heading: 'Your Order is on the Way!',
    message: 'Your order has been shipped and is on its way to you.',
    color: '#7c3aed',
  },
  delivered: {
    emoji: '✅',
    heading: 'Your Order has been Delivered!',
    message: 'Your order has been delivered. We hope you love your Gramakam merch!',
    color: '#16a34a',
  },
};

export function buildStatusEmailHtml(data: StatusEmailData): string {
  const cfg = STATUS_EMAIL_CONFIG[data.status];
  if (!cfg) return '';

  const trackingBlock =
    data.status === 'shipped' && data.trackingId
      ? `<div style="margin-top:20px;padding:16px;background:#f5f3ff;border-radius:8px;border:1px solid #e9e5ff">
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#888">Tracking Details</p>
          ${data.trackingCarrier ? `<p style="margin:0 0 4px;font-size:13px;color:#666">${data.trackingCarrier}</p>` : ''}
          <p style="margin:0;font-size:16px;font-weight:700;font-family:monospace;color:#333;letter-spacing:1px">${data.trackingId}</p>
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
    <!-- Header -->
    <div style="background:${cfg.color};padding:28px 24px;text-align:center">
      <p style="margin:0 0 8px;font-size:36px">${cfg.emoji}</p>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">${cfg.heading}</h1>
    </div>

    <div style="padding:28px 24px">
      <p style="margin:0 0 4px;font-size:16px;color:#333">Hi <strong>${data.customerName}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.5">${cfg.message}</p>

      <!-- Order ID box -->
      <div style="padding:16px;background:#faf7f2;border-radius:8px;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:4px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px">Order ID</td>
            <td style="padding:4px 0;font-size:14px;color:#333;font-weight:600;text-align:right;font-family:monospace">${data.orderId}</td>
          </tr>
        </table>
      </div>

      ${trackingBlock}

      <!-- Track order CTA -->
      <div style="text-align:center;margin-top:28px">
        <a href="https://gramakam.org/track?orderId=${data.orderId}" style="display:inline-block;background:${cfg.color};color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Track Your Order</a>
      </div>

      <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;line-height:1.5">
        Questions? Contact us at
        <a href="mailto:Ifcreationsvelur@gmail.com" style="color:#6B1D1D">Ifcreationsvelur@gmail.com</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#faf7f2;padding:16px 24px;text-align:center;border-top:1px solid #f0ebe3">
      <p style="margin:0;font-size:11px;color:#aaa">© 2026 Gramakam Theatre Festival, Velur, Thrissur</p>
    </div>
  </div>
</body>
</html>`;
}
