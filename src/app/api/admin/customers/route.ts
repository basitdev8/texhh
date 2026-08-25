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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25') || 25));
    const search = searchParams.get('search')?.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { role: 'customer' };
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Only the customers on this page need their order totals.
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: users.map((u) => u._id) } } },
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

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
