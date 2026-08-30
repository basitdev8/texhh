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
  codMaxOrderAmount: number;
  bankTransferEnabled: boolean;
  shippingBannerText: string;
  heroProductId: string | null;
  homeFeaturedProductIds: string[];
  homeFeatureSelectionConfigured: boolean;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  freeShippingThreshold: 5000,
  flatShippingRate: 99,
  gstRate: 18,
  codEnabled: true,
  codMaxOrderAmount: 10_000,
  // There are no verified bank details or reconciliation process yet, so this
  // stays off until the business explicitly enables it in admin settings.
  bankTransferEnabled: false,
  shippingBannerText:
    'Free shipping on orders above ₹5,000. Dispatched in 1–2 business days.',
  heroProductId: null,
  homeFeaturedProductIds: [],
  homeFeatureSelectionConfigured: false,
};
