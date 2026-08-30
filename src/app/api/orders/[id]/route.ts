import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
// Registers the User model so `populate('user')` cannot throw MissingSchemaError.
import '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { sendOrderPaymentReceivedEmail, sendOrderStatusEmail } from '@/lib/email';

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  trackingNumber: z.string().max(120).nullable().optional(),
  carrier: z.string().max(120).nullable().optional(),
  // ISO date string (or null/empty to clear)
  estimatedDelivery: z
    .string()
    .nullable()
    .optional()
    .refine(
      (v) => v == null || v === '' || !Number.isNaN(Date.parse(v)),
      'Estimated delivery must be a valid date'
    ),
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
    // A malformed id would otherwise throw a cast error and surface as a 500.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Order lines carry their own name/price/image snapshot, and a line can point at
    // either catalogue, so the product refs are deliberately not populated here.
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Customers can only view their own orders. `user` is null when the account was
    // deleted, which must not crash the page — treat it as not yours.
    const ownerId =
      order.user && typeof order.user === 'object' && '_id' in order.user
        ? String((order.user as { _id: unknown })._id)
        : order.user
          ? String(order.user)
          : null;

    if (payload.role !== 'admin' && ownerId !== payload.userId) {
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

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

    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;
    const previousTrackingNumber = order.trackingNumber || '';
    const previousCarrier = order.carrier || '';
    const previousEstimatedDelivery = order.estimatedDelivery?.toISOString() || '';

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

    const statusChanged = order.status !== previousStatus;
    const shipmentDetailsChanged =
      order.trackingNumber !== previousTrackingNumber ||
      order.carrier !== previousCarrier ||
      (order.estimatedDelivery?.toISOString() || '') !== previousEstimatedDelivery;

    if (order.paymentStatus === 'paid' && previousPaymentStatus !== 'paid') {
      await sendOrderPaymentReceivedEmail(order);
    }

    if (
      statusChanged ||
      (order.status === 'shipped' && shipmentDetailsChanged)
    ) {
      await sendOrderStatusEmail(order, order.status);
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
