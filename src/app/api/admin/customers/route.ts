import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const users = await User.find({ role: 'customer' })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    const orderCounts = await Order.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
    ]);
    const countMap = new Map<string, { count: number; totalSpent: number }>();
    for (const entry of orderCounts) {
      countMap.set(entry._id.toString(), {
        count: entry.count,
        totalSpent: entry.totalSpent,
      });
    }

    const enriched = users.map((u) => {
      const stats = countMap.get(u._id.toString());
      return {
        ...u,
        orderCount: stats?.count || 0,
        totalSpent: stats?.totalSpent || 0,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
