/**
 * Additive catalogue import.
 *
 * Upserts categories, products and PC components by a stable key. It never deletes
 * anything and never touches the `users` or `orders` collections, so it is safe to run
 * against a live database.
 *
 *   npm run import-catalog            # dry run — prints what would change
 *   npm run import-catalog -- --write # applies the changes
 *
 * Product images are deliberately left empty: the storefront falls back to a
 * placeholder until real photography exists (see the own-catalogue ticket).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dbConnect from '../src/lib/db';
import Category from '../src/models/Category';
import Product from '../src/models/Product';
import PCComponent from '../src/models/PCComponent';
import { generateSlug } from '../src/lib/utils';

const WRITE = process.argv.includes('--write');
const FEATURED_COUNT = 8;

interface ScrapedProduct {
  name: string;
  brand: string;
  price: number | null;
  comparePrice: number | null;
  inStock: boolean;
  images: string[];
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  subcategorySlug: string;
  tags: string[];
}

interface ScrapedData {
  categories: { slug: string; name: string }[];
  products: ScrapedProduct[];
}

const SCRAPED_PATH = resolve(process.cwd(), 'data', 'astbharat.json');

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'tws-bluetooth':
    'A curated edit of true wireless earbuds — engineered for noise cancellation, all-day comfort, and effortless connectivity.',
  'bluetooth-speakers':
    'Portable and home Bluetooth speakers chosen for considered industrial design and honest sound.',
  'wireless-headphones':
    'Over-ear wireless headphones with active noise cancellation, premium drivers, and editorial silhouettes.',
  'professional-speakerphones':
    'Conference-grade speakerphones built for hybrid teams, clear voice pickup, and serious meeting rooms.',
  'professional-audio':
    'Studio-grade headsets and audio gear for professionals who care about every frequency.',
  smartwatches:
    'Wearables that read like watches first — analog cues, smart connectivity, materials worth keeping.',
  cameras:
    'Instant film cameras, mirrorless bodies, and lenses for image-makers who shoot with intention.',
  smartphones:
    'Flagship and editor-favourite smartphones from the brands shaping the next decade.',
  'video-conferencing':
    'Personal video bars, conference webcams, and meeting-room kit for distributed teams.',
  headphones: 'Closed-back, open-back, audiophile, and reference headphones in one tight edit.',
  'gaming-headphones':
    'Gaming-tuned headsets with surround processing, low-latency wireless, and game-ready comfort.',
};

const PC_COMPONENTS = [
  { name: 'AMD Ryzen 9 7950X', type: 'CPU', brand: 'AMD', price: 54999, specifications: { Cores: '16', Threads: '32', 'Base Clock': '4.5 GHz', Socket: 'AM5' }, stock: 12 },
  { name: 'Intel Core i9-14900K', type: 'CPU', brand: 'Intel', price: 56999, specifications: { Cores: '24', Threads: '32', 'Base Clock': '3.2 GHz', Socket: 'LGA1700' }, stock: 8 },
  { name: 'NVIDIA GeForce RTX 4090 Founders Edition', type: 'GPU', brand: 'NVIDIA', price: 169999, specifications: { VRAM: '24GB GDDR6X', 'Boost Clock': '2.52 GHz', Power: '450W' }, stock: 5 },
  { name: 'NVIDIA GeForce RTX 4080 Super', type: 'GPU', brand: 'NVIDIA', price: 109999, specifications: { VRAM: '16GB GDDR6X', 'Boost Clock': '2.55 GHz', Power: '320W' }, stock: 10 },
  { name: 'Corsair Vengeance RGB 32GB DDR5-6000', type: 'RAM', brand: 'Corsair', price: 12999, specifications: { Capacity: '32GB (2x16GB)', Speed: 'DDR5-6000', Latency: 'CL30' }, stock: 25 },
  { name: 'G.Skill Trident Z5 RGB 64GB DDR5-6400', type: 'RAM', brand: 'G.Skill', price: 24999, specifications: { Capacity: '64GB (2x32GB)', Speed: 'DDR5-6400', Latency: 'CL32' }, stock: 15 },
  { name: 'Samsung 990 Pro 2TB NVMe', type: 'Storage', brand: 'Samsung', price: 17999, specifications: { Capacity: '2TB', Interface: 'PCIe 4.0 NVMe', 'Read Speed': '7450 MB/s' }, stock: 20 },
  { name: 'WD Black SN850X 1TB NVMe', type: 'Storage', brand: 'Western Digital', price: 9999, specifications: { Capacity: '1TB', Interface: 'PCIe 4.0 NVMe', 'Read Speed': '7300 MB/s' }, stock: 30 },
  { name: 'ASUS ROG Strix X670E-E Gaming WiFi', type: 'Motherboard', brand: 'ASUS', price: 36999, specifications: { Socket: 'AM5', Chipset: 'X670E', Format: 'ATX' }, stock: 12 },
  { name: 'MSI MPG Z790 Carbon WiFi', type: 'Motherboard', brand: 'MSI', price: 39999, specifications: { Socket: 'LGA1700', Chipset: 'Z790', Format: 'ATX' }, stock: 10 },
  { name: 'Corsair RM1000x Shift 1000W', type: 'PSU', brand: 'Corsair', price: 18999, specifications: { Wattage: '1000W', Rating: '80+ Gold', Modular: 'Full' }, stock: 18 },
  { name: 'Seasonic Prime TX-850 Titanium 850W', type: 'PSU', brand: 'Seasonic', price: 21999, specifications: { Wattage: '850W', Rating: '80+ Titanium', Modular: 'Full' }, stock: 9 },
  { name: 'Lian Li O11 Dynamic Evo', type: 'Case', brand: 'Lian Li', price: 17999, specifications: { 'Form Factor': 'Mid Tower', Material: 'Aluminum / Tempered Glass' }, stock: 14 },
  { name: 'Fractal Design Meshify 2 Compact', type: 'Case', brand: 'Fractal Design', price: 12999, specifications: { 'Form Factor': 'Mid Tower', Material: 'Steel / Mesh' }, stock: 20 },
  { name: 'Noctua NH-D15 Air Cooler', type: 'Cooler', brand: 'Noctua', price: 9999, specifications: { Type: 'Air', Height: '165mm', Fans: '2x 140mm' }, stock: 22 },
  { name: 'Corsair iCUE H150i Elite LCD XT 360mm', type: 'Cooler', brand: 'Corsair', price: 28999, specifications: { Type: 'Liquid AIO', 'Radiator Size': '360mm', Display: 'IPS LCD' }, stock: 11 },
];

function loadScraped(): ScrapedData {
  if (!existsSync(SCRAPED_PATH)) {
    throw new Error(`Catalogue data not found at ${SCRAPED_PATH}`);
  }
  return JSON.parse(readFileSync(SCRAPED_PATH, 'utf-8')) as ScrapedData;
}

function shortDescription(p: ScrapedProduct): string {
  const text = (p.shortDescription || p.description || '').replace(/\s+/g, ' ').trim();
  if (text.length < 16) {
    return `${p.brand} ${p.name.replace(p.brand, '').trim() || 'electronics'} — handpicked for the TechChasers edit.`;
  }
  return text.slice(0, 220);
}

function longDescription(p: ScrapedProduct): string {
  const txt = (p.description || p.shortDescription || '').trim();
  if (txt.length < 32) {
    return `The ${p.name} from ${p.brand} — chosen for its build quality, refined sound, and editorial design language. Part of the TechChasers curated electronics edit.`;
  }
  return txt;
}

function sanitizeSpecs(specs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(specs || {})) {
    // Mongoose Map keys cannot contain "." or "$"
    const key = k.replace(/\./g, '·').replace(/\$/g, '').trim();
    const value = String(v).trim();
    if (key && value) out[key] = value.slice(0, 500);
  }
  return out;
}

/** Deterministic pseudo-random stock, so a dry run and the real run agree. */
function stockFor(name: string, inStock: boolean): number {
  if (!inStock) return 0;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 1000;
  return 5 + (hash % 25);
}

async function main() {
  const data = loadScraped();
  const masked = process.env.MONGODB_URI?.replace(/\/\/[^@]*@/, '//***@');

  console.log('');
  console.log(WRITE ? '▶ IMPORT (writing)' : '▶ IMPORT (dry run — nothing will be written)');
  console.log(`  database: ${masked}`);
  console.log(`  source:   data/astbharat.json (${data.products.length} products, ${data.categories.length} categories)`);
  console.log('');

  await dbConnect();

  // ── Categories ────────────────────────────────────────────────────────
  let catsInserted = 0;
  let catsExisting = 0;
  const categoryIdBySlug: Record<string, string> = {};

  for (const c of data.categories) {
    const existing = await Category.findOne({ slug: c.slug }).select('_id').lean<{ _id: unknown } | null>();
    if (existing) {
      catsExisting += 1;
      categoryIdBySlug[c.slug] = String(existing._id);
      continue;
    }
    catsInserted += 1;
    if (WRITE) {
      const created = await Category.create({
        name: c.name,
        slug: c.slug,
        description:
          CATEGORY_DESCRIPTIONS[c.slug] || `${c.name} — curated by the TechChasers atelier.`,
        image: '',
        isActive: true,
      });
      categoryIdBySlug[c.slug] = String(created._id);
    }
  }
  console.log(`📁 categories: ${catsExisting} already present, ${catsInserted} to create`);

  // ── Products ──────────────────────────────────────────────────────────
  const candidates = data.products.filter((p) => p.price && p.price > 0 && p.name);

  // Feature the priciest item in each category, up to the target count, so the
  // homepage has a spread rather than eight of the same thing.
  const byCategory = new Map<string, ScrapedProduct[]>();
  for (const p of candidates) {
    const list = byCategory.get(p.subcategorySlug) || [];
    list.push(p);
    byCategory.set(p.subcategorySlug, list);
  }
  const featuredNames = new Set<string>();
  for (const [, list] of [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (featuredNames.size >= FEATURED_COUNT) break;
    const top = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0];
    if (top) featuredNames.add(top.name);
  }

  let inserted = 0;
  let skipped = 0;
  const usedSlugs = new Set<string>();
  const samples: string[] = [];

  for (const p of candidates) {
    const slug = generateSlug(p.name).slice(0, 90);
    if (!slug) {
      skipped += 1;
      continue;
    }

    // A slug already in the database belongs to a product someone may have edited —
    // leave it exactly as it is.
    const existing = await Product.findOne({ slug }).select('_id').lean();
    if (existing || usedSlugs.has(slug)) {
      skipped += 1;
      continue;
    }
    usedSlugs.add(slug);

    const categoryId = categoryIdBySlug[p.subcategorySlug] || categoryIdBySlug[data.categories[0].slug];
    if (!categoryId && WRITE) {
      skipped += 1;
      continue;
    }

    inserted += 1;
    if (samples.length < 5) samples.push(`${p.name} (${p.brand}) ₹${p.price}`);

    if (WRITE) {
      await Product.create({
        name: p.name,
        slug,
        description: longDescription(p),
        shortDescription: shortDescription(p),
        price: p.price as number,
        comparePrice: p.comparePrice ?? undefined,
        category: categoryId,
        brand: p.brand || 'Unbranded',
        // Left empty on purpose — the storefront shows a placeholder until real
        // photography is uploaded through the admin panel.
        images: [],
        specifications: sanitizeSpecs(p.specifications || {}),
        stock: stockFor(p.name, p.inStock),
        featured: featuredNames.has(p.name),
        isActive: true,
        rating: 0,
        reviewCount: 0,
        tags: [p.brand, ...(p.tags || []), ...p.subcategorySlug.split('-')].filter(Boolean),
      });
    }
  }

  console.log(`🛍️  products:   ${inserted} to create, ${skipped} skipped (already present or unusable)`);
  console.log(`⭐ featured:   ${Math.min(featuredNames.size, FEATURED_COUNT)} products marked featured for the homepage`);
  if (samples.length > 0) {
    console.log('   e.g.');
    for (const s of samples) console.log(`     · ${s}`);
  }

  // ── PC components ─────────────────────────────────────────────────────
  let compInserted = 0;
  let compExisting = 0;
  for (const c of PC_COMPONENTS) {
    const existing = await PCComponent.findOne({ name: c.name, type: c.type }).select('_id').lean();
    if (existing) {
      compExisting += 1;
      continue;
    }
    compInserted += 1;
    if (WRITE) {
      await PCComponent.create({
        name: c.name,
        type: c.type,
        brand: c.brand,
        price: c.price,
        image: '',
        specifications: c.specifications,
        compatibility: [],
        stock: c.stock,
        isActive: true,
      });
    }
  }
  console.log(`🧩 components: ${compExisting} already present, ${compInserted} to create`);

  const [productTotal, categoryTotal, componentTotal] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    PCComponent.countDocuments(),
  ]);

  console.log('');
  if (WRITE) {
    console.log(`✅ done — catalogue now holds ${productTotal} products, ${categoryTotal} categories, ${componentTotal} components`);
  } else {
    console.log(`ℹ️  nothing written. Current totals: ${productTotal} products, ${categoryTotal} categories, ${componentTotal} components`);
    console.log('   Re-run with --write to apply:  npm run import-catalog -- --write');
  }
  console.log('');
  console.log('   Users and orders are never touched by this script.');
  console.log('');

  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
