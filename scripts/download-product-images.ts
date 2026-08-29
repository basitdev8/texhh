/**
 * Downloads public OneDrive image folders referenced by data/products.xlsx.
 *
 * Output:
 *   data/product-images/<product-slug>/01-<source-name>.<ext>
 *   data/product-images/manifest.json
 *   data/product-images/download-report.json
 *
 * A OneDrive folder shared by several products is downloaded once into the
 * local cache, then its image files are copied into every product folder.
 *
 *   npm run download-product-images
 *   npm run download-product-images -- --force
 *
 * `--force` re-downloads source folders and rebuilds generated product
 * folders. Without it, folders that already contain generated images are
 * left untouched.
 */
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { generateSlug } from '../src/lib/utils';

const WORKBOOK_PATH = resolve(process.cwd(), 'data/products.xlsx');
const OUTPUT_ROOT = resolve(process.cwd(), 'data/product-images');
const CACHE_ROOT = resolve(OUTPUT_ROOT, '.cache');
const MANIFEST_PATH = resolve(OUTPUT_ROOT, 'manifest.json');
const REPORT_PATH = resolve(OUTPUT_ROOT, 'download-report.json');
const FORCE = process.argv.includes('--force');
const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

interface WorkbookProduct {
  sourceRow: number;
  serial: string;
  name: string;
  slug: string;
  sourceFolderUrl?: string;
}

interface DownloadedImage {
  index: number;
  sourceName: string;
  localPath: string;
  bytes: number;
}

interface ProductManifestEntry extends WorkbookProduct {
  status: 'downloaded' | 'skipped' | 'failed';
  images: DownloadedImage[];
}

interface Failure {
  productSlug?: string;
  sourceFolderUrl?: string;
  message: string;
}

interface SourceFolder {
  folderUrl: string;
  images: CachedSourceImage[];
}

interface CachedSourceImage {
  id: string;
  name: string;
  cachePath: string;
  bytes: number;
}

interface OneDriveItem {
  id: string;
  name: string;
  size?: number;
  file?: Record<string, unknown>;
  folder?: Record<string, unknown>;
  parentReference?: { driveId?: string };
  '@content.downloadUrl'?: string;
  '@odata.nextLink'?: string;
}

interface OneDriveListResponse {
  value?: OneDriveItem[];
  '@odata.nextLink'?: string;
  error?: { code?: string; message?: string };
}

type Worksheet = Map<number, Map<number, string>>;

function readXlsxEntry(entry: string): string {
  try {
    return execFileSync('unzip', ['-p', WORKBOOK_PATH, entry], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
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

function imageFolderLinksByRow(): Map<number, string> {
  const relationshipsXml = readXlsxEntry('xl/worksheets/_rels/sheet1.xml.rels');
  const relationships = new Map<string, string>();
  for (const match of relationshipsXml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const id = attr(match[1], 'Id');
    const target = attr(match[1], 'Target');
    if (id && target) relationships.set(id, decodeXml(target));
  }

  const sheetXml = readXlsxEntry('xl/worksheets/sheet1.xml');
  const links = new Map<number, string>();
  for (const match of sheetXml.matchAll(/<hyperlink\b([^>]*)\/>/g)) {
    const ref = attr(match[1], 'ref');
    const relationshipId = attr(match[1], 'r:id');
    const target = relationshipId ? relationships.get(relationshipId) : undefined;
    if (!ref || !target || !target.includes('1drv.ms')) continue;

    const [startRef, endRef = startRef] = ref.split(':');
    if (columnIndex(startRef) !== 6 || columnIndex(endRef) !== 6) continue; // column G: product_images
    const startRow = Number(startRef.match(/\d+/)?.[0]);
    const endRow = Number(endRef.match(/\d+/)?.[0]);
    if (!Number.isInteger(startRow) || !Number.isInteger(endRow)) continue;
    for (let row = startRow; row <= endRow; row += 1) links.set(row, target);
  }
  return links;
}

function loadProducts(): WorkbookProduct[] {
  if (!existsSync(WORKBOOK_PATH)) throw new Error(`Workbook not found: ${WORKBOOK_PATH}`);
  const sheet = worksheet('xl/worksheets/sheet1.xml', sharedStrings());
  const linksByRow = imageFolderLinksByRow();
  const products: WorkbookProduct[] = [];
  const usedSlugs = new Set<string>();

  for (const [sourceRow, cells] of [...sheet.entries()].sort(([a], [b]) => a - b)) {
    const serial = cells.get(1) || '';
    const name = cells.get(2) || '';
    if (!/^\d+$/.test(serial) || !name) continue;

    const baseSlug = generateSlug(name).slice(0, 90);
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
    usedSlugs.add(slug);
    products.push({ sourceRow, serial, name, slug, sourceFolderUrl: linksByRow.get(sourceRow) });
  }

  if (!products.length) throw new Error('Product_Sheet contains no numbered product rows.');
  return products;
}

function safeFileStem(name: string): string {
  const stem = name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase()
    .slice(0, 90);
  return stem || 'image';
}

function isImageEntry(entry: string): boolean {
  const fileName = basename(entry);
  return !entry.endsWith('/') && !fileName.startsWith('.') && IMAGE_EXTENSIONS.has(extname(fileName).toLowerCase());
}

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function folderCachePath(url: string): string {
  return resolve(CACHE_ROOT, createHash('sha256').update(url).digest('hex'));
}

function sourceCacheManifestPath(cacheDir: string): string {
  return resolve(cacheDir, 'source-manifest.json');
}

function isSupportedImageBuffer(bytes: Buffer): boolean {
  return (bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    || (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    || bytes.subarray(0, 6).toString('ascii') === 'GIF87a'
    || bytes.subarray(0, 6).toString('ascii') === 'GIF89a'
    || (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP')
    || (bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp' && /avi[fs]/.test(bytes.subarray(8, 16).toString('ascii')));
}

function oneDriveHeaders(token: string): Record<string, string> {
  return {
    accept: 'application/json',
    appid: '1141147648',
    authorization: `Badger ${token}`,
    prefer: 'autoredeem',
    'user-agent': 'TechChasers product image downloader',
  };
}

let badgerTokenPromise: Promise<string> | undefined;

async function getBadgerToken(): Promise<string> {
  badgerTokenPromise ??= (async () => {
    const response = await fetch('https://api-badgerp.svc.ms/v1.0/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', appid: '1141147648', 'user-agent': 'TechChasers product image downloader' },
      body: JSON.stringify({ appId: '5cbed6ac-a083-4e14-b191-b4ba07653de2' }),
      signal: AbortSignal.timeout(30_000),
    });
    const payload = await response.json().catch(() => ({})) as { token?: unknown };
    if (!response.ok || typeof payload.token !== 'string' || !payload.token) {
      throw new Error(`Could not establish a public OneDrive download session (HTTP ${response.status}).`);
    }
    return payload.token;
  })();
  return badgerTokenPromise;
}

async function oneDriveJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: oneDriveHeaders(token), signal: AbortSignal.timeout(60_000) });
  const payload = await response.json().catch(() => ({})) as T & { error?: { code?: string; message?: string } };
  if (!response.ok) {
    throw new Error(`OneDrive API returned HTTP ${response.status}${payload.error?.code ? ` (${payload.error.code})` : ''}. Make sure the folder link is public.`);
  }
  return payload;
}

async function resolvePublicFolder(folderUrl: string, token: string): Promise<{ driveId: string; itemId: string }> {
  const pageResponse = await fetch(folderUrl, {
    headers: { 'user-agent': 'TechChasers product image downloader' },
    redirect: 'follow',
    signal: AbortSignal.timeout(60_000),
  });
  if (!pageResponse.ok) throw new Error(`OneDrive returned HTTP ${pageResponse.status}. Make sure the folder link is public.`);

  const resolved = new URL(pageResponse.url);
  const redeem = resolved.searchParams.get('redeem');
  if (!redeem) throw new Error('OneDrive did not provide a public share redemption code for this folder.');

  const sharedItem = await oneDriveJson<OneDriveItem>(
    `https://my.microsoftpersonalcontent.com/_api/v2.0/shares/u!${encodeURIComponent(redeem)}/driveitem?$select=id,parentReference,folder`,
    token,
  );
  const driveId = sharedItem.parentReference?.driveId;
  if (!sharedItem.id || !driveId || !sharedItem.folder) throw new Error('The public link does not resolve to a OneDrive folder.');
  return { driveId, itemId: sharedItem.id };
}

async function listFolderImages(folderUrl: string, token: string): Promise<{ driveId: string; images: OneDriveItem[] }> {
  const { driveId, itemId } = await resolvePublicFolder(folderUrl, token);
  const images: OneDriveItem[] = [];
  let nextUrl: string | undefined = `https://my.microsoftpersonalcontent.com/_api/v2.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/children?$top=100&$select=id,name,size,file,folder`;
  while (nextUrl) {
    const page: OneDriveListResponse = await oneDriveJson<OneDriveListResponse>(nextUrl, token);
    images.push(...(page.value || []).filter((item: OneDriveItem) => Boolean(item.file) && isImageEntry(item.name)));
    nextUrl = page['@odata.nextLink'];
  }
  return { driveId, images: images.sort((a, b) => naturalCompare(a.name, b.name)) };
}

async function downloadSourceImage(item: OneDriveItem, driveId: string, token: string, destination: string): Promise<CachedSourceImage> {
  if (!item.id || !item.name) throw new Error('OneDrive returned an image without an id or name.');
  const metadata = await oneDriveJson<OneDriveItem>(
    `https://my.microsoftpersonalcontent.com/_api/v2.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(item.id)}?$select=id,name,size,file,@content.downloadUrl`,
    token,
  );
  const downloadUrl = metadata['@content.downloadUrl'];
  if (!downloadUrl) throw new Error(`OneDrive did not provide a download URL for ${item.name}.`);
  const response = await fetch(downloadUrl, { redirect: 'follow', headers: { 'user-agent': 'TechChasers product image downloader' }, signal: AbortSignal.timeout(90_000) });
  if (!response.ok) throw new Error(`OneDrive returned HTTP ${response.status} while downloading ${item.name}.`);
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) throw new Error(`${item.name} exceeds the ${MAX_IMAGE_BYTES / 1024 / 1024} MB per-image safety limit.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error(`${item.name} is empty or exceeds the ${MAX_IMAGE_BYTES / 1024 / 1024} MB per-image safety limit.`);
  if (!isSupportedImageBuffer(bytes)) throw new Error(`${item.name} was not returned as a supported image file.`);
  writeFileSync(destination, bytes);
  return { id: item.id, name: item.name, cachePath: destination, bytes: bytes.length };
}

function cachedSourceFolder(folderUrl: string, cacheDir: string): SourceFolder | undefined {
  const manifestPath = sourceCacheManifestPath(cacheDir);
  if (!existsSync(manifestPath)) return undefined;
  try {
    const payload = JSON.parse(readFileSync(manifestPath, 'utf8')) as { images?: CachedSourceImage[] };
    if (!payload.images?.length || payload.images.some((image) => !existsSync(image.cachePath))) return undefined;
    return { folderUrl, images: payload.images };
  } catch {
    return undefined;
  }
}

async function prepareSourceFolder(folderUrl: string): Promise<SourceFolder> {
  mkdirSync(CACHE_ROOT, { recursive: true });
  const cacheDir = folderCachePath(folderUrl);
  if (!FORCE) {
    const cached = cachedSourceFolder(folderUrl, cacheDir);
    if (cached) return cached;
  }
  if (existsSync(cacheDir)) rmSync(cacheDir, { recursive: true, force: true });
  mkdirSync(cacheDir, { recursive: true });

  const token = await getBadgerToken();
  const { driveId, images } = await listFolderImages(folderUrl, token);
  if (!images.length) throw new Error('The public folder contains no supported image files.');
  const cachedImages: CachedSourceImage[] = [];
  for (const [index, image] of images.entries()) {
    const extension = extname(image.name).toLowerCase();
    const cachePath = resolve(cacheDir, `${String(index + 1).padStart(2, '0')}-${createHash('sha256').update(image.id).digest('hex').slice(0, 12)}${extension}`);
    cachedImages.push(await downloadSourceImage(image, driveId, token, cachePath));
  }
  const source = { folderUrl, images: cachedImages };
  writeJson(sourceCacheManifestPath(cacheDir), source);
  return source;
}

function generatedImages(productDir: string): DownloadedImage[] {
  if (!existsSync(productDir)) return [];
  return readdirSync(productDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d{2,}-/.test(entry.name) && isImageEntry(entry.name))
    .sort((a, b) => naturalCompare(a.name, b.name))
    .map((entry, index) => {
      const relativePath = `${basename(productDir)}/${entry.name}`;
      const bytes = readFileSync(resolve(productDir, entry.name)).byteLength;
      return { index: index + 1, sourceName: entry.name.replace(/^\d{2,}-/, ''), localPath: relativePath, bytes };
    });
}

function rebuildProductFolder(product: WorkbookProduct, source: SourceFolder): DownloadedImage[] {
  const productDir = resolve(OUTPUT_ROOT, product.slug);
  if (FORCE && existsSync(productDir)) rmSync(productDir, { recursive: true, force: true });
  mkdirSync(productDir, { recursive: true });

  return source.images.map((image, index) => {
    const sourceName = image.name;
    const extension = extname(sourceName).toLowerCase();
    const outputName = `${String(index + 1).padStart(2, '0')}-${safeFileStem(basename(sourceName, extension))}${extension}`;
    const outputPath = resolve(productDir, outputName);
    const bytes = readFileSync(image.cachePath);
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
      throw new Error(`${sourceName} is empty or exceeds the ${MAX_IMAGE_BYTES / 1024 / 1024} MB per-image safety limit.`);
    }
    if (!isSupportedImageBuffer(bytes)) throw new Error(`${sourceName} is not a supported image file in the local source cache.`);
    writeFileSync(outputPath, bytes);
    return {
      index: index + 1,
      sourceName,
      localPath: `${product.slug}/${outputName}`,
      bytes: bytes.length,
    };
  });
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const products = loadProducts();
  mkdirSync(OUTPUT_ROOT, { recursive: true });
  const failures: Failure[] = [];
  const pending = products.filter((product) => FORCE || generatedImages(resolve(OUTPUT_ROOT, product.slug)).length === 0);
  const pendingSources = [...new Set(pending.flatMap((product) => product.sourceFolderUrl ? [product.sourceFolderUrl] : []))];
  const sources = new Map<string, SourceFolder>();
  const sourceErrors = new Map<string, string>();

  console.log(`Found ${products.length} products and ${pendingSources.length} public OneDrive folders to process.`);
  for (const [index, folderUrl] of pendingSources.entries()) {
    process.stdout.write(`[${index + 1}/${pendingSources.length}] Downloading shared folder... `);
    try {
      const source = await prepareSourceFolder(folderUrl);
      sources.set(folderUrl, source);
      console.log(`${source.images.length} image${source.images.length === 1 ? '' : 's'}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sourceErrors.set(folderUrl, message);
      console.log(`failed: ${message}`);
    }
  }

  const manifestProducts: ProductManifestEntry[] = [];
  for (const product of products) {
    const productDir = resolve(OUTPUT_ROOT, product.slug);
    const existing = generatedImages(productDir);
    if (!FORCE && existing.length) {
      manifestProducts.push({ ...product, status: 'skipped', images: existing });
      continue;
    }
    if (!product.sourceFolderUrl) {
      const message = `No OneDrive folder link found in product_images for workbook row ${product.sourceRow}.`;
      failures.push({ productSlug: product.slug, message });
      manifestProducts.push({ ...product, status: 'failed', images: [] });
      continue;
    }
    const sourceError = sourceErrors.get(product.sourceFolderUrl);
    if (sourceError) {
      failures.push({ productSlug: product.slug, sourceFolderUrl: product.sourceFolderUrl, message: sourceError });
      manifestProducts.push({ ...product, status: 'failed', images: [] });
      continue;
    }
    const source = sources.get(product.sourceFolderUrl);
    if (!source) {
      const message = 'No downloaded source folder was available for this product.';
      failures.push({ productSlug: product.slug, sourceFolderUrl: product.sourceFolderUrl, message });
      manifestProducts.push({ ...product, status: 'failed', images: [] });
      continue;
    }
    try {
      const images = rebuildProductFolder(product, source);
      manifestProducts.push({ ...product, status: 'downloaded', images });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ productSlug: product.slug, sourceFolderUrl: product.sourceFolderUrl, message });
      manifestProducts.push({ ...product, status: 'failed', images: [] });
    }
  }

  const generatedAt = new Date().toISOString();
  writeJson(MANIFEST_PATH, {
    schemaVersion: 1,
    generatedAt,
    sourceWorkbook: 'data/products.xlsx',
    outputRoot: 'data/product-images',
    force: FORCE,
    products: manifestProducts,
  });
  writeJson(REPORT_PATH, {
    generatedAt,
    sourceWorkbook: 'data/products.xlsx',
    failures,
  });

  const downloaded = manifestProducts.filter((product) => product.status === 'downloaded').length;
  const skipped = manifestProducts.filter((product) => product.status === 'skipped').length;
  console.log(`Finished: ${downloaded} downloaded, ${skipped} skipped, ${failures.length} failed.`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  console.log(`Failure report: ${REPORT_PATH}`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Product image download failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
