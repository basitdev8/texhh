import Link from "next/link";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";

interface PageProps {
  params: Promise<{ slug: string }>;
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
