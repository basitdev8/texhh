import Order from '@/models/Order';
import { decrementStock } from '@/lib/orderItems';
import type { IOrderDocument } from '@/models/Order';

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
  const stockResult = await decrementStock(
    order.items.map((item: IOrderDocument['items'][number]) => ({
      product: String(item.product),
      itemType: item.itemType === 'component' ? 'component' as const : 'product' as const,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      stock: 0,
    }))
  );

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
  }

  return { transitioned: true, order };
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
