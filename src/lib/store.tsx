"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

// ── أنواع السلة ──────────────────────────────────────────────

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  productName: string;
  sizeMl: number;
  image: string | null;
  quantity: number;
  /** للعرض فقط — السعر الحقيقي بيتأكد من السيرفر عند الـ checkout */
  unitPrice: number;
  finalPrice: number;
  maxStock: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  discountTotal: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  refreshStock: () => Promise<void>;
  isReady: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "misk-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  // تحميل من localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // تجاهل البيانات التالفة
    }
    setIsReady(true);
  }, []);

  // حفظ عند أي تغيير
  useEffect(() => {
    if (isReady) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isReady]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        if (existing) {
          const newQuantity = existing.quantity + quantity;
          // التحقق من الستوك المتاح
          if (newQuantity > item.maxStock) {
            return prev.map((i) =>
              i.variantId === item.variantId
                ? {
                    ...i,
                    // تحديث السعر من أحدث بيانات
                    unitPrice: item.unitPrice,
                    finalPrice: item.finalPrice,
                    maxStock: item.maxStock,
                    quantity: Math.min(newQuantity, item.maxStock),
                  }
                : i
            );
          }
          return prev.map((i) =>
            i.variantId === item.variantId
              ? {
                  ...i,
                  // تحديث السعر من أحدث بيانات
                  unitPrice: item.unitPrice,
                  finalPrice: item.finalPrice,
                  maxStock: item.maxStock,
                  quantity: newQuantity,
                }
              : i
          );
        }
        // للمنتجات الجديدة، التحقق من الستوك
        if (quantity > item.maxStock) {
          return [...prev, { ...item, quantity: Math.min(quantity, item.maxStock) }];
        }
        return [...prev, { ...item, quantity }];
      });
    },
    []
  );

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.variantId === variantId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
          : i
      )
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // دالة لتحديث الستوك من الداتابيز
  const refreshStock = useCallback(async () => {
    if (items.length === 0) return;

    try {
      const supabase = createClient();
      const variantIds = items.map((i) => i.variantId);

      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, stock, is_active")
        .in("id", variantIds);

      if (!variants) return;

      const stockMap = new Map(variants.map((v) => [v.id, v]));

      setItems((prev) =>
        prev.map((item) => {
          const variant = stockMap.get(item.variantId);
          if (!variant || !variant.is_active) {
            // إزالة المنتج إذا لم يعد متاحاً
            return null;
          }
          return {
            ...item,
            maxStock: variant.stock,
            quantity: Math.min(item.quantity, variant.stock),
          };
        }).filter((item): item is CartItem => item !== null)
      );
    } catch (error) {
      // Silent error handling for stock refresh
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const total = items.reduce((s, i) => s + i.finalPrice * i.quantity, 0);
    return {
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      discountTotal: subtotal - total,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshStock,
      isReady,
    };
  }, [items, addItem, updateQuantity, removeItem, clearCart, refreshStock, isReady]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

// ── المفضلة ─────────────────────────────────────────────────

interface FavoritesContextValue {
  favorites: string[]; // product slugs
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  isReady: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const FAV_STORAGE_KEY = "misk-favorites-v1";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      // تجاهل
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, isReady]);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite, isFavorite, isReady }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}

// ── المقارنة ─────────────────────────────────────────────────────

interface ComparisonContextValue {
  items: string[]; // product slugs
  addToCompare: (slug: string) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isComparing: (slug: string) => boolean;
  isReady: boolean;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

const COMPARE_STORAGE_KEY = "misk-compare-v1";

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // تجاهل
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
  }, [items, isReady]);

  const addToCompare = useCallback((slug: string) => {
    setItems((prev) => {
      if (prev.includes(slug)) return prev;
      if (prev.length >= 4) return prev; // limit to 4 items
      return [...prev, slug];
    });
  }, []);

  const removeFromCompare = useCallback((slug: string) => {
    setItems((prev) => prev.filter((s) => s !== slug));
  }, []);

  const clearCompare = useCallback(() => {
    setItems([]);
    localStorage.removeItem(COMPARE_STORAGE_KEY);
  }, []);

  const isComparing = useCallback((slug: string) => items.includes(slug), [items]);

  return (
    <ComparisonContext.Provider value={{ items, addToCompare, removeFromCompare, clearCompare, isComparing, isReady }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error("useComparison must be used within ComparisonProvider");
  return ctx;
}
