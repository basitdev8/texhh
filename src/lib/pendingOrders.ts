import Order from '@/models/Order';

const PENDING_PAYMENT_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Pending Razorpay checkout records are not real orders until payment is
 * captured. Keep them visible to the customer, but remove them from operations
 * after the checkout has been idle for thirty minutes.
 */
export async function expireStaleRazorpayOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_PAYMENT_MAX_AGE_MS);
  const result = await Order.updateMany(
    {
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      razorpayPaymentId: { $exists: false },
      createdAt: { $lt: cutoff },
    },
    {
      $set: { paymentStatus: 'abandoned' },
      $push: {
        statusHistory: {
          status: 'pending',
          note: 'Payment checkout expired after 30 minutes',
          timestamp: new Date(),
        },
      },
    }
  );

  return result.modifiedCount;
}
