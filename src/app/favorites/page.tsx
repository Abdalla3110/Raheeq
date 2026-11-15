"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { useFavorites } from "@/lib/store";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";
import ProductCard from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/client";

export default function FavoritesPage() {
  const { favorites, isReady } = useFavorites();
  const { lang } = useUIPrefs();
  const tr = t[lang];
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (favorites.length === 0) {
      setProducts([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("products")
      .select(`*, variants:product_variants(*, offer:offers(*))`)
      .eq("status", "published")
      .in("slug", favorites)
      .then(({ data }) => setProducts((data as Product[]) ?? []));
  }, [favorites, isReady]);

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-dark dark:text-[#D4AF37] font-semibold mb-2">
            {lang === "ar" ? "قائمتك المفضلة" : "Curated Wishlist"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink dark:text-[#FAF8F5]">
            {tr.favorites}
          </h1>
          <p className="text-xs text-charcoal dark:text-[#A8A096] mt-2 font-light">
            {lang === "ar"
              ? "العطور التي قمت بحفظها لشرائها لاحقاً"
              : "Your saved fragrance flacons, preserved in your session."}
          </p>
        </div>

        {!isReady || products === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton aspect-[4/5]" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center bg-surface dark:bg-[#151311] border border-[#EBE5DA] dark:border-[#26211C] p-8 max-w-lg mx-auto shadow-sm">
            <svg className="w-12 h-12 mx-auto text-line-2 dark:text-[#38312A] mb-4" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.6c0 5-7.5 9.4-9 9.4s-9-4.4-9-9.4a4.6 4.6 0 0 1 9-1.4 4.6 4.6 0 0 1 9 1.4Z" />
            </svg>
            <h3 className="font-display text-xl text-ink dark:text-[#FAF8F5] mb-2">
              {tr.noFavorites}
            </h3>
            <p className="text-xs text-charcoal dark:text-[#A8A096] mb-6">
              {lang === "ar"
                ? "اضغط على علامة القلب بجانب أي عطر لإضافته إلى قائمة مفضلاتك."
                : "Tap the heart icon on any perfume card to add it to your private wishlist."}
            </p>
            <Link
              href="/products"
              className="px-6 py-3 bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#34302C] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C] text-xs uppercase tracking-widest font-semibold transition-colors"
            >
              {lang === "ar" ? "استكشف العطور الآن" : "Explore Perfumes"} →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
