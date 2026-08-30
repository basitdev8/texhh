import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    await dbConnect();
    const category = await Category.findOne({ slug, isActive: true }).select('name description').lean<{
      name: string; description?: string;
    } | null>();
    if (category) {
      return {
        title: category.name,
        description: category.description || `Shop ${category.name} at TechChasers.`,
        alternates: { canonical: `/categories/${slug}` },
      };
    }
  } catch {
    // The page itself handles unavailable database data gracefully.
  }
  return { title: 'Category not found' };
}

export default async function CategoryRedirectPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    await dbConnect();
    const cat = await Category.findOne({ slug, isActive: true }).lean();
    if (cat) {
      redirect(`/products?category=${slug}`);
    }
  } catch {
    // fall through
  }

  return (
    <div className="container" style={{ padding: "var(--space-16) 0", textAlign: "center" }}>
      <h1>Category not found</h1>
      <p style={{ color: "var(--color-text-secondary)", marginTop: "var(--space-3)" }}>
        The category you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/products"
        style={{ display: "inline-block", marginTop: "var(--space-5)", color: "var(--color-accent)" }}
      >
        ← Browse all products
      </Link>
    </div>
  );
}
