"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { getActiveOffer, getFinalPrice } from "@/lib/pricing";
import { useUIPrefs } from "@/lib/ui-prefs";

export default function ProductsGrid({
  category,
  sort = "newest",
  limit,
  page = 1,
  featuredOnly = false,
  excludeSlug,
  offersOnly = false,
  searchQuery = "",
  hideEmpty = false,
}: {
  category?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  limit?: number;
  page?: number;
  featuredOnly?: boolean;
  excludeSlug?: string;
  offersOnly?: boolean;
  searchQuery?: string;
  hideEmpty?: boolean;
}) {
  const { lang } = useUIPrefs();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      try {
        let query = supabase
          .from("products")
          .select(`*, variants:product_variants(*, offer:offers(*))`)
          .eq("status", "published");

        if (category) query = query.eq("category", category);
        if (featuredOnly) query = query.eq("featured", true);
        if (searchQuery.trim()) query = query.ilike("name", `%${searchQuery.trim()}%`);

        query = query.order("created_at", { ascending: false });
        
        // إضافة offset لـ pagination
        const offset = page ? (page - 1) * (limit ?? 48) : 0;
        if (offset > 0) query = query.range(offset, offset + (limit ?? 48) - 1);
        else query = query.limit(limit ?? 48);

        const { data, error: err } = await query;
        if (err) throw err;
        if (!cancelled) setProducts((data as Product[]) ?? []);
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category, featuredOnly, limit, searchQuery, page]);

  // ترتيب + فلترة العروض محليًا
  const sorted = useMemo(() => {
    if (!products) return null;
    let list = products.filter((p) => !excludeSlug || p.slug !== excludeSlug);

    if (offersOnly) {
      list = list.filter((p) =>
        (p.variants ?? []).some((v) => getActiveOffer(v) != null)
      );
    }

    if (sort === "price_asc" || sort === "price_desc") {
      const priceOf = (p: Product) =>
        Math.min(
          ...(p.variants ?? [])
            .filter((v) => v.is_active)
            .map((v) => getFinalPrice(v))
            .concat([Infinity])
        );
      list = [...list].sort((a, b) =>
        sort === "price_asc" ? priceOf(a) - priceOf(b) : priceOf(b) - priceOf(a)
      );
    }
    return list;
  }, [products, sort, excludeSlug, offersOnly]);

  if (error)
    return (
      <div className="text-center py-16">
        <p className="text-charcoal mb-4">
          {lang === "ar" ? "حصل خطأ في تحميل المنتجات 😔" : "Failed to load products 😔"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] px-6 py-2.5 text-xs uppercase tracking-widest font-semibold hover:bg-[#38332D] dark:hover:bg-[#B88E4F] transition-colors"
        >
          {lang === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );

  if (!sorted)
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
        {Array.from({ length: limit ?? 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton aspect-[4/5]" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ))}
      </div>
    );

  if (sorted.length === 0)
    return hideEmpty ? null : (
      <div className="py-20 text-center bg-[#F5F2EA] dark:bg-[#151311] border border-[#EBE5DA] dark:border-[#26211C] p-8">
        <p className="font-display text-2xl text-ink dark:text-[#FAF8F5] mb-2">
          {lang === "ar" ? "لم يتم العثور على عطور" : "No Fragrances Found"}
        </p>
        <p className="text-xs text-charcoal dark:text-[#A8A096] mb-6">
          {lang === "ar"
            ? "جرب البحث بكلمات أخرى أو اختر قسماً مختلفاً."
            : "Try adjusting your search terms or filter selections."}
        </p>
        <button
          onClick={() => (window.location.href = "/products")}
          className="px-6 py-2.5 bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#38332D] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C] text-xs uppercase tracking-widest font-semibold transition-colors"
        >
          {lang === "ar" ? "عرض كل العطور" : "Clear All Filters"}
        </button>
      </div>
    );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
      {sorted.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
        >
          <ProductCard product={p} />
        </motion.div>
      ))}
    </div>
  );
}
