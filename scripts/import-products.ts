/**
 * Replaces the catalogue with the products in data/products.xlsx.
 *
 * The workbook's Product_Sheet contains grouped rows: a numbered row starts a
 * product and the following rows are its highlights. product_Specs is optional
 * detail for the first two products.
 *
 *   npm run import-products                 # validate and preview
 *   npm run import-products -- --replace    # replace the product catalogue
 *   npm run import-products -- --replace --default-stock=3
 *
 * `--replace` removes Product records and only the categories previously used
 * by those products. It never changes users, orders, settings, or PC components.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import mongoose from 'mongoose';
import dbConnect from '../src/lib/db';
import Category from '../src/models/Category';
import Product from '../src/models/Product';
import { generateSlug } from '../src/lib/utils';

const WORKBOOK_PATH = resolve(process.cwd(), 'data/products.xlsx');
const REPLACE = process.argv.includes('--replace');
const stockArgument = process.argv.find((arg) => arg.startsWith('--default-stock='));
const DEFAULT_STOCK = stockArgument ? Number(stockArgument.split('=')[1]) : 0;

interface SpreadsheetProduct {
  sourceRow: number;
  serial: string;
  name: string;
  categoryName: string;
  price: number;
  comparePrice?: number;
  highlights: string[];
  specifications: Record<string, string>;
}

type Worksheet = Map<number, Map<number, string>>;

function readXlsxEntry(entry: string): string {
  try {
    return execFileSync('unzip', ['-p', WORKBOOK_PATH, entry], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    throw new Error(`Could not read ${entry} from ${WORKBOOK_PATH}. Ensure the file is a valid .xlsx workbook.`);
  }
}

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function xmlText(xml: string): string {
  return decodeXml([...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => match[1]).join(''));
}

function attr(xml: string, name: string): string | undefined {
  return xml.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function columnIndex(reference: string): number {
  const letters = reference.match(/[A-Z]+/i)?.[0];
  if (!letters) throw new Error(`Invalid worksheet cell reference: ${reference}`);
  return [...letters.toUpperCase()].reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function sharedStrings(): string[] {
  const xml = readXlsxEntry('xl/sharedStrings.xml');
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => xmlText(match[1]));
}

function worksheet(entry: string, strings: string[]): Worksheet {
  const xml = readXlsxEntry(entry);
  const rows: Worksheet = new Map();

  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(attr(rowMatch[1], 'r'));
    if (!Number.isInteger(rowNumber)) continue;
    const cells = new Map<number, string>();

    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const reference = attr(cellMatch[1], 'r');
      if (!reference) continue;
      const value = xmlText(cellMatch[2]) || decodeXml(cellMatch[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] || '');
      const text = attr(cellMatch[1], 't') === 's' ? strings[Number(value)] || '' : value;
      cells.set(columnIndex(reference), text.trim());
    }

    rows.set(rowNumber, cells);
  }

  return rows;
}

function parseMoney(value: string, label: string, row: number): number {
  const number = Number(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Row ${row}: ${label} must be a positive price; received "${value || 'blank'}".`);
  }
  return number;
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isSectionHeading(value: string): boolean {
  return new Set([
    'navigation features',
    'multimedia features',
    'battery features',
    'general',
    'dimensions',
    'display features',
    'business features',
    'product details',
    'camera features',
    'connectivity features',
    'storage features',
  ]).has(normalized(value));
}

function readSpecifications(specSheet: Worksheet, products: SpreadsheetProduct[]): void {
  const headers = specSheet.get(2);
  if (!headers) return;

  for (const [column, header] of headers) {
    if (!header) continue;
    const sourceName = normalized(header.replace(/^specification\s*\(?|^specs[_\s-]*/i, ''));
    let product = products.find((candidate) => normalized(candidate.name).includes(sourceName));

    // The second provided header is abbreviated ("Specs_OnePlus pad 2 12/256").
    // Its distinctive words still identify the intended product.
    if (!product) {
      const tokens = sourceName.split(' ').filter((token) => token.length >= 3);
      product = products.find((candidate) => tokens.filter((token) => normalized(candidate.name).includes(token)).length >= 2);
    }
    if (!product) continue;

    const values = [...specSheet.entries()]
      .filter(([row]) => row > 2)
      .sort(([a], [b]) => a - b)
      .map(([, cells]) => cells.get(column) || '')
      .filter(Boolean);

    for (let index = 0; index < values.length - 1; ) {
      const key = values[index];
      const value = values[index + 1];
      if (isSectionHeading(key)) {
        index += 1;
      } else if (value && !isSectionHeading(value)) {
        const safeKey = key.replace(/[.$]/g, '').trim().slice(0, 120);
        if (safeKey && value.length <= 500) product.specifications[safeKey] = value;
        index += 2;
      } else {
        index += 1;
      }
    }
  }
}

function brandFor(name: string): string {
  const brands = ['Apple', 'OnePlus', 'Xiaomi', 'Motorola', 'iQOO', 'Samsung', 'POCO', 'Nothing'];
  return brands.find((brand) => name.toLowerCase().startsWith(brand.toLowerCase())) || name.split(/\s+/)[0];
}

function categoryFor(value: string): string {
  const categories: Record<string, string> = {
    tablets: 'Tablets',
    mobile: 'Mobiles',
    watch: 'Watches',
  };
  return categories[normalized(value).replace(/\s/g, '')] || value.trim();
}

function categoryDescription(name: string): string {
  return `${name} selected and stocked by TechChasers.`;
}

function loadProducts(): SpreadsheetProduct[] {
  if (!existsSync(WORKBOOK_PATH)) throw new Error(`Workbook not found: ${WORKBOOK_PATH}`);
  if (!Number.isInteger(DEFAULT_STOCK) || DEFAULT_STOCK < 0) {
    throw new Error('--default-stock must be a non-negative whole number.');
  }

  const strings = sharedStrings();
  const productSheet = worksheet('xl/worksheets/sheet1.xml', strings);
  const products: SpreadsheetProduct[] = [];
  let current: SpreadsheetProduct | undefined;
  const seenSerials = new Set<string>();

  for (const [rowNumber, cells] of [...productSheet.entries()].sort(([a], [b]) => a - b)) {
    const serial = cells.get(1) || '';
    const name = cells.get(2) || '';
    if (/^\d+$/.test(serial) && name) {
      if (seenSerials.has(serial)) throw new Error(`Row ${rowNumber}: duplicate S.No ${serial}.`);
      seenSerials.add(serial);
      const categoryName = cells.get(4) || '';
      if (!categoryName) throw new Error(`Row ${rowNumber}: product category is required.`);
      current = {
        sourceRow: rowNumber,
        serial,
        name,
        categoryName: categoryFor(categoryName),
        price: parseMoney(cells.get(7) || '', 'selling price', rowNumber),
        comparePrice: cells.get(8) ? parseMoney(cells.get(8) || '', 'MRP', rowNumber) : undefined,
        highlights: cells.get(3) ? [cells.get(3) as string] : [],
        specifications: {},
      };
      products.push(current);
    } else if (current && cells.get(3)) {
      current.highlights.push(cells.get(3) as string);
    }
  }

  if (products.length === 0) throw new Error('Product_Sheet contains no numbered product rows.');
  readSpecifications(worksheet('xl/worksheets/sheet2.xml', strings), products);
  return products;
}

async function main() {
  const products = loadProducts();
  const categoryNames = [...new Set(products.map((product) => product.categoryName))];
  const suspiciousCategories = products.filter(
    (product) => /watch/i.test(product.categoryName) && /(?:qled|television|\b(?:cm|inch)\b)/i.test(product.name)
  );

  console.log(`Parsed ${products.length} products from data/products.xlsx.`);
  console.log(`Categories: ${categoryNames.join(', ')}.`);
  console.log(`Default stock: ${DEFAULT_STOCK}.`);
  if (suspiciousCategories.length) {
    console.warn(`Warning: ${suspiciousCategories.map((product) => `row ${product.sourceRow} (${product.name})`).join(', ')} is categorised as Watch.`);
  }
  if (!REPLACE) {
    console.log('Nothing written. Re-run with --replace to replace the catalogue.');
    return;
  }

  await dbConnect();
  // A workbook re-import replaces catalogue records. Keep specifications that
  // were enriched from the workbook's linked product pages, then let any
  // directly supplied workbook specs take precedence below.
  const existingSpecificationsBySlug = new Map(
    (await Product.find({}).select('slug specifications').lean<{ slug: string; specifications?: Record<string, string> }[]>())
      .map((product) => [product.slug, product.specifications || {}])
  );
  const oldCategoryIds = await Product.distinct('category');
  const deletedProducts = await Product.deleteMany({});
  const deletedCategories = oldCategoryIds.length
    ? await Category.deleteMany({ _id: { $in: oldCategoryIds } })
    : { deletedCount: 0 };

  const categories = new Map<string, string>();
  for (const name of categoryNames) {
    const slug = generateSlug(name);
    const category = await Category.findOneAndUpdate(
      { slug },
      { $set: { name, description: categoryDescription(name), image: '', isActive: true } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    ).select('_id');
    categories.set(name, String(category._id));
  }

  const usedSlugs = new Set<string>();
  const records = products.map((product, index) => {
    const baseSlug = generateSlug(product.name).slice(0, 90);
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
    usedSlugs.add(slug);
    const highlights = product.highlights.filter(Boolean);

    return {
      name: product.name,
      slug,
      description: [product.name, ...highlights].join('. '),
      shortDescription: highlights.join(' · ').slice(0, 220) || product.name,
      price: product.price,
      comparePrice: product.comparePrice && product.comparePrice > product.price ? product.comparePrice : undefined,
      category: categories.get(product.categoryName),
      brand: brandFor(product.name),
      images: [],
      specifications: { ...existingSpecificationsBySlug.get(slug), ...product.specifications },
      stock: DEFAULT_STOCK,
      featured: index < 8,
      isActive: true,
      rating: 0,
      reviewCount: 0,
      tags: [brandFor(product.name), product.categoryName],
    };
  });

  await Product.insertMany(records, { ordered: true });
  console.log(`Replaced ${deletedProducts.deletedCount} old products with ${records.length} products.`);
  console.log(`Removed ${deletedCategories.deletedCount || 0} old catalogue categories and created ${categories.size} workbook categories.`);
  console.log('Users, orders, settings, and PC components were not changed.');
}

main()
  .catch((error) => {
    console.error('Product import failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
