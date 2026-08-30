import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
// Registers the User model so `populate('user')` cannot throw MissingSchemaError.
import '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';
import { getSettings } from '@/lib/settings';
import { computeTotals } from '@/lib/pricing';
import { resolveOrderItems, decrementStock, restoreStock } from '@/lib/orderItems';
import { sendOrderReceivedEmails } from '@/lib/email';

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

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['cash_on_delivery', 'bank_transfer']).default('cash_on_delivery'),
  notes: z.string().max(1000).optional(),
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10') || 10));
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    // Build filter — admin sees all, customer sees own
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (payload.role !== 'admin') {
      filter.user = payload.userId;
    }
    if (status) {
      filter.status = status;
    }
    // Admin order search is by order number — the one identifier a customer quotes.
    if (search) {
      filter.orderNumber = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
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
    const settings = await getSettings();

    if (paymentMethod === 'cash_on_delivery' && !settings.codEnabled) {
      return NextResponse.json(
        { success: false, error: 'Cash on delivery is currently unavailable' },
        { status: 400 }
      );
    }

    // Rebuild every line from the catalogue — client prices and names are never trusted.
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

    const totals = computeTotals(resolution.subtotal, settings);

    // Take stock first: if another order beat us to the last unit, no order is written.
    const stockResult = await decrementStock(resolution.items);
    if (!stockResult.ok) {
      await restoreStock(stockResult.taken);
      return NextResponse.json(
        {
          success: false,
          error: `"${stockResult.failed[0].name}" sold out while you were checking out.`,
          blockers: stockResult.failed.map((f) => ({
            product: f.product,
            name: f.name,
            kind: 'stock' as const,
            message: `"${f.name}" is no longer available in that quantity.`,
          })),
        },
        { status: 409 }
      );
    }

    try {
      const order = await Order.create({
        orderNumber: generateOrderNumber(),
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
        paymentMethod,
        statusHistory: [
          { status: 'pending', note: 'Order placed', timestamp: new Date() },
        ],
        notes,
      });

      await order.populate('user', 'name email');

      // A Resend failure is contained inside this helper, so a valid order is
      // never lost merely because mail delivery is temporarily unavailable.
      await sendOrderReceivedEmails(order);

      return NextResponse.json(
        { success: true, data: order, changes: resolution.changes },
        { status: 201 }
      );
    } catch (createError) {
      // The order never existed, so the stock we took has to go back.
      await restoreStock(stockResult.taken);
      throw createError;
    }
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
