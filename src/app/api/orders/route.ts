import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
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
  country: z.string().optional().default('US'),
  phone: z.string().min(1, 'Phone is required'),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.string().optional().default('cash_on_delivery'),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Build filter — admin sees all, customer sees own
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (payload.role !== 'admin') {
      filter.user = payload.userId;
    }
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
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
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { items, shippingAddress, paymentMethod, notes } = validation.data;

    // Verify stock and rebuild each line from the DB — never trust the
    // client-supplied price/name/image (prevents order-total tampering).
    let subtotal = 0;
    const serverItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.name}` },
          { status: 400 }
        );
      }
      if (!product.isActive) {
        return NextResponse.json(
          { success: false, error: `"${product.name}" is no longer available` },
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
      serverItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || '',
      });
    }

    const shippingCost = subtotal >= 100 ? 0 : 9.99;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const totalAmount = parseFloat((subtotal + shippingCost + tax).toFixed(2));

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: payload.userId,
      items: serverItems,
      shippingAddress,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      paymentMethod,
      statusHistory: [
        { status: 'pending', note: 'Order placed', timestamp: new Date() },
      ],
      notes,
    });

    // Decrement stock for each product
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    await order.populate('user', 'name email');

    return NextResponse.json(
      { success: true, data: order },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
