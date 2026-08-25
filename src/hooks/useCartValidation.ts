'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { DEFAULT_SETTINGS, type StoreSettings } from '@/lib/storeSettings';
import type { OrderTotals } from '@/lib/pricing';

export interface CartChange {
  product: string;
  name: string;
  kind: 'price' | 'stock' | 'unavailable';
  was?: number;
  now?: number;
  message: string;
}

interface CartValidation {
  /** Differences the customer should see, already applied to the cart. */
  changes: CartChange[];
  /** Problems that must be cleared before an order can be placed. */
  blockers: CartChange[];
  /** Server-computed totals — the amount that will actually be charged. */
  totals: OrderTotals | null;
  settings: StoreSettings;
  isValidating: boolean;
  /** True once a response has come back, so the UI can wait before showing totals. */
  hasValidated: boolean;
  revalidate: () => Promise<void>;
}

/**
 * Re-prices the cart against the catalogue. Prices, stock and availability all move
 * while a cart sits in localStorage, and the server recomputes the total at payment
 * time regardless — so the number on screen has to come from the same place.
 */
export function useCartValidation(): CartValidation {
  const items = useCartStore((s) => s.items);
  const applyServerState = useCartStore((s) => s.applyServerState);

  const [changes, setChanges] = useState<CartChange[]>([]);
  const [blockers, setBlockers] = useState<CartChange[]>([]);
  const [totals, setTotals] = useState<OrderTotals | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  // Only the identity and quantity of lines should trigger a re-check; re-running on
  // price would loop, because applying the server price changes the cart.
  const signature = items
    .map((i) => `${i.productId}:${i.quantity}:${i.itemType ?? 'product'}`)
    .join('|');

  const revalidate = useCallback(async () => {
    const current = useCartStore.getState().items;
    if (current.length === 0) {
      setChanges([]);
      setBlockers([]);
      setTotals(null);
      setHasValidated(true);
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: current.map((i) => ({
            product: i.productId,
            itemType: i.itemType,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChanges(data.data.changes || []);
        setBlockers(data.data.blockers || []);
        setTotals(data.data.totals || null);
        if (data.data.settings) setSettings(data.data.settings);
        applyServerState(data.data.items || []);
      }
    } catch {
      // Offline or a failed request leaves the cached cart on screen; the server
      // still re-prices at checkout, so nothing can be underpaid.
    } finally {
      setIsValidating(false);
      setHasValidated(true);
    }
  }, [applyServerState]);

  useEffect(() => {
    revalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { changes, blockers, totals, settings, isValidating, hasValidated, revalidate };
}
