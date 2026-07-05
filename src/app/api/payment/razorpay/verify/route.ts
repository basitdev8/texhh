import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { RAZORPAY_KEY_SECRET_VALUE } from '@/lib/razorpay';
import { fulfillPaidOrder } from '@/lib/orderFulfillment';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = verifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment payload' },
        { status: 400 }
      );
    }

    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = validation.data;

    // Recompute the signature and compare — this proves the callback
    // genuinely came from Razorpay and was not forged by the client.
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET_VALUE)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Ensure the order belongs to the caller and matches the RZP order.
    if (
      order.user.toString() !== payload.userId ||
      order.razorpayOrderId !== razorpay_order_id
    ) {
      return NextResponse.json(
        { success: false, error: 'Order mismatch' },
        { status: 403 }
      );
    }

    const expectedBuf = Buffer.from(expectedSignature);
    const receivedBuf = Buffer.from(razorpay_signature);
    const isValid =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValid) {
      // Don't mutate the order on a bad signature — leave it pending so the
      // authoritative webhook (payment.captured / payment.failed) decides.
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Atomically flip to paid + decrement stock exactly once. If the webhook
    // already confirmed it, this is a no-op that still returns success.
    await fulfillPaidOrder({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    return NextResponse.json({ success: true, data: { orderId: order._id } });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
