'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ICartItem } from '@/types';

/** What the server says a line really costs and how many are left. */
export interface ServerCartLine {
  productId: string;
  itemType?: 'product' | 'component';
  name: string;
  price: number;
  image: string;
  maxStock: number;
}

interface CartState {
  items: ICartItem[];
  addItem: (item: ICartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyServerState: (lines: ServerCartLine[]) => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: ICartItem) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      // The cart is persisted in localStorage and can sit for weeks, so the server's
      // price, name, image and stock replace whatever was cached, and quantities are
      // clamped to what is actually available.
      applyServerState: (lines: ServerCartLine[]) => {
        set((state) => ({
          items: state.items.map((item) => {
            const line = lines.find((l) => l.productId === item.productId);
            if (!line) return item;
            return {
              ...item,
              itemType: line.itemType ?? item.itemType,
              name: line.name,
              price: line.price,
              image: line.image || item.image,
              maxStock: line.maxStock,
              quantity: Math.max(1, Math.min(item.quantity, Math.max(1, line.maxStock))),
            };
          }),
        }));
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'techchasers-cart',
    }
  )
);
