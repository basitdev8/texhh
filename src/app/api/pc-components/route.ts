import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import PCComponent from '@/models/PCComponent';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

const componentTypes = [
  'CPU', 'GPU', 'RAM', 'Storage', 'Motherboard', 'PSU', 'Case', 'Cooler',
] as const;

const createComponentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(componentTypes, { message: 'Invalid component type' }),
  brand: z.string().min(1, 'Brand is required'),
  price: z.number().min(0, 'Price must be positive'),
  image: z.string().optional().default(''),
  specifications: z.record(z.string(), z.string()).optional().default({}),
  compatibility: z.array(z.string()).optional().default([]),
  stock: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { isActive: true };

    if (type) filter.type = type;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const skip = (page - 1) * limit;
    const [components, total] = await Promise.all([
      PCComponent.find(filter)
        .sort({ type: 1, price: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PCComponent.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: components,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get components error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = createComponentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const component = await PCComponent.create(validation.data);

    return NextResponse.json(
      { success: true, data: component },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create component error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
