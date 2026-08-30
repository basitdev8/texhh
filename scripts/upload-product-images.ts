/**
 * Uploads locally downloaded workbook images to Cloudinary and maps them to
 * their matching MongoDB products by slug.
 *
 * The manifest order becomes the Product.images order. The first image is
 * therefore the storefront's primary image.
 *
 *   npm run upload-product-images
 *   npm run upload-product-images -- --force
 *
 * Existing Cloudinary assets are reused by default. `--force` overwrites the
 * deterministic Cloudinary assets before updating the corresponding product.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import mongoose from 'mongoose';
import type { UploadApiResponse } from 'cloudinary';
import cloudinary from '../src/lib/cloudinary';
import dbConnect from '../src/lib/db';
import Product from '../src/models/Product';

const IMAGE_ROOT = resolve(process.cwd(), 'data/product-images');
const MANIFEST_PATH = resolve(IMAGE_ROOT, 'manifest.json');
const REPORT_PATH = resolve(IMAGE_ROOT, 'upload-report.json');
const FORCE = process.argv.includes('--force');
const CLOUDINARY_ROOT = 'techchasers/products';

interface ManifestImage {
  index: number;
  sourceName: string;
  localPath: string;
  bytes: number;
}

interface ManifestProduct {
  name: string;
  slug: string;
  images: ManifestImage[];
}

interface ImageUpload {
  localPath: string;
  publicId: string;
  url: string;
  status: 'uploaded' | 'reused';
}

interface ProductResult {
  slug: string;
  name: string;
  status: 'mapped' | 'failed';
  images?: ImageUpload[];
  error?: string;
}

function readManifest(): ManifestProduct[] {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`Image manifest not found: ${MANIFEST_PATH}. Run npm run download-product-images first.`);
  }
  const payload = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as { products?: ManifestProduct[] };
  if (!Array.isArray(payload.products) || !payload.products.length) {
    throw new Error('The image manifest contains no products.');
  }

  const seen = new Set<string>();
  for (const product of payload.products) {
    if (!product.slug || seen.has(product.slug)) throw new Error(`Invalid or duplicate product slug in image manifest: ${product.slug || '(blank)'}.`);
    if (!Array.isArray(product.images) || !product.images.length) throw new Error(`${product.slug} has no downloaded images in the image manifest.`);
    seen.add(product.slug);
    for (const image of product.images) {
      const imagePath = resolve(IMAGE_ROOT, image.localPath);
      if (!image.localPath || !existsSync(imagePath)) throw new Error(`${product.slug} is missing local image ${image.localPath}.`);
    }
  }
  return payload.products;
}

function publicIdFor(productSlug: string, localPath: string): string {
  const filename = basename(localPath);
  const stem = filename.slice(0, filename.length - extname(filename).length);
  return `${CLOUDINARY_ROOT}/${productSlug}/${stem}`;
}

async function existingAsset(publicId: string): Promise<UploadApiResponse | undefined> {
  try {
    return await cloudinary.api.resource(publicId, { resource_type: 'image', type: 'upload' }) as UploadApiResponse;
  } catch (error) {
    const statusCode = (error as { http_code?: number; error?: { http_code?: number } }).http_code
      ?? (error as { error?: { http_code?: number } }).error?.http_code;
    if (statusCode === 404) return undefined;
    throw error;
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  const cloudinaryMessage = (error as { error?: { message?: unknown } })?.error?.message;
  if (typeof cloudinaryMessage === 'string') return cloudinaryMessage;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function uploadImage(productSlug: string, image: ManifestImage): Promise<ImageUpload> {
  const localPath = resolve(IMAGE_ROOT, image.localPath);
  const publicId = publicIdFor(productSlug, image.localPath);
  const existing = !FORCE ? await existingAsset(publicId) : undefined;
  if (existing?.secure_url) {
    return { localPath: image.localPath, publicId, url: existing.secure_url, status: 'reused' };
  }

  const result = await cloudinary.uploader.upload(localPath, {
    public_id: publicId,
    resource_type: 'image',
    overwrite: FORCE,
    unique_filename: false,
    tags: ['techchasers', 'product-image', productSlug],
  });
  if (!result.secure_url) throw new Error(`Cloudinary did not return a secure URL for ${image.localPath}.`);
  return { localPath: image.localPath, publicId, url: result.secure_url, status: 'uploaded' };
}

function writeReport(results: ProductResult[]): void {
  writeFileSync(REPORT_PATH, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceManifest: 'data/product-images/manifest.json',
    force: FORCE,
    products: results,
  }, null, 2)}\n`);
}

async function main() {
  const manifestProducts = readManifest();
  await dbConnect();

  const databaseProducts = await Product.find({ slug: { $in: manifestProducts.map((product) => product.slug) } })
    .select('_id slug name')
    .lean<{ _id: mongoose.Types.ObjectId; slug: string; name: string }[]>();
  const productBySlug = new Map(databaseProducts.map((product) => [product.slug, product]));
  const results: ProductResult[] = [];

  console.log(`Mapping ${manifestProducts.length} product image sets to Cloudinary and MongoDB.`);
  for (const [index, manifestProduct] of manifestProducts.entries()) {
    process.stdout.write(`[${index + 1}/${manifestProducts.length}] ${manifestProduct.slug}... `);
    const databaseProduct = productBySlug.get(manifestProduct.slug);
    if (!databaseProduct) {
      const error = 'No database product matches this manifest slug.';
      results.push({ slug: manifestProduct.slug, name: manifestProduct.name, status: 'failed', error });
      console.log(`failed: ${error}`);
      continue;
    }

    try {
      const uploadedImages: ImageUpload[] = [];
      for (const image of [...manifestProduct.images].sort((a, b) => a.index - b.index)) {
        uploadedImages.push(await uploadImage(manifestProduct.slug, image));
      }
      await Product.updateOne({ _id: databaseProduct._id }, { $set: { images: uploadedImages.map((image) => image.url) } });
      const uploaded = uploadedImages.filter((image) => image.status === 'uploaded').length;
      const reused = uploadedImages.length - uploaded;
      results.push({ slug: manifestProduct.slug, name: manifestProduct.name, status: 'mapped', images: uploadedImages });
      console.log(`${uploadedImages.length} mapped (${uploaded} uploaded, ${reused} reused).`);
    } catch (error) {
      const message = errorMessage(error);
      results.push({ slug: manifestProduct.slug, name: manifestProduct.name, status: 'failed', error: message });
      console.log(`failed: ${message}`);
    }
  }

  writeReport(results);
  const mapped = results.filter((result) => result.status === 'mapped').length;
  const failed = results.length - mapped;
  console.log(`Finished: ${mapped} products mapped, ${failed} failed.`);
  console.log(`Report: ${REPORT_PATH}`);
  if (failed) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('Product image upload failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
