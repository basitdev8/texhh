/**
 * Store settings shape and defaults — no database imports, so client components can
 * use these without pulling mongoose into the browser bundle. The server-side reader
 * lives in `src/lib/settings.ts`.
 */
export interface StoreSettings {
  freeShippingThreshold: number;
  flatShippingRate: number;
  gstRate: number;
  codEnabled: boolean;
  shippingBannerText: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  freeShippingThreshold: 5000,
  flatShippingRate: 99,
  gstRate: 18,
  codEnabled: true,
  shippingBannerText:
    'Free shipping on orders above ₹5,000. Dispatched in 1–2 business days.',
};
