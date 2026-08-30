import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/products'), changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/pc-builder'), changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/policies/shipping'), changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/policies/refunds'), changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/policies/contact'), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    await dbConnect();
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt').lean<{ slug: string; updatedAt: Date }[]>(),
      Category.find({ isActive: true }).select('slug updatedAt').lean<{ slug: string; updatedAt: Date }[]>(),
    ]);

    return [
      ...staticPages,
      ...categories.map((category) => ({
        url: absoluteUrl(`/categories/${category.slug}`),
        lastModified: category.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      ...products.map((product) => ({
        url: absoluteUrl(`/products/${product.slug}`),
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error('Sitemap generation failed:', error);
    return staticPages;
  }
}
