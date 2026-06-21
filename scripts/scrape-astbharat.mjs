// Scrape astbharat.com Electronics catalog into data/astbharat.json
// Usage: node scripts/scrape-astbharat.mjs
//
// Walks /product-category/electronics/ (all pages), collects product URLs,
// then fetches each product detail page. Polite rate limit between requests.

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load as loadHtml } from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_OUT = resolve(__dirname, "..", "data", "astbharat.json");

const BASE = "https://astbharat.com";
const CATEGORY = `${BASE}/product-category/electronics/`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const REQUEST_DELAY_MS = 250;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
    return await res.text();
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    console.warn(`  retry ${attempt} on ${url}: ${err.message}`);
    await sleep(800 * attempt);
    return fetchHtml(url, attempt + 1);
  }
}

function parsePriceINR(text) {
  if (!text) return null;
  // Strip everything except digits and the decimal separator
  const cleaned = text.replace(/[^\d.,]/g, "").replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function pickFirst(arr) {
  for (const v of arr) {
    if (v != null && v !== "") return v;
  }
  return null;
}

async function getProductUrlsFromCategory() {
  const urls = new Set();
  let page = 1;

  while (true) {
    const url = page === 1 ? CATEGORY : `${CATEGORY}page/${page}/`;
    console.log(`Listing page ${page} -> ${url}`);
    let html;
    try {
      html = await fetchHtml(url);
    } catch (err) {
      console.warn(`  stopping: ${err.message}`);
      break;
    }
    const $ = loadHtml(html);

    // WooCommerce product links inside the loop
    const found = new Set();
    $("li.product a.woocommerce-LoopProduct-link, li.product a.woocommerce-loop-product__link").each(
      (_, a) => {
        const href = $(a).attr("href");
        if (href && /\/shop\/electronics\//.test(href)) found.add(href);
      }
    );

    // Fallback selector
    if (found.size === 0) {
      $("a.woocommerce-LoopProduct-link, a.woocommerce-loop-product__link").each(
        (_, a) => {
          const href = $(a).attr("href");
          if (href && /\/shop\/electronics\//.test(href)) found.add(href);
        }
      );
    }

    // Even more generic
    if (found.size === 0) {
      $("a").each((_, a) => {
        const href = $(a).attr("href");
        if (href && /\/shop\/electronics\/[^/]+\/[^/]+\/?$/.test(href)) {
          found.add(href.split("?")[0]);
        }
      });
    }

    console.log(`  found ${found.size} products on page ${page}`);
    if (found.size === 0) break;

    for (const u of found) urls.add(u);

    // Check pagination — is there a "next" link?
    const hasNext = $(
      `a.next.page-numbers, a.page-numbers[href*="page/${page + 1}"]`
    ).length;
    if (!hasNext && page >= 1) {
      // Try one more anyway just in case
      const peekUrl = `${CATEGORY}page/${page + 1}/`;
      try {
        const peek = await fetchHtml(peekUrl);
        const $p = loadHtml(peek);
        const peekCount = $p(
          "li.product a.woocommerce-LoopProduct-link, li.product a.woocommerce-loop-product__link"
        ).length;
        if (peekCount === 0) break;
      } catch {
        break;
      }
    }

    page++;
    await sleep(REQUEST_DELAY_MS);
    if (page > 25) break; // safety
  }

  return [...urls];
}

function parseSpecs($, root) {
  const specs = {};

  // 1) WooCommerce attributes table
  $(root)
    .find(".woocommerce-product-attributes-item, table.shop_attributes tr")
    .each((_, el) => {
      const k = $(el).find("th, .woocommerce-product-attributes-item__label").text().trim();
      const v = $(el).find("td, .woocommerce-product-attributes-item__value").text().trim();
      if (k && v) specs[k] = v;
    });

  // 2) "Additional information" key:value lists
  $(root)
    .find(".woocommerce-product-details__short-description ul li, #tab-description ul li")
    .each((_, li) => {
      const text = $(li).text().trim();
      const m = text.match(/^([^:]{2,40}):\s*(.+)$/);
      if (m) {
        const k = m[1].trim();
        const v = m[2].trim();
        if (!specs[k] && k.length < 40) specs[k] = v;
      }
    });

  return specs;
}

function collectDescription($, root) {
  // Short description (above-fold tagline)
  const short =
    $(root).find(".woocommerce-product-details__short-description").text().trim() ||
    $(root).find(".product_meta").prev("p").text().trim();

  // Long description tab content
  const long =
    $(root).find("#tab-description, .woocommerce-Tabs-panel--description").text().trim() ||
    $(root).find(".woocommerce-product-details__short-description").text().trim();

  return {
    short: short || "",
    long: long || short || "",
  };
}

function collectImages($, root) {
  const urls = new Set();

  // WooCommerce gallery images carry the full-size URL on the wrapper or data-src
  $(root)
    .find(".woocommerce-product-gallery__image a")
    .each((_, a) => {
      const href = $(a).attr("href");
      if (href && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(href)) urls.add(href);
    });

  $(root)
    .find(".woocommerce-product-gallery__image img, .woocommerce-product-gallery img")
    .each((_, img) => {
      const src =
        $(img).attr("data-large_image") ||
        $(img).attr("data-src") ||
        $(img).attr("src");
      if (src && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(src)) urls.add(src);
    });

  // Final fallback — og:image
  if (urls.size === 0) {
    const og = $('meta[property="og:image"]').attr("content");
    if (og) urls.add(og);
  }

  return [...urls];
}

function collectCategoryPath($, root) {
  const crumbs = [];
  $(".woocommerce-breadcrumb a").each((_, a) => {
    const text = $(a).text().trim();
    const href = $(a).attr("href") || "";
    if (text && !/^home$/i.test(text) && !/astbharat\.com\/?$/.test(href)) {
      crumbs.push(text);
    }
  });
  // The last crumb is usually the product title (after the last <a>); we ignored that.
  return crumbs;
}

function extractSubcategorySlug(productUrl) {
  // /shop/electronics/<subcat>/<product>/
  const m = productUrl.match(/\/shop\/electronics\/([^/]+)\//);
  return m ? m[1] : "electronics";
}

function inferBrand(name) {
  const known = [
    "Bose",
    "Sony",
    "Sennheiser",
    "EPOS",
    "Marshall",
    "Jabra",
    "Google",
    "Fastrack",
    "Fujifilm",
    "Titan",
    "Poly",
    "Anker",
    "Apple",
    "Samsung",
    "JBL",
    "Bang & Olufsen",
    "Logitech",
    "Audio-Technica",
    "Beyerdynamic",
    "AKG",
    "Skullcandy",
    "boAt",
    "Noise",
    "Realme",
    "Xiaomi",
    "OnePlus",
    "Nothing",
  ];
  for (const b of known) {
    if (new RegExp(`\\b${b}\\b`, "i").test(name)) return b;
  }
  // Fallback: first word
  return name.split(/\s+/)[0];
}

async function scrapeProduct(url) {
  const html = await fetchHtml(url);
  const $ = loadHtml(html);
  const root = $("body");

  const name =
    $("h1.product_title").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    "";

  // WooCommerce shows current price in .price > ins (sale) or .woocommerce-Price-amount
  let priceText =
    $(".price ins .woocommerce-Price-amount").first().text().trim() ||
    $(".price .woocommerce-Price-amount").first().text().trim() ||
    $(".price").first().text().trim();
  let comparePriceText =
    $(".price del .woocommerce-Price-amount").first().text().trim() || "";

  const price = parsePriceINR(priceText);
  const comparePrice = parsePriceINR(comparePriceText);

  const sku = $(".sku").first().text().trim() || null;
  const stockText = $(".stock").first().text().trim() || null;
  const inStock = !stockText || !/out of stock/i.test(stockText);

  const { short, long } = collectDescription($, root);
  const specs = parseSpecs($, root);
  const images = collectImages($, root);
  const categoryPath = collectCategoryPath($, root);
  const subcategorySlug = extractSubcategorySlug(url);
  const brand = inferBrand(name);

  const tags = [];
  $(".tagged_as a").each((_, a) => {
    const t = $(a).text().trim();
    if (t) tags.push(t);
  });

  return {
    url,
    name,
    brand,
    price,
    comparePrice: comparePrice && comparePrice !== price ? comparePrice : null,
    sku,
    inStock,
    images,
    shortDescription: short.slice(0, 360),
    description: long,
    specifications: specs,
    subcategorySlug,
    categoryPath, // ["Electronics", "TWS Bluetooth", ...]
    tags,
  };
}

async function main() {
  console.log("→ Scraping astbharat.com / Electronics");
  console.log("─".repeat(50));

  const urls = await getProductUrlsFromCategory();
  console.log(`\nDiscovered ${urls.length} unique product URLs.`);
  console.log("─".repeat(50));

  const products = [];
  let i = 0;
  for (const url of urls) {
    i++;
    try {
      const p = await scrapeProduct(url);
      products.push(p);
      console.log(
        `[${i}/${urls.length}] ${p.name.slice(0, 60)} — ₹${p.price ?? "?"}`
      );
    } catch (err) {
      console.warn(`[${i}/${urls.length}] FAILED ${url}: ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  // Group subcategory slugs and assign nice names
  const slugToName = {
    "professional-audio": "Professional Audio",
    headphones: "Headphones",
    "tws-bluetooth": "True Wireless Earbuds",
    "professional-speakerphones": "Professional Speakerphones",
    smartwatches: "Smartwatches",
    cameras: "Cameras",
    smartphones: "Smartphones",
    "wireless-headphones": "Wireless Headphones",
    "bluetooth-speakers": "Bluetooth Speakers",
    "video-conferencing": "Video Conferencing",
    "gaming-headphones": "Gaming Headphones",
  };
  const subcategorySlugs = [
    ...new Set(products.map((p) => p.subcategorySlug)),
  ];
  const categories = subcategorySlugs.map((slug) => ({
    slug,
    name: slugToName[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  const output = {
    source: "astbharat.com / Electronics",
    scrapedAt: new Date().toISOString(),
    categoryCount: categories.length,
    productCount: products.length,
    currency: "INR",
    categories,
    products,
  };

  if (!existsSync(dirname(ROOT_OUT))) {
    await mkdir(dirname(ROOT_OUT), { recursive: true });
  }
  await writeFile(ROOT_OUT, JSON.stringify(output, null, 2), "utf-8");

  console.log("─".repeat(50));
  console.log(`✓ Wrote ${products.length} products in ${categories.length} categories`);
  console.log(`  → ${ROOT_OUT}`);
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
