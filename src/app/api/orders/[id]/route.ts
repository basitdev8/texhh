import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  trackingNumber: z.string().max(120).nullable().optional(),
  carrier: z.string().max(120).nullable().optional(),
  // ISO date string (or null/empty to clear)
  estimatedDelivery: z.string().nullable().optional(),
  // Optional note attached to the status-history entry when status changes
  statusNote: z.string().max(300).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name slug images')
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Customers can only view their own orders
    if (
      payload.role !== 'admin' &&
      order.user._id.toString() !== payload.userId
    ) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view this order' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await dbConnect();

    // Verify admin
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const validation = updateOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      status,
      paymentStatus,
      trackingNumber,
      carrier,
      estimatedDelivery,
      statusNote,
    } = validation.data;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Record a timestamped history entry whenever the delivery status changes,
    // so the customer can see a real tracking timeline.
    if (status && status !== order.status) {
      order.statusHistory.push({
        status,
        note: statusNote,
        timestamp: new Date(),
      });
      order.status = status;
    } else if (statusNote && statusNote.trim()) {
      // A note added without a status change (e.g. an update from the courier).
      order.statusHistory.push({
        status: order.status,
        note: statusNote,
        timestamp: new Date(),
      });
    }

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber || undefined;
    if (carrier !== undefined) order.carrier = carrier || undefined;
    if (estimatedDelivery !== undefined) {
      order.estimatedDelivery = estimatedDelivery
        ? new Date(estimatedDelivery)
        : undefined;
    }

    await order.save();
    await order.populate('user', 'name email');

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
