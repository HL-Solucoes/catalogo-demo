"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Product } from "../types/product";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, qtyDelta?: number) => void;
  setQty: (productId: string, qty: number) => void;
  inc: (productId: string) => void;
  dec: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qtyDelta = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === product.id);

        if (existing) {
          const newQty = Math.min(existing.qty + qtyDelta, product.quantity);
          if (newQty <= 0) {
            set({ items: items.filter((i) => i.productId !== product.id) });
          } else {
            set({
              items: items.map((i) =>
                i.productId === product.id ? { ...i, qty: newQty } : i,
              ),
            });
          }
        } else {
          if (product.quantity <= 0) return; // out of stock
          const qty = Math.min(Math.max(qtyDelta, 1), product.quantity);
          set({
            items: [
              ...items,
              {
                productId: product.id,
                idControl: product.idControl,
                title: product.title,
                price: product.price,
                is_price_visible: product.is_price_visible,
                image: product.image,
                qty,
                stock: product.quantity,
              },
            ],
          });
        }
      },

      setQty: (productId, qty) => {
        const { items } = get();
        const clamped = Math.max(qty, 0);
        set({
          items: items.map((i) =>
            i.productId === productId
              ? { ...i, qty: Math.min(clamped, i.stock) }
              : i,
          ),
        });
      },

      inc: (productId) => {
        const { items } = get();
        set({
          items: items.map((i) =>
            i.productId === productId && i.qty < i.stock
              ? { ...i, qty: i.qty + 1 }
              : i,
          ),
        });
      },

      dec: (productId) => {
        const { items } = get();
        const item = items.find((i) => i.productId === productId);
        if (!item) return;
        if (item.qty <= 1) {
          set({ items: items.filter((i) => i.productId !== productId) });
        } else {
          set({
            items: items.map((i) =>
              i.productId === productId ? { ...i, qty: i.qty - 1 } : i,
            ),
          });
        }
      },

      remove: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      clear: () => {
        set({ items: [] });
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Selectors for performance
export const selectCartItems = (state: CartState) => state.items;
export const selectCartCount = (state: CartState) =>
  state.items.reduce((acc, item) => acc + item.qty, 0);
export const selectCartTotal = (state: CartState) =>
  state.items
    .filter((i) => i.is_price_visible)
    .reduce((acc, i) => acc + i.price * i.qty, 0);
