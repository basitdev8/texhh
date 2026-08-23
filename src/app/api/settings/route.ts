import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getSettings, invalidateSettingsCache } from '@/lib/settings';

const updateSchema = z.object({
  freeShippingThreshold: z.number().min(0).max(10_000_000).optional(),
  flatShippingRate: z.number().min(0).max(100_000).optional(),
  gstRate: z.number().min(0).max(100).optional(),
  codEnabled: z.boolean().optional(),
  shippingBannerText: z.string().max(300).optional(),
});

// Public: the storefront needs the shipping rule to show the same total the
// server will charge, and the COD flag to decide which payment options to offer.
export async function GET() {
  try {
    await dbConnect();
    const settings = await getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    await Settings.findOneAndUpdate(
      { key: 'store' },
      { $set: validation.data },
      { new: true, upsert: true }
    );
    invalidateSettingsCache();

    return NextResponse.json({ success: true, data: await getSettings() });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
