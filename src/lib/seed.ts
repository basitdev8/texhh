import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dbConnect from './db';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import PCComponent from '../models/PCComponent';
import { hashPassword } from './auth';
import { generateSlug } from './utils';

interface ScrapedProduct {
  url: string;
  name: string;
  brand: string;
  price: number | null;
  comparePrice: number | null;
  sku: string | null;
  inStock: boolean;
  images: string[];
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  subcategorySlug: string;
  categoryPath: string[];
  tags: string[];
}

interface ScrapedData {
  categories: { slug: string; name: string }[];
  products: ScrapedProduct[];
}

const SCRAPED_PATH = resolve(__dirname, '..', '..', 'data', 'astbharat.json');

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

// Generic stock photo for each subcategory (Unsplash, free use)
const CATEGORY_IMAGES: Record<string, string> = {
  'tws-bluetooth': 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=80',
  'bluetooth-speakers': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80',
  'wireless-headphones': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
  'professional-speakerphones': 'https://images.unsplash.com/photo-1611174743420-3d7df880ce32?auto=format&fit=crop&w=1200&q=80',
  'professional-audio': 'https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1200&q=80',
  smartwatches: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
  cameras: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80',
  smartphones: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80',
  'video-conferencing': 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80',
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  'gaming-headphones': 'https://images.unsplash.com/photo-1591105575633-922c8897af9a?auto=format&fit=crop&w=1200&q=80',
};

function loadScraped(): ScrapedData {
  if (!existsSync(SCRAPED_PATH)) {
    throw new Error(
      `Scraped data not found at ${SCRAPED_PATH}. Run \`node scripts/scrape-astbharat.mjs\` first.`
    );
  }
  return JSON.parse(readFileSync(SCRAPED_PATH, 'utf-8')) as ScrapedData;
}

function makeShortDescription(p: ScrapedProduct): string {
  const text = (p.shortDescription || p.description || '').replace(/\s+/g, ' ').trim();
  if (text.length < 16) {
    return `${p.brand} ${p.name.replace(p.brand, '').trim() || 'electronics'} — handpicked for the TechHH edit.`;
  }
  return text.slice(0, 220);
}

function makeLongDescription(p: ScrapedProduct): string {
  let txt = (p.description || p.shortDescription || '').trim();
  if (txt.length < 32) {
    txt = `The ${p.name} from ${p.brand} — chosen for its build quality, refined sound, and editorial design language. Part of the TechHH curated electronics edit.`;
  }
  return txt;
}

function sanitizeSpecs(
  specs: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(specs || {})) {
    // Mongoose Map keys cannot contain "." or "$"
    const cleanKey = k.replace(/\./g, '·').replace(/\$/g, '').trim();
    const cleanVal = String(v).trim();
    if (cleanKey && cleanVal) out[cleanKey] = cleanVal.slice(0, 500);
  }
  return out;
}

function uniqueImages(images: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of images) {
    const clean = u.split('?')[0];
    if (!seen.has(clean)) {
      seen.add(clean);
      out.push(u);
    }
  }
  return out.slice(0, 8);
}

async function seed() {
  await dbConnect();
  console.log('🌱 Connected to MongoDB. Starting seed...\n');

  const data = loadScraped();
  console.log(`📦 Loaded ${data.products.length} products / ${data.categories.length} categories from astbharat.json`);

  // Clear existing data
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await PCComponent.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Admin
  const adminPassword = await hashPassword('admin123');
  await User.create({
    name: 'TechHH Admin',
    email: 'admin@techhh.com',
    passwordHash: adminPassword,
    role: 'admin',
    phone: '+91-90000-00000',
  });
  console.log('👤 Admin created: admin@techhh.com / admin123');

  // Demo customer
  const customerPassword = await hashPassword('customer123');
  await User.create({
    name: 'Aarav Mehta',
    email: 'customer@techhh.com',
    passwordHash: customerPassword,
    role: 'customer',
    phone: '+91-98765-43210',
    addresses: [
      {
        fullName: 'Aarav Mehta',
        street: '21 Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400050',
        country: 'IN',
        phone: '+91-98765-43210',
        isDefault: true,
      },
    ],
  });
  console.log('👤 Demo customer created: customer@techhh.com / customer123');

  // Categories
  const categoryDocs = data.categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    description:
      CATEGORY_DESCRIPTIONS[c.slug] || `${c.name} — curated by the TechHH atelier.`,
    image: CATEGORY_IMAGES[c.slug] || CATEGORY_IMAGES['headphones'],
    isActive: true,
  }));
  const createdCategories = await Category.insertMany(categoryDocs);
  console.log(`📁 Created ${createdCategories.length} categories`);

  const catBySlug: Record<string, string> = {};
  for (const c of createdCategories) {
    catBySlug[c.slug] = c._id.toString();
  }

  // Products — feature one per category
  const featuredSet = new Set<string>();

  const productDocs = data.products
    .filter((p) => p.price && p.price > 0 && p.name)
    .map((p, i) => {
      const slug = generateSlug(p.name);
      const categoryId = catBySlug[p.subcategorySlug] || catBySlug['headphones'];
      const shouldFeature =
        !featuredSet.has(p.subcategorySlug) && p.images.length > 0;
      if (shouldFeature) featuredSet.add(p.subcategorySlug);

      return {
        name: p.name,
        slug: `${slug}-${(i + 1).toString(36)}`, // ensures uniqueness even if names clash
        description: makeLongDescription(p),
        shortDescription: makeShortDescription(p),
        price: p.price as number,
        comparePrice: p.comparePrice ?? undefined,
        category: categoryId,
        brand: p.brand || 'Unbranded',
        images: uniqueImages(p.images),
        specifications: sanitizeSpecs(p.specifications || {}),
        stock: p.inStock ? Math.floor(Math.random() * 25) + 5 : 0,
        featured: shouldFeature,
        isActive: true,
        rating: Number((4 + Math.random()).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 800) + 40,
        tags: [
          p.brand,
          ...p.tags,
          ...(p.subcategorySlug.split('-')),
        ].filter(Boolean),
      };
    });

  // Drop any with duplicate slug (defensive)
  const usedSlugs = new Set<string>();
  const safeDocs = productDocs.filter((p) => {
    if (usedSlugs.has(p.slug)) return false;
    usedSlugs.add(p.slug);
    return true;
  });

  const createdProducts = await Product.insertMany(safeDocs);
  console.log(`🛍️  Created ${createdProducts.length} products`);

  // ─── Sample PC components — keep the PC Builder usable ────────────────
  const pcComponents = [
    { name: 'AMD Ryzen 9 7950X', type: 'CPU', brand: 'AMD', price: 54999, image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80', specifications: { Cores: '16', Threads: '32', 'Base Clock': '4.5 GHz', Socket: 'AM5' }, stock: 12 },
    { name: 'Intel Core i9-14900K', type: 'CPU', brand: 'Intel', price: 56999, image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=900&q=80', specifications: { Cores: '24', Threads: '32', 'Base Clock': '3.2 GHz', Socket: 'LGA1700' }, stock: 8 },
    { name: 'NVIDIA GeForce RTX 4090 Founders Edition', type: 'GPU', brand: 'NVIDIA', price: 169999, image: 'https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=900&q=80', specifications: { VRAM: '24GB GDDR6X', 'Boost Clock': '2.52 GHz', Power: '450W' }, stock: 5 },
    { name: 'NVIDIA GeForce RTX 4080 Super', type: 'GPU', brand: 'NVIDIA', price: 109999, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=900&q=80', specifications: { VRAM: '16GB GDDR6X', 'Boost Clock': '2.55 GHz', Power: '320W' }, stock: 10 },
    { name: 'Corsair Vengeance RGB 32GB DDR5-6000', type: 'RAM', brand: 'Corsair', price: 12999, image: 'https://images.unsplash.com/photo-1592664474506-f005c533e2bf?auto=format&fit=crop&w=900&q=80', specifications: { Capacity: '32GB (2x16GB)', Speed: 'DDR5-6000', Latency: 'CL30' }, stock: 25 },
    { name: 'G.Skill Trident Z5 RGB 64GB DDR5-6400', type: 'RAM', brand: 'G.Skill', price: 24999, image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=80', specifications: { Capacity: '64GB (2x32GB)', Speed: 'DDR5-6400', Latency: 'CL32' }, stock: 15 },
    { name: 'Samsung 990 Pro 2TB NVMe', type: 'Storage', brand: 'Samsung', price: 17999, image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80', specifications: { Capacity: '2TB', Interface: 'PCIe 4.0 NVMe', 'Read Speed': '7450 MB/s' }, stock: 20 },
    { name: 'WD Black SN850X 1TB NVMe', type: 'Storage', brand: 'Western Digital', price: 9999, image: 'https://images.unsplash.com/photo-1591489630450-2c5f0c6ed5f1?auto=format&fit=crop&w=900&q=80', specifications: { Capacity: '1TB', Interface: 'PCIe 4.0 NVMe', 'Read Speed': '7300 MB/s' }, stock: 30 },
    { name: 'ASUS ROG Strix X670E-E Gaming WiFi', type: 'Motherboard', brand: 'ASUS', price: 36999, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80', specifications: { Socket: 'AM5', Chipset: 'X670E', Format: 'ATX' }, stock: 12 },
    { name: 'MSI MPG Z790 Carbon WiFi', type: 'Motherboard', brand: 'MSI', price: 39999, image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80', specifications: { Socket: 'LGA1700', Chipset: 'Z790', Format: 'ATX' }, stock: 10 },
    { name: 'Corsair RM1000x Shift 1000W', type: 'PSU', brand: 'Corsair', price: 18999, image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=900&q=80', specifications: { Wattage: '1000W', Rating: '80+ Gold', Modular: 'Full' }, stock: 18 },
    { name: 'Seasonic Prime TX-850 Titanium 850W', type: 'PSU', brand: 'Seasonic', price: 21999, image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80', specifications: { Wattage: '850W', Rating: '80+ Titanium', Modular: 'Full' }, stock: 9 },
    { name: 'Lian Li O11 Dynamic Evo', type: 'Case', brand: 'Lian Li', price: 17999, image: 'https://images.unsplash.com/photo-1587202372583-49330a15584d?auto=format&fit=crop&w=900&q=80', specifications: { 'Form Factor': 'Mid Tower', Material: 'Aluminum / Tempered Glass' }, stock: 14 },
    { name: 'Fractal Design Meshify 2 Compact', type: 'Case', brand: 'Fractal Design', price: 12999, image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=900&q=80', specifications: { 'Form Factor': 'Mid Tower', Material: 'Steel / Mesh' }, stock: 20 },
    { name: 'Noctua NH-D15 Air Cooler', type: 'Cooler', brand: 'Noctua', price: 9999, image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=80', specifications: { Type: 'Air', Height: '165mm', Fans: '2x 140mm' }, stock: 22 },
    { name: 'Corsair iCUE H150i Elite LCD XT 360mm', type: 'Cooler', brand: 'Corsair', price: 28999, image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=900&q=80', specifications: { Type: 'Liquid AIO', 'Radiator Size': '360mm', Display: 'IPS LCD' }, stock: 11 },
  ];

  await PCComponent.insertMany(pcComponents);
  console.log(`🧩 Created ${pcComponents.length} PC components`);

  console.log('\n✅ Seed complete.\n');
  console.log('   Login as admin:    admin@techhh.com / admin123');
  console.log('   Login as customer: customer@techhh.com / customer123');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
