import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import razorpay from '@/lib/razorpay';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';

const orderItemSchema = z.object({
  product: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  image: z.string().optional().default(''),
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
  notes: z.string().optional(),
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
    const validation = createPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { items, shippingAddress, notes } = validation.data;

    // Verify stock and compute the authoritative total server-side —
    // never trust amounts sent by the client.
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.name}` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }
      subtotal += product.price * item.quantity;
    }

    const shippingCost = subtotal >= 100 ? 0 : 9.99;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const totalAmount = parseFloat((subtotal + shippingCost + tax).toFixed(2));
    const amountInPaise = Math.round(totalAmount * 100);

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
      items,
      shippingAddress,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      razorpayOrderId: rzpOrder.id,
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
