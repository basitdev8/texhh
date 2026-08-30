import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import Product from '@/models/Product';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getSettings, invalidateSettingsCache } from '@/lib/settings';

const updateSchema = z.object({
  freeShippingThreshold: z.number().min(0).max(10_000_000).optional(),
  flatShippingRate: z.number().min(0).max(100_000).optional(),
  gstRate: z.number().min(0).max(100).optional(),
  codEnabled: z.boolean().optional(),
  codMaxOrderAmount: z.number().min(0).max(1_000_000).optional(),
  bankTransferEnabled: z.boolean().optional(),
  shippingBannerText: z.string().max(300).optional(),
  heroProductId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  homeFeaturedProductIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(24).optional(),
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

    const data = validation.data;
    const isHomeCurationUpdate =
      Object.prototype.hasOwnProperty.call(data, 'heroProductId') ||
      Object.prototype.hasOwnProperty.call(data, 'homeFeaturedProductIds');

    if (isHomeCurationUpdate) {
      if (
        !Object.prototype.hasOwnProperty.call(data, 'heroProductId') ||
        !Object.prototype.hasOwnProperty.call(data, 'homeFeaturedProductIds')
      ) {
        return NextResponse.json(
          { success: false, error: 'Save the hero and home edit selections together.' },
          { status: 400 }
        );
      }
      const heroProductId = data.heroProductId ?? null;
      const homeFeaturedProductIds = data.homeFeaturedProductIds ?? [];
      const uniqueEditIds = [...new Set(homeFeaturedProductIds)];

      if (uniqueEditIds.length !== homeFeaturedProductIds.length) {
        return NextResponse.json(
          { success: false, error: 'A product can only appear once in the home edit.' },
          { status: 400 }
        );
      }
      if (heroProductId && uniqueEditIds.includes(heroProductId)) {
        return NextResponse.json(
          { success: false, error: 'The hero product cannot also appear in the home edit.' },
          { status: 400 }
        );
      }

      const selectedIds = heroProductId ? [heroProductId, ...uniqueEditIds] : uniqueEditIds;
      if (selectedIds.length > 0) {
        const activeCount = await Product.countDocuments({
          _id: { $in: selectedIds },
          isActive: true,
        });
        if (activeCount !== selectedIds.length) {
          return NextResponse.json(
            { success: false, error: 'Only active products can be shown on the homepage.' },
            { status: 400 }
          );
        }
      }

      data.homeFeaturedProductIds = uniqueEditIds;
      // Saving from the new curation screen retires the old shared featured flag.
      (data as Record<string, unknown>).homeFeatureSelectionConfigured = true;
    }

    await Settings.findOneAndUpdate(
      { key: 'store' },
      { $set: data },
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
