import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { computeTotals } from '@/lib/pricing';
import { resolveOrderItems } from '@/lib/orderItems';

const validateSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string().min(1),
        itemType: z.enum(['product', 'component']).optional(),
        name: z.string().optional(),
        price: z.number().min(0).optional(),
        quantity: z.number().int().min(1),
      })
    )
    .max(100),
});

/**
 * Re-prices a cart against the catalogue so the customer sees the total the server
 * would actually charge. The cart lives in localStorage and can sit there for weeks,
 * so prices, stock and availability all have to be re-checked before payment.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = validateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid cart payload' },
        { status: 400 }
      );
    }

    const resolution = await resolveOrderItems(validation.data.items);
    const settings = await getSettings();
    const totals = computeTotals(resolution.subtotal, settings);

    return NextResponse.json({
      success: true,
      data: {
        items: resolution.items.map((i) => ({
          productId: i.product,
          itemType: i.itemType,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          maxStock: i.stock,
        })),
        changes: resolution.changes,
        blockers: resolution.blockers,
        totals,
        settings,
      },
    });
  } catch (error) {
    console.error('Validate cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
