"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  journalName: string;
  subject: string;
  issn: string | null;
  image: string;
  year: string;
  issue?: string | null;
  plan: "PRINT" | "ONLINE" | "PRINT_ONLINE";
  unitPrice: number;
  qty: number;
};

type CartState = {
  items: CartItem[];
  couponCode: string;
  discountPercent: number;
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setCoupon: (code: string, percent: number) => void;
};

const CartCtx = createContext<CartState | null>(null);

const KEY = "stm_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { items?: CartItem[]; couponCode?: string; discountPercent?: number };
      setItems(parsed.items || []);
      setCouponCode(parsed.couponCode || "");
      setDiscountPercent(parsed.discountPercent || 0);
    } catch {
      // ignore invalid local data
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify({ items, couponCode, discountPercent }));
  }, [items, couponCode, discountPercent, hydrated]);

  const value = useMemo<CartState>(
    () => ({
      items,
      couponCode,
      discountPercent,
      addItem: (item) => {
        setItems((prev) => {
          const existing = prev.find((x) => x.id === item.id && x.plan === item.plan && x.year === item.year);
          if (existing) {
            return prev.map((x) => (x === existing ? { ...x, qty: x.qty + 1 } : x));
          }
          return [...prev, { ...item, qty: 1 }];
        });
      },
      removeItem: (id) => setItems((prev) => prev.filter((x) => x.id !== id)),
      setQty: (id, qty) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x))),
      clear: () => {
        setItems([]);
        setCouponCode("");
        setDiscountPercent(0);
      },
      setCoupon: (code, percent) => {
        setCouponCode(code);
        setDiscountPercent(percent);
      }
    }),
    [items, couponCode, discountPercent]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
