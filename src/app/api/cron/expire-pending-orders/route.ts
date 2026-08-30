import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { expireStaleRazorpayOrders } from '@/lib/pendingOrders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const expired = await expireStaleRazorpayOrders();
    return NextResponse.json({ success: true, expired });
  } catch (error) {
    console.error('Expire pending Razorpay orders error:', error);
    return NextResponse.json({ success: false, error: 'Cleanup failed' }, { status: 500 });
  }
}
