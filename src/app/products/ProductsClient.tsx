"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductsGrid from "@/components/ProductsGrid";
import { createClient } from "@/lib/supabase/client";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";

const PRODUCTS_PER_PAGE = 12;

export default function ProductsClient({
  initialCategory,
  initialSort,
}: {
  initialCategory: string;
  initialSort: string;
}) {
  const { lang } = useUIPrefs();
  const tr = t[lang];
  const searchParams = useSearchParams();
  const isOffersFilter = searchParams.get("filter") === "offers";

  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "all");
  const [sortBy, setSortBy] = useState(initialSort || "featured");

  // مزامنة التصنيف مع الـ URL عند التنقل من الهيدر (نفس الصفحة بدون reload)
  useEffect(() => {
    setSelectedCategory(initialCategory || "all");
  }, [initialCategory]);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = useMemo(
    () => [
      { id: "all", label: tr.all },
      { id: "men", label: tr.men },
      { id: "women", label: tr.women },
      { id: "unisex", label: tr.unisex },
    ],
    [tr]
  );

  const activeCategory = isOffersFilter ? "all" : selectedCategory;

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  useEffect(() => {
    setPage(1);
  }, [activeCategory, search, sortBy, isOffersFilter]);

  // تحميل العدد الكلي
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      let q = supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "published");
      if (activeCategory !== "all") q = q.eq("category", activeCategory);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      const { count } = await q;
      if (!cancelled) setTotalCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, search]);

  return (
    <div>
      {/* شريط التصفية */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* تبويبات التصنيف */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {!isOffersFilter &&
            categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`text-xs uppercase tracking-widest px-4 py-2.5 whitespace-nowrap transition-all border ${
                  selectedCategory === c.id
                    ? "border-[#1A1816] dark:border-[#D4AF37] bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] font-semibold"
                    : "border-line-2 dark:border-[#38312A] text-charcoal dark:text-[#C4BCB1] hover:border-gold-dark dark:hover:border-[#D4AF37] hover:text-ink dark:hover:text-[#FAF8F5] bg-transparent"
                }`}
              >
                {c.label}
              </button>
            ))}
          {isOffersFilter && (
            <span className="text-xs uppercase tracking-widest px-4 py-2.5 border border-[#1A1816] dark:border-[#D4AF37] bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] font-semibold">
              {tr.offers}
            </span>
          )}
        </div>

        {/* بحث + ترتيب */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <svg className="w-4 h-4 text-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr.searchPlaceholder}
              className="w-full bg-surface dark:bg-[#171513] border border-line-2 dark:border-[#38312A] ps-9 pe-3 py-2 text-xs text-ink dark:text-[#FAF8F5] focus:outline-none focus:border-gold-dark dark:focus:border-[#D4AF37]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface dark:bg-[#171513] border border-line-2 dark:border-[#38312A] text-xs text-ink dark:text-[#FAF8F5] px-3 py-2 uppercase tracking-wider focus:outline-none focus:border-gold-dark dark:focus:border-[#D4AF37] cursor-pointer shrink-0"
            aria-label={lang === "ar" ? "الترتيب" : "Sort"}
          >
            <option value="featured">{lang === "ar" ? "المميز" : "Featured"}</option>
            <option value="price_asc">{lang === "ar" ? "السعر: الأقل" : "Price: Low to High"}</option>
            <option value="price_desc">{lang === "ar" ? "السعر: الأعلى" : "Price: High to Low"}</option>
          </select>
        </div>
      </div>

      {/* عداد النتائج + إلغاء التصفية */}
      <div className="mb-6 flex items-center justify-between text-xs text-charcoal dark:text-[#A8A096] tracking-wider uppercase">
        <ProductsCount category={activeCategory} search={search} offersOnly={isOffersFilter} lang={lang} />
        {(activeCategory !== "all" || isOffersFilter || search) && (
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSearch("");
              window.location.href = "/products";
            }}
            className="text-gold-dark dark:text-[#D4AF37] hover:underline"
          >
            {lang === "ar" ? "إلغاء التصفية" : "Reset Filter"}
          </button>
        )}
      </div>

      {/* الشبكة */}
      <ProductsGrid
        key={`${activeCategory}-${search}-${sortBy}-${isOffersFilter}-${page}`}
        category={activeCategory === "all" ? undefined : activeCategory}
        sort={sortBy === "featured" ? "newest" : (sortBy as "price_asc" | "price_desc")}
        limit={PRODUCTS_PER_PAGE}
        page={page}
        offersOnly={isOffersFilter}
        searchQuery={search}
      />

      {/* Pagination */}
      {totalCount !== null && totalCount > PRODUCTS_PER_PAGE && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-xs uppercase tracking-wider border border-line-2 dark:border-[#38312A] text-charcoal dark:text-[#C4BCB1] hover:border-gold-dark dark:hover:border-[#D4AF37] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {lang === "ar" ? "السابق" : "Previous"}
          </button>
          <span className="text-xs text-muted dark:text-[#9E9589]">
            {lang === "ar" 
              ? `صفحة ${page} من ${Math.ceil(totalCount / PRODUCTS_PER_PAGE)}`
              : `Page ${page} of ${Math.ceil(totalCount / PRODUCTS_PER_PAGE)}`
            }
          </span>
          <button
            onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / PRODUCTS_PER_PAGE), p + 1))}
            disabled={page >= Math.ceil(totalCount / PRODUCTS_PER_PAGE)}
            className="px-4 py-2 text-xs uppercase tracking-wider border border-line-2 dark:border-[#38312A] text-charcoal dark:text-[#C4BCB1] hover:border-gold-dark dark:hover:border-[#D4AF37] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {lang === "ar" ? "التالي" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}

// عداد النتائج — استعلام مبسط للعد فقط
function ProductsCount({
  category,
  search,
  offersOnly,
  lang,
}: {
  category: string;
  search: string;
  offersOnly: boolean;
  lang: "ar" | "en";
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      let q = supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "published");
      if (category !== "all") q = q.eq("category", category);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      const { count } = await q;
      if (!cancelled) setCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [category, search]);

  if (count === null) return <span>...</span>;
  return (
    <span>
      {lang === "ar" ? `عرض ${count} عطر` : `Showing ${count} Fragrance${count === 1 ? "" : "s"}`}
    </span>
  );
}
