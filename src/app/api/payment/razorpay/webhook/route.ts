import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import { fulfillPaidOrder, markOrderFailed } from '@/lib/orderFulfillment';

// Razorpay signs the webhook with the secret you set in the dashboard.
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

interface RazorpayWebhookPayment {
  id: string;
  order_id: string;
  error_description?: string;
}

interface RazorpayWebhookBody {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayWebhookPayment };
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!WEBHOOK_SECRET) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // The signature is computed over the EXACT raw body, so read it as text
    // (never re-serialize the parsed JSON — key order/whitespace would differ).
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected);
    const receivedBuf = Buffer.from(signature);
    const valid =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const body = JSON.parse(rawBody) as RazorpayWebhookBody;
    const payment = body.payload?.payment?.entity;

    await dbConnect();

    switch (body.event) {
      case 'payment.captured':
      case 'order.paid': {
        if (payment?.order_id) {
          await fulfillPaidOrder({
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
          });
        }
        break;
      }
      case 'payment.failed': {
        if (payment?.order_id) {
          await markOrderFailed(payment.order_id);
        }
        break;
      }
      default:
        // Unhandled event types are acknowledged so Razorpay stops retrying.
        break;
    }

    // Always 200 on a valid, processed webhook so Razorpay marks it delivered.
    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
