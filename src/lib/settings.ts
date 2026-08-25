import Settings from '@/models/Settings';
import { DEFAULT_SETTINGS, type StoreSettings } from '@/lib/storeSettings';

export { DEFAULT_SETTINGS };
export type { StoreSettings };

// Every order needs these numbers, so a short in-process cache keeps the settings
// read off the hot path without letting an admin edit go unnoticed for long.
const CACHE_TTL_MS = 30_000;
let cached: { value: StoreSettings; at: number } | null = null;

export function invalidateSettingsCache(): void {
  cached = null;
}

/** Reads the store settings, creating the singleton with defaults on first use. */
export async function getSettings(): Promise<StoreSettings> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const doc = await Settings.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: { key: 'store', ...DEFAULT_SETTINGS } },
    { new: true, upsert: true }
  ).lean<StoreSettings | null>();

  const value: StoreSettings = {
    freeShippingThreshold: doc?.freeShippingThreshold ?? DEFAULT_SETTINGS.freeShippingThreshold,
    flatShippingRate: doc?.flatShippingRate ?? DEFAULT_SETTINGS.flatShippingRate,
    gstRate: doc?.gstRate ?? DEFAULT_SETTINGS.gstRate,
    codEnabled: doc?.codEnabled ?? DEFAULT_SETTINGS.codEnabled,
    shippingBannerText: doc?.shippingBannerText ?? DEFAULT_SETTINGS.shippingBannerText,
  };

  cached = { value, at: Date.now() };
  return value;
}
