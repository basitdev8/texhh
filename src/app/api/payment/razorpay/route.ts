import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import razorpay from '@/lib/razorpay';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { generateOrderNumber } from '@/lib/utils';
import { getSettings } from '@/lib/settings';
import { computeTotals } from '@/lib/pricing';
import { resolveOrderItems } from '@/lib/orderItems';

const orderItemSchema = z.object({
  product: z.string().min(1, 'Product ID is required'),
  itemType: z.enum(['product', 'component']).optional(),
  name: z.string().optional(),
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(1),
});

const shippingAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().optional().default('IN'),
  phone: z.string().min(1, 'Phone is required'),
});

const createPaymentSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: shippingAddressSchema,
  notes: z.string().max(1000).optional(),
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

    const { allowed, retryAfter } = await rateLimit(
      `razorpay-order:${payload.userId}`,
      5,
      15 * 60 * 1000
    );
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many payment attempts. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { items, shippingAddress, notes } = validation.data;

    // Rebuild the cart from the catalogue and price it server-side. Stock is only
    // checked here — it is decremented when the payment is confirmed.
    const resolution = await resolveOrderItems(items);
    if (resolution.blockers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: resolution.blockers[0].message,
          changes: resolution.changes,
          blockers: resolution.blockers,
        },
        { status: 409 }
      );
    }
    if (resolution.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No orderable items in this cart' },
        { status: 400 }
      );
    }

    // A price that moved since the cart was filled must be confirmed before we
    // open a payment for the new amount.
    if (resolution.changes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prices in your cart have changed. Review the new total and try again.',
          changes: resolution.changes,
        },
        { status: 409 }
      );
    }

    const settings = await getSettings();
    const totals = computeTotals(resolution.subtotal, settings);
    const amountInPaise = Math.round(totals.totalAmount * 100);

    const orderNumber = generateOrderNumber();

    // Create the Razorpay order (amount is in the smallest currency unit).
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: { orderNumber, userId: payload.userId },
    });

    // Persist our order as pending — stock is decremented only after
    // the payment signature is verified.
    const order = await Order.create({
      orderNumber,
      user: payload.userId,
      items: resolution.items.map((i) => ({
        product: i.product,
        itemType: i.itemType,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      shippingAddress,
      subtotal: totals.subtotal,
      shippingCost: totals.shippingCost,
      tax: totals.tax,
      totalAmount: totals.totalAmount,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      razorpayOrderId: rzpOrder.id,
      statusHistory: [
        {
          status: 'pending',
          note: 'Order placed — awaiting payment',
          timestamp: new Date(),
        },
      ],
      notes,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: order._id,
          orderNumber,
          razorpayOrderId: rzpOrder.id,
          amount: amountInPaise,
          currency: 'INR',
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Razorpay create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
