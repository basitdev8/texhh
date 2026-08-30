import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { expireStaleRazorpayOrders } from '@/lib/pendingOrders';

export async function GET(request: NextRequest) {
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

    const LOW_STOCK_THRESHOLD = 5;
    // The cron runs daily on Vercel's free plan; this keeps the dashboard clean
    // sooner whenever an admin opens it.
    await expireStaleRazorpayOrders();

    // Gather all stats in parallel
    const [
      totalRevenueAgg,
      orderCount,
      productCount,
      customerCount,
      recentOrders,
      ordersByStatus,
      pendingPayments,
      lowStock,
      outOfStock,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ paymentStatus: { $ne: 'abandoned' } }),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      Order.find({ paymentStatus: { $ne: 'abandoned' } })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Order.aggregate([
        { $match: { paymentStatus: { $ne: 'abandoned' } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Product.find({ isActive: true, stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } })
        .select('name slug stock')
        .sort({ stock: 1 })
        .limit(8)
        .lean(),
      Product.countDocuments({ isActive: true, stock: 0 }),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // Transform ordersByStatus into a readable object
    const statusBreakdown: Record<string, number> = {};
    for (const entry of ordersByStatus) {
      statusBreakdown[entry._id] = entry.count;
    }

    // Orders that need operational attention (placed/paid but not yet shipped).
    const ordersToFulfill =
      (statusBreakdown.pending || 0) + (statusBreakdown.processing || 0);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        orderCount,
        productCount,
        customerCount,
        statusBreakdown,
        recentOrders,
        ordersToFulfill,
        pendingPayments,
        outOfStock,
        lowStock,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
