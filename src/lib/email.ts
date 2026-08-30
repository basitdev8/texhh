import crypto from 'crypto';
import { Resend } from 'resend';
import User from '@/models/User';
import type { IOrderDocument } from '@/models/Order';

type OrderStatus = IOrderDocument['status'];

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  tags?: { name: string; value: string }[];
};

const STORE_NAME = 'TechChasers';

function configuredMail() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) return null;

  return {
    client: new Resend(apiKey),
    from,
    replyTo: process.env.RESEND_REPLY_TO,
  };
}

function getStoreUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, '');

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return 'http://localhost:3000';
}

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function money(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function orderUrl(order: IOrderDocument): string {
  return `${getStoreUrl()}/account/orders/${order._id}`;
}

function eventKey(type: string, value: string): string {
  const hash = crypto.createHash('sha256').update(value).digest('hex').slice(0, 20);
  return `${type}/${hash}`;
}

function emailLayout(preview: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="margin:0;background:#f5f5f3;color:#171717;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f3;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e8e8e4;">
          <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #e8e8e4;">
            <div style="font-size:21px;font-weight:800;letter-spacing:-.5px;">${STORE_NAME}</div>
          </td></tr>
          <tr><td style="padding:30px 32px;">${body}</td></tr>
          <tr><td style="padding:20px 32px;color:#666;font-size:12px;border-top:1px solid #e8e8e4;">
            Need help? Reply to this email and include your order number.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function orderSummary(order: IOrderDocument): string {
  const rows = order.items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #ededeb;vertical-align:top;">${escapeHtml(item.name)}<br><span style="font-size:13px;color:#666;">Qty ${item.quantity}</span></td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid #ededeb;vertical-align:top;font-weight:600;white-space:nowrap;">${money(item.price * item.quantity)}</td>
    </tr>`).join('');

  const address = order.shippingAddress;
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;margin:22px 0;">
      <tr><td colspan="2" style="font-weight:700;padding-bottom:6px;">Order items</td></tr>
      ${rows}
      <tr><td style="padding-top:14px;font-weight:700;">Total</td><td align="right" style="padding-top:14px;font-weight:800;font-size:16px;">${money(order.totalAmount)}</td></tr>
    </table>
    <div style="margin-top:24px;padding:16px;background:#f7f7f5;font-size:14px;line-height:1.5;">
      <strong>Shipping to</strong><br>
      ${escapeHtml(address.fullName)}<br>
      ${escapeHtml(address.street)}, ${escapeHtml(address.city)}<br>
      ${escapeHtml(address.state)} ${escapeHtml(address.zipCode)}, ${escapeHtml(address.country)}<br>
      ${escapeHtml(address.phone)}
    </div>`;
}

function orderButton(order: IOrderDocument, label = 'View order'): string {
  return `<p style="margin:26px 0 0;"><a href="${escapeHtml(orderUrl(order))}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;padding:12px 18px;font-weight:700;font-size:14px;">${escapeHtml(label)}</a></p>`;
}

async function customerFor(order: IOrderDocument): Promise<{ name: string; email: string } | null> {
  const userId =
    order.user && typeof order.user === 'object' && '_id' in order.user
      ? order.user._id
      : order.user;
  const user = await User.findById(userId).select('name email').lean<{ name: string; email: string } | null>();
  return user ? { name: user.name, email: user.email } : null;
}

/**
 * Sends email without ever breaking checkout or order-management operations.
 * Resend's idempotency key protects against route/webhook retry duplicates.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const config = configuredMail();
  if (!config) {
    console.warn('Email skipped: set RESEND_API_KEY and RESEND_FROM in .env');
    return false;
  }

  try {
    const { error } = await config.client.emails.send(
      {
        from: config.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(config.replyTo ? { reply_to: config.replyTo } : {}),
        ...(payload.tags ? { tags: payload.tags } : {}),
      },
      { idempotencyKey: payload.idempotencyKey }
    );

    if (error) {
      console.error('Resend email failed:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Resend email failed:', error);
    return false;
  }
}

export async function sendWelcomeEmail(user: { _id: unknown; name: string; email: string }): Promise<boolean> {
  const accountUrl = `${getStoreUrl()}/account`;
  const firstName = user.name.trim().split(/\s+/)[0] || 'there';
  return sendEmail({
    to: user.email,
    subject: `Welcome to ${STORE_NAME}`,
    idempotencyKey: eventKey('welcome-user', String(user._id)),
    text: `Hi ${firstName}, welcome to ${STORE_NAME}. Your account is ready: ${accountUrl}`,
    html: emailLayout(`Welcome to ${STORE_NAME}`, `
      <h1 style="font-size:26px;letter-spacing:-.5px;margin:0 0 12px;">Welcome, ${escapeHtml(firstName)}.</h1>
      <p style="font-size:16px;line-height:1.55;margin:0;color:#333;">Your ${STORE_NAME} account is ready. Browse the catalogue whenever you are ready.</p>
      <p style="margin:26px 0 0;"><a href="${escapeHtml(accountUrl)}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;padding:12px 18px;font-weight:700;font-size:14px;">My account</a></p>`),
    tags: [{ name: 'category', value: 'welcome' }],
  });
}

/** Send confirmation + internal alert for COD and bank-transfer orders. */
export async function sendOrderReceivedEmails(order: IOrderDocument): Promise<void> {
  try {
    const [customer] = await Promise.all([customerFor(order), sendAdminNewOrderEmail(order, 'New order received')]);
    if (!customer) return;

    const greeting = customer.name.trim().split(/\s+/)[0] || 'there';
    await sendEmail({
      to: customer.email,
      subject: `Order ${order.orderNumber} received`,
      idempotencyKey: eventKey('order-received', String(order._id)),
      text: `Hi ${greeting}, we received order ${order.orderNumber}. Total: ${money(order.totalAmount)}. View it: ${orderUrl(order)}`,
      html: emailLayout(`Order ${order.orderNumber} received`, `
        <h1 style="font-size:26px;letter-spacing:-.5px;margin:0 0 12px;">We received your order.</h1>
        <p style="font-size:16px;line-height:1.55;margin:0;color:#333;">Hi ${escapeHtml(greeting)}, your order <strong>${escapeHtml(order.orderNumber)}</strong> is now with our team.</p>
        ${orderSummary(order)}
        ${orderButton(order)}`),
      tags: [{ name: 'category', value: 'order_received' }, { name: 'order_number', value: order.orderNumber }],
    });
  } catch (error) {
    console.error('Order-received email failed:', error);
  }
}

/** Send confirmation + internal alert only after a Razorpay payment is confirmed. */
export async function sendPaidOrderEmails(order: IOrderDocument): Promise<void> {
  try {
    const [customer] = await Promise.all([customerFor(order), sendAdminNewOrderEmail(order, 'New paid order')]);
    if (!customer) return;

    const greeting = customer.name.trim().split(/\s+/)[0] || 'there';
    await sendEmail({
      to: customer.email,
      subject: `Payment received — order ${order.orderNumber}`,
      idempotencyKey: eventKey('order-paid', String(order._id)),
      text: `Hi ${greeting}, payment for order ${order.orderNumber} is confirmed. Total: ${money(order.totalAmount)}. View it: ${orderUrl(order)}`,
      html: emailLayout(`Payment received for ${order.orderNumber}`, `
        <h1 style="font-size:26px;letter-spacing:-.5px;margin:0 0 12px;">Payment received.</h1>
        <p style="font-size:16px;line-height:1.55;margin:0;color:#333;">Hi ${escapeHtml(greeting)}, payment for order <strong>${escapeHtml(order.orderNumber)}</strong> is confirmed. We will send tracking details once it ships.</p>
        ${orderSummary(order)}
        ${orderButton(order)}`),
      tags: [{ name: 'category', value: 'order_paid' }, { name: 'order_number', value: order.orderNumber }],
    });
  } catch (error) {
    console.error('Paid-order email failed:', error);
  }
}

export async function sendOrderPaymentReceivedEmail(order: IOrderDocument): Promise<void> {
  try {
    const customer = await customerFor(order);
    if (!customer) return;

    const greeting = customer.name.trim().split(/\s+/)[0] || 'there';
    await sendEmail({
      to: customer.email,
      subject: `Payment received — order ${order.orderNumber}`,
      idempotencyKey: eventKey('manual-payment-received', String(order._id)),
      text: `Hi ${greeting}, payment for order ${order.orderNumber} is confirmed. Total: ${money(order.totalAmount)}. View it: ${orderUrl(order)}`,
      html: emailLayout(`Payment received for ${order.orderNumber}`, `
        <h1 style="font-size:26px;letter-spacing:-.5px;margin:0 0 12px;">Payment received.</h1>
        <p style="font-size:16px;line-height:1.55;margin:0;color:#333;">Hi ${escapeHtml(greeting)}, payment for order <strong>${escapeHtml(order.orderNumber)}</strong> is confirmed.</p>
        ${orderSummary(order)}
        ${orderButton(order)}`),
      tags: [{ name: 'category', value: 'payment_received' }, { name: 'order_number', value: order.orderNumber }],
    });
  } catch (error) {
    console.error('Payment-received email failed:', error);
  }
}

export async function sendOrderStatusEmail(order: IOrderDocument, status: OrderStatus): Promise<void> {
  try {
    const customer = await customerFor(order);
    if (!customer) return;

    const greeting = customer.name.trim().split(/\s+/)[0] || 'there';
    let subject: string;
    let message: string;
    let extra = '';
    let event = `order-${status}`;

    if (status === 'shipped') {
      subject = `Order ${order.orderNumber} is on its way`;
      message = `Hi ${greeting}, your order is on its way.`;
      const tracking = [order.carrier, order.trackingNumber].filter(Boolean).join(' · ');
      if (tracking) extra = `<p style="font-size:15px;line-height:1.55;margin:18px 0 0;color:#333;"><strong>Tracking:</strong> ${escapeHtml(tracking)}</p>`;
      if (order.estimatedDelivery) {
        extra += `<p style="font-size:15px;line-height:1.55;margin:8px 0 0;color:#333;"><strong>Estimated delivery:</strong> ${escapeHtml(new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}</p>`;
      }
      event += `/${order.trackingNumber || 'no-tracking'}/${order.carrier || 'no-carrier'}/${order.estimatedDelivery?.toISOString() || 'no-date'}`;
    } else if (status === 'delivered') {
      subject = `Order ${order.orderNumber} delivered`;
      message = `Hi ${greeting}, your order has been marked as delivered. Enjoy your new gear.`;
    } else if (status === 'cancelled') {
      subject = `Order ${order.orderNumber} cancelled`;
      message = `Hi ${greeting}, your order has been cancelled. If you need help, reply to this email.`;
    } else {
      return;
    }

    await sendEmail({
      to: customer.email,
      subject,
      idempotencyKey: eventKey(event, String(order._id)),
      text: `${message} View your order: ${orderUrl(order)}`,
      html: emailLayout(subject, `
        <h1 style="font-size:26px;letter-spacing:-.5px;margin:0 0 12px;">${escapeHtml(subject)}</h1>
        <p style="font-size:16px;line-height:1.55;margin:0;color:#333;">${escapeHtml(message)}</p>
        ${extra}
        ${orderButton(order)}`),
      tags: [{ name: 'category', value: `order_${status}` }, { name: 'order_number', value: order.orderNumber }],
    });
  } catch (error) {
    console.error(`Order-${status} email failed:`, error);
  }
}

async function sendAdminNewOrderEmail(order: IOrderDocument, heading: string): Promise<boolean> {
  const recipient = process.env.RESEND_ORDER_NOTIFICATION_EMAIL;
  if (!recipient) return false;

  const orderAdminUrl = `${getStoreUrl()}/admin/orders/${order._id}`;
  return sendEmail({
    to: recipient,
    subject: `${heading}: ${order.orderNumber} (${money(order.totalAmount)})`,
    idempotencyKey: eventKey('admin-order-alert', `${order._id}/${heading}`),
    text: `${heading}: ${order.orderNumber}. Total ${money(order.totalAmount)}. Open: ${orderAdminUrl}`,
    html: emailLayout(`${heading}: ${order.orderNumber}`, `
      <h1 style="font-size:24px;letter-spacing:-.5px;margin:0 0 12px;">${escapeHtml(heading)}</h1>
      <p style="font-size:16px;line-height:1.55;margin:0;color:#333;"><strong>${escapeHtml(order.orderNumber)}</strong> · ${escapeHtml(money(order.totalAmount))}</p>
      ${orderSummary(order)}
      <p style="margin:26px 0 0;"><a href="${escapeHtml(orderAdminUrl)}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;padding:12px 18px;font-weight:700;font-size:14px;">Open order</a></p>`),
    tags: [{ name: 'category', value: 'admin_order_alert' }, { name: 'order_number', value: order.orderNumber }],
  });
}
