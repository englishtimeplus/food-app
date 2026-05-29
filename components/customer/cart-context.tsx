"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cartLineKey } from "@/lib/cart-line";
import type { CartItem } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  updateLineOption: (
    lineKey: string,
    optionLabel: string | null,
    item: Omit<CartItem, "quantity">
  ) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "food-app-cart";

function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    optionLabel: item.optionLabel ?? null,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        setItems(parsed.map(normalizeCartItem));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    const normalized = { ...item, optionLabel: item.optionLabel ?? null };
    const key = cartLineKey(normalized.productId, normalized.optionLabel);
    setItems((prev) => {
      const existing = prev.find(
        (i) => cartLineKey(i.productId, i.optionLabel) === key
      );
      if (existing) {
        return prev.map((i) =>
          cartLineKey(i.productId, i.optionLabel) === key
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { ...normalized, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setItems((prev) =>
      prev.filter((i) => cartLineKey(i.productId, i.optionLabel) !== lineKey)
    );
  }, []);

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        cartLineKey(i.productId, i.optionLabel) === lineKey ? { ...i, quantity } : i
      )
    );
  }, []);

  const updateLineOption = useCallback(
    (lineKey: string, optionLabel: string | null, item: Omit<CartItem, "quantity">) => {
      setItems((prev) => {
        const line = prev.find(
          (i) => cartLineKey(i.productId, i.optionLabel) === lineKey
        );
        if (!line) return prev;

        const without = prev.filter(
          (i) => cartLineKey(i.productId, i.optionLabel) !== lineKey
        );
        const normalized = { ...item, optionLabel };
        const newKey = cartLineKey(normalized.productId, optionLabel);
        const existing = without.find(
          (i) => cartLineKey(i.productId, i.optionLabel) === newKey
        );

        if (existing) {
          return without.map((i) =>
            cartLineKey(i.productId, i.optionLabel) === newKey
              ? { ...i, quantity: i.quantity + line.quantity }
              : i
          );
        }

        return [...without, { ...normalized, quantity: line.quantity }];
      });
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateLineOption,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateLineOption,
      clearCart,
      totalItems,
      totalPrice,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
