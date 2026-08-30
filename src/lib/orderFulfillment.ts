import Order from '@/models/Order';
import razorpay from '@/lib/razorpay';
import { decrementStock, restoreStock, type ResolvedItem } from '@/lib/orderItems';
import type { IOrderDocument } from '@/models/Order';
import { sendPaidOrderEmails } from '@/lib/email';

function resolvedItems(order: IOrderDocument): ResolvedItem[] {
  return order.items.map((item: IOrderDocument['items'][number]) => ({
    product: String(item.product),
    itemType: item.itemType === 'component' ? 'component' as const : 'product' as const,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    stock: 0,
  }));
}

/**
 * Atomically transition a Razorpay order to `paid` and decrement stock.
 *
 * Both the browser verify call and the server-side webhook can race to
 * confirm the same payment. The conditional update (`paymentStatus != paid`)
 * guarantees only ONE caller wins the transition, so stock is decremented
 * exactly once. The loser gets `transitioned: false` and does nothing.
 */
export async function fulfillPaidOrder(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
}): Promise<{ transitioned: boolean; order: IOrderDocument | null }> {
  const order = await Order.findOneAndUpdate(
    {
      razorpayOrderId: params.razorpayOrderId,
      paymentStatus: { $ne: 'paid' },
    },
    {
      $set: {
        paymentStatus: 'paid',
        status: 'processing',
        razorpayPaymentId: params.razorpayPaymentId,
      },
      $push: {
        statusHistory: {
          status: 'processing',
          note: 'Payment confirmed — order is now processing',
          timestamp: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!order) {
    // Already paid (another caller won) or the order doesn't exist.
    const existing = await Order.findOne({
      razorpayOrderId: params.razorpayOrderId,
    });
    return { transitioned: false, order: existing };
  }

  // We won the transition — decrement stock once, atomically, against whichever
  // catalogue each line came from.
  const stockResult = await decrementStock(resolvedItems(order));

  // The payment is already captured, so an oversold line cannot undo the order —
  // it needs a human. Log loudly rather than failing the request.
  if (!stockResult.ok) {
    console.error(
      `Order ${order.orderNumber} paid but oversold:`,
      stockResult.failed.map((f) => `${f.name} x${f.quantity}`).join(', ')
    );
    order.statusHistory.push({
      status: order.status,
      note: `Stock shortfall on: ${stockResult.failed.map((f) => f.name).join(', ')} — needs manual review`,
      timestamp: new Date(),
    });
    await order.save();
  } else {
    order.stockReservationState = 'reserved';
    order.stockReservedAt = new Date();
    await order.save();
  }

  // This function is called by both the browser verification flow and the
  // authoritative Razorpay webhook. Only the caller that won the paid-state
  // transition reaches here, so the customer gets one confirmation email.
  await sendPaidOrderEmails(order);

  return { transitioned: true, order };
}

/**
 * Reserve stock only once when an offline-payment order is confirmed by an
 * admin. A conditional state transition prevents two admin requests from
 * decrementing the same order twice.
 */
export async function reserveOrderStock(orderId: string): Promise<{
  ok: boolean;
  order: IOrderDocument | null;
  error?: string;
}> {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, stockReservationState: 'unreserved', status: { $ne: 'cancelled' } },
    { $set: { stockReservationState: 'reserving' } },
    { new: true }
  );

  if (!order) {
    const existing = await Order.findById(orderId);
    if (!existing) return { ok: false, order: null, error: 'Order not found' };
    if (existing.stockReservationState === 'reserved') return { ok: true, order: existing };
    return { ok: false, order: existing, error: 'Stock is already being updated for this order' };
  }

  const stockResult = await decrementStock(resolvedItems(order));
  if (!stockResult.ok) {
    await restoreStock(stockResult.taken);
    order.stockReservationState = 'unreserved';
    await order.save();
    return {
      ok: false,
      order,
      error: `Cannot confirm: "${stockResult.failed[0]?.name || 'an item'}" no longer has enough stock.`,
    };
  }

  order.stockReservationState = 'reserved';
  order.stockReservedAt = new Date();
  await order.save();
  return { ok: true, order };
}

/** Releases reserved stock once. A cancellation retry cannot return stock twice. */
export async function releaseOrderStock(orderId: string): Promise<{
  released: boolean;
  error?: string;
}> {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, stockReservationState: 'reserved' },
    { $set: { stockReservationState: 'releasing' } },
    { new: true }
  );

  if (!order) return { released: false };

  try {
    await restoreStock(resolvedItems(order));
    order.stockReservationState = 'released';
    order.stockReleasedAt = new Date();
    await order.save();
    return { released: true };
  } catch (error) {
    order.stockReservationState = 'reserved';
    await order.save();
    console.error(`Could not restore stock for order ${order.orderNumber}:`, error);
    return { released: false, error: 'Could not restore stock. Please retry.' };
  }
}

/** Cancel an order once, then release any stock that had been reserved for it. */
export async function cancelOrder(params: {
  orderId: string;
  note: string;
}): Promise<{
  cancelled: boolean;
  order: IOrderDocument | null;
  releaseError?: string;
}> {
  const order = await Order.findOneAndUpdate(
    { _id: params.orderId, status: { $ne: 'cancelled' } },
    {
      $set: { status: 'cancelled' },
      $push: {
        statusHistory: {
          status: 'cancelled',
          note: params.note,
          timestamp: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!order) {
    return { cancelled: false, order: await Order.findById(params.orderId) };
  }

  const release = await releaseOrderStock(String(order._id));
  return { cancelled: true, order, releaseError: release.error };
}

/**
 * Refund paid orders once. Razorpay orders are refunded through the provider;
 * COD/bank transfers are deliberately labelled offline for the admin to settle.
 */
export async function refundOrder(orderId: string): Promise<{
  ok: boolean;
  order: IOrderDocument | null;
  error?: string;
}> {
  const order = await Order.findById(orderId);
  if (!order) return { ok: false, order: null, error: 'Order not found' };
  if (order.paymentStatus === 'refunded') return { ok: true, order };
  if (order.paymentStatus !== 'paid') {
    return { ok: false, order, error: 'Only paid orders can be refunded' };
  }

  if (order.paymentMethod !== 'razorpay') {
    order.paymentStatus = 'refunded';
    order.refundState = 'offline';
    await order.save();
    return { ok: true, order };
  }

  if (!order.razorpayPaymentId) {
    return { ok: false, order, error: 'Missing Razorpay payment ID; refund this order in Razorpay dashboard.' };
  }

  const claimed = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: 'paid',
      $or: [{ refundState: 'none' }, { refundState: { $exists: false } }],
    },
    { $set: { refundState: 'processing' } },
    { new: true }
  );

  if (!claimed) {
    const existing = await Order.findById(orderId);
    if (existing?.paymentStatus === 'refunded') return { ok: true, order: existing };
    return { ok: false, order: existing, error: 'A refund is already being processed for this order' };
  }

  try {
    const refund = await razorpay.payments.refund(claimed.razorpayPaymentId!, {
      amount: Math.round(claimed.totalAmount * 100),
      notes: { orderNumber: claimed.orderNumber },
    });

    claimed.paymentStatus = 'refunded';
    claimed.refundState = 'initiated';
    claimed.razorpayRefundId = refund.id;
    claimed.statusHistory.push({
      status: claimed.status,
      note: `Refund initiated via Razorpay (${refund.id})`,
      timestamp: new Date(),
    });
    await claimed.save();
    return { ok: true, order: claimed };
  } catch (error) {
    claimed.refundState = 'none';
    await claimed.save();
    console.error(`Razorpay refund failed for ${claimed.orderNumber}:`, error);
    return { ok: false, order: claimed, error: 'Razorpay could not start the refund. Please retry.' };
  }
}

/**
 * Mark a Razorpay order as failed, but never overwrite a paid order
 * (a late `payment.failed` must not undo a successful capture).
 */
export async function markOrderFailed(razorpayOrderId: string): Promise<void> {
  await Order.findOneAndUpdate(
    { razorpayOrderId, paymentStatus: { $ne: 'paid' } },
    { $set: { paymentStatus: 'failed' } }
  );
}
