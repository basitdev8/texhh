import type { Metadata } from 'next';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { absoluteUrl, jsonLd } from '@/lib/seo';

type PageProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

type SeoProduct = {
  _id: { toString(): string };
  name: string;
  slug: string;
  brand: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice?: number;
  images?: string[];
  stock: number;
  isActive: boolean;
  updatedAt: Date;
};

async function getProduct(slug: string): Promise<SeoProduct | null> {
  try {
    await dbConnect();
    return Product.findOne({ slug, isActive: true })
      .select('name slug brand description shortDescription price comparePrice images stock isActive updatedAt')
      .lean<SeoProduct | null>();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found' };

  const title = `${product.name} | TechChasers`;
  const description = product.shortDescription || product.description || `${product.name} at TechChasers.`;
  const image = product.images?.[0];

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/products/${product.slug}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/products/${product.slug}`),
      type: 'website',
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductSeoLayout({ children, params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return children;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product._id.toString(),
    brand: { '@type': 'Brand', name: product.brand || 'TechChasers' },
    image: product.images || [],
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: 'INR',
      price: product.price.toFixed(2),
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      {children}
    </>
  );
}
