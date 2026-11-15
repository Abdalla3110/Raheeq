"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { getActiveOffer, getFinalPrice, formatEGP } from "@/lib/pricing";
import { useCart, useFavorites } from "@/lib/store";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";

export default function ProductCard({ product }: { product: Product }) {
  const { lang } = useUIPrefs();
  const tr = t[lang];
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const variants = (product.variants ?? []).filter((v) => v.is_active);
  const [selectedId, setSelectedId] = useState<string>(variants[0]?.id ?? "");
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fav = isFavorite(product.slug);


  const current = variants.find((v) => v.id === selectedId) ?? variants[0] ?? null;
  const offer = current ? getActiveOffer(current) : null;
  const finalPrice = current ? getFinalPrice(current) : 0;
  const discountPct =
    offer && current ? Math.round(((current.price - finalPrice) / current.price) * 100) : 0;


  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!current || current.stock === 0) return;
    addItem({
      variantId: current.id,
      productId: product.id,
      slug: product.slug,
      productName: product.name,
      sizeMl: current.size_ml,
      image: product.images?.[0] ?? null,
      unitPrice: current.price,
      finalPrice,
      maxStock: current.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-cream dark:bg-[#151311] border border-line dark:border-[#28231E] hover:border-gold dark:hover:border-[#D4AF37] transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden hover:shadow-md dark:hover:shadow-[0_4px_20px_-2px_rgba(212,175,55,0.08)]"
    >
      {/* شارة الخصم */}
      {discountPct > 0 && (
        <div className="absolute top-3 start-3 z-20 flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-red-900/30" style={{background: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 50%, #ff6b35 100%)'}}>
          <span className="text-white text-[11px] font-black tracking-tight leading-none">-{discountPct}%</span>
          <span className="text-white/80 text-[8px] uppercase tracking-widest leading-none mt-0.5">SALE</span>
        </div>
      )}

      {/* المفضلة */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(product.slug);
        }}
        aria-label={tr.favorites}
        className={`absolute top-3 end-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm ${
          fav
            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
            : "bg-white/90 dark:bg-[#201C18]/90 text-[#6B6359] dark:text-[#C8C2B8] hover:text-ink dark:hover:text-white hover:bg-white dark:hover:bg-[#28231E]"
        }`}
      >
        <svg className={`w-4 h-4 ${fav ? "fill-rose-600 dark:fill-rose-400" : ""}`} fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.6c0 5-7.5 9.4-9 9.4s-9-4.4-9-9.4a4.6 4.6 0 0 1 9-1.4 4.6 4.6 0 0 1 9 1.4Z" />
        </svg>
      </button>

      {/* الصورة + أوفرلاي التفاصيل */}
      <div className="relative w-full aspect-[3/4] bg-[#F2EFE9] dark:bg-[#1C1916] overflow-hidden">
        {product.images?.[0] && !imgError ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={400}
            height={500}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out ${
              current && current.stock === 0 ? "grayscale opacity-50" : ""
            }`}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-25">🌸</div>
        )}

        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-[#1A1816]/15 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-[#FAF9F6]/95 dark:bg-[#1C1916]/95 text-ink dark:text-[#FAF8F5] text-xs uppercase tracking-widest px-3 py-1.5 font-medium shadow-sm flex items-center gap-1.5 border border-line-2/50 dark:border-[#332C24]">
            <svg className="w-3.5 h-3.5 text-gold-dark dark:text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
            {lang === "ar" ? "تفاصيل العطر" : "View Details"}
          </span>
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between border-t border-[#F0ECE4] dark:border-[#26211C]">
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted dark:text-[#9E9589] uppercase tracking-wider mb-1 font-medium">
            <span>{tr.brand}</span>
            <span>{CATEGORY_LABELS[product.category]}</span>
          </div>

          <h3 className="font-display text-base sm:text-lg text-ink dark:text-[#FAF8F5] font-medium tracking-wide group-hover:text-gold-dark dark:group-hover:text-[#D4AF37] transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* أزرار الأحجام */}
          {variants.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3 mt-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedId(v.id);
                  }}
                  disabled={v.stock === 0}
                  className={`text-[11px] px-2.5 py-1 tracking-wider uppercase border transition-all ${
                    v.stock === 0
                      ? "opacity-40 cursor-not-allowed border-line text-muted line-through"
                      : selectedId === v.id
                      ? "border-[#1A1816] dark:border-[#D4AF37] bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] font-semibold"
                      : "border-line-2 dark:border-[#38312A] text-charcoal dark:text-[#C4BCB1] hover:border-gold-dark dark:hover:border-[#D4AF37] bg-transparent"
                  }`}
                >
                  {v.size_ml}ml
                </button>
              ))}
            </div>
          )}
        </div>

        {/* السعر + السلة */}
        <div className="pt-3 border-t border-[#F0ECE4] dark:border-[#26211C] flex items-center justify-between mt-auto">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted dark:text-[#9E9589]">
              {current ? `${current.size_ml}ml` : tr.from}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-base sm:text-lg font-semibold text-ink dark:text-[#FAF8F5]">
                {formatEGP(finalPrice)}
              </span>
              {discountPct > 0 && current && (
                <span className="text-xs text-muted dark:text-[#736B61] line-through">
                  {formatEGP(current.price)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!current || current.stock === 0}
            className={`px-3 sm:px-4 py-2 text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 ${
              current && current.stock === 0
                ? "opacity-40 cursor-not-allowed border border-line text-muted"
                : added
                ? "bg-emerald-700 text-white"
                : "bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#38332D] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C]"
            }`}
          >
            {added ? (
              <span>✓ {tr.addedToCart}</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7Zm3 0V5a3 3 0 0 1 6 0v2" />
                </svg>
                <span className="hidden sm:inline">{lang === "ar" ? "أضف" : "Add"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
