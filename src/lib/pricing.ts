import type { StoreSettings } from '@/lib/storeSettings';

export interface OrderTotals {
  subtotal: number;
  shippingCost: number;
  /**
   * GST already contained in `subtotal`, back-computed for disclosure.
   * It is NOT added to the total — `totalAmount` is `subtotal + shippingCost`.
   */
  tax: number;
  totalAmount: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Indian retail convention: displayed prices are GST-inclusive. So the subtotal is
 * what the customer already saw, GST is extracted from it for the breakdown, and only
 * shipping is ever added on top.
 */
export function computeTotals(subtotal: number, settings: StoreSettings): OrderTotals {
  const shippingCost =
    subtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingRate;

  const rate = settings.gstRate;
  const tax = rate > 0 ? round2((subtotal * rate) / (100 + rate)) : 0;

  return {
    subtotal: round2(subtotal),
    shippingCost: round2(shippingCost),
    tax,
    totalAmount: round2(subtotal + shippingCost),
  };
}
