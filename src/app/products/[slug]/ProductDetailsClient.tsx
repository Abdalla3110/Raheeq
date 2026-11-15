"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Product } from "@/lib/types";
import { getActiveOffer, getFinalPrice, formatEGP } from "@/lib/pricing";
import { useCart, useFavorites } from "@/lib/store";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";
import { createClient } from "@/lib/supabase/client";
import ProductsGrid from "@/components/ProductsGrid";
import StarRating from "@/components/StarRating";

export default function ProductDetailsClient({ product }: { product: Product }) {
  const { lang } = useUIPrefs();
  const tr = t[lang];
  const [loading, setLoading] = useState(true);
  const variants = useMemo(
    () => (product.variants ?? []).filter((v) => v.is_active),
    [product.variants]
  );

  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [imgIndex, setImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(product.slug);

  // Simulate loading for better UX
  useEffect(() => {
    if (product) {
      const timer = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [product]);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const offer = selected ? getActiveOffer(selected) : null;
  const finalPrice = selected ? getFinalPrice(selected) : 0;
  const hasDiscount = offer != null;
  const outOfStock = !selected || selected.stock === 0;
  const images = product.images?.length ? product.images : [];

  const nextImg = () => images.length && setImgIndex((i) => (i + 1) % images.length);
  const prevImg = () =>
    images.length && setImgIndex((i) => (i - 1 + images.length) % images.length);

  function handleAddToCart() {
    if (!selected || outOfStock) return;
    addItem(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        productName: product.name,
        sizeMl: selected.size_ml,
        image: product.images?.[0] ?? null,
        unitPrice: selected.price,
        finalPrice,
        maxStock: selected.stock,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div>
      {/* رجوع */}
      <a
        href="/products"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-charcoal dark:text-[#A8A096] hover:text-ink dark:hover:text-[#FAF8F5] transition-colors mb-8 group"
      >
        <span className="rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform">←</span>
        <span>{lang === "ar" ? "العودة للتشكيلة" : "Back to Collection"}</span>
      </a>

      {/* القسم العلوي */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-16 border-b border-[#E8E2D6] dark:border-[#26211C]">
        {/* الجاليري */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* المصغرات الجانبية */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible shrink-0 pb-2 sm:pb-0 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setImgIndex(idx)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 border overflow-hidden shrink-0 transition-all ${
                    imgIndex === idx
                      ? "border-[#1A1816] dark:border-[#D4AF37] ring-1 ring-[#1A1816] dark:ring-[#D4AF37]"
                      : "border-[#E0D9CE] dark:border-[#2C2621] opacity-65 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt=""
                    width={80}
                    height={96}
                    className="w-full h-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}

          {/* الصورة الرئيسية */}
          <div className="relative flex-grow h-[500px] sm:h-[550px] lg:h-[580px] bg-[#F2EFE9] dark:bg-[#151311] border border-[#E3DCD2] dark:border-[#26211C] overflow-hidden group">
            <motion.div
              key={imgIndex}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full"
            >
              <Image
                src={images[imgIndex]}
                alt={product.name}
                width={800}
                height={600}
                className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
                  outOfStock ? "out-of-stock" : ""
                }`}
              />
            </motion.div>

            {/* أسهم التنقل */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImg}
                  aria-label="Previous image"
                  className="absolute start-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 dark:bg-[#201C18]/85 hover:bg-white dark:hover:bg-[#2A241E] text-ink dark:text-[#FAF8F5] flex items-center justify-center shadow-md opacity-80 hover:opacity-100 transition-opacity"
                >
                  <span className="rtl:rotate-180">‹</span>
                </button>
                <button
                  onClick={nextImg}
                  aria-label="Next image"
                  className="absolute end-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 dark:bg-[#201C18]/85 hover:bg-white dark:hover:bg-[#2A241E] text-ink dark:text-[#FAF8F5] flex items-center justify-center shadow-md opacity-80 hover:opacity-100 transition-opacity"
                >
                  <span className="rtl:rotate-180">›</span>
                </button>
              </>
            )}

            {/* شارة الخصم */}
            {hasDiscount && selected && (
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="absolute top-4 start-4 bg-gradient-to-br from-[#D4AF37] to-[#B88E4F] text-white text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
              >
                <span className="text-lg">✦</span>
                <span>-{Math.round(((selected.price - finalPrice) / selected.price) * 100)}%</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* المعلومات */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-muted dark:text-[#9E9589] uppercase tracking-[0.2em] mb-2 font-medium">
              <span>{tr.brand}</span>
              <span className="px-2 py-0.5 border border-line-2 dark:border-[#38312A]">
                {product.category === "men"
                  ? tr.men
                  : product.category === "women"
                  ? tr.women
                  : tr.unisex}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl text-ink dark:text-[#FAF8F5] font-medium tracking-tight mb-4">
              {product.name}
            </h1>

            {/* الوصف */}
            {product.description && (
              <div className="mb-6">
                <h4 className="text-xs uppercase tracking-widest text-ink dark:text-[#FAF8F5] font-semibold mb-2">
                  {lang === "ar" ? "الوصف العطري" : "Description"}
                </h4>
                <p className="text-xs sm:text-sm text-charcoal dark:text-[#C4BCB1] leading-relaxed font-light whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* بطاقة السعر */}
            <div className="p-4 bg-[#F2EFE9] dark:bg-[#171513] border border-[#E3DCD2] dark:border-[#2C2621] mb-6 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-charcoal dark:text-[#A8A096] block mb-0.5">
                  {lang === "ar" ? "السعر الحالي" : "Selected Flacon Price"}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-semibold text-ink dark:text-[#FAF8F5]">
                    {formatEGP(finalPrice)}
                  </span>
                  {hasDiscount && selected && (
                    <span className="text-sm text-muted dark:text-[#7A7268] line-through">
                      {formatEGP(selected.price)}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-end">
                {outOfStock ? (
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-medium tracking-wider uppercase block">
                    {tr.outOfStock}
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium tracking-wider uppercase block">
                    {lang === "ar" ? "متوفر وجاهز للطلب" : "In Stock & Ready"}
                  </span>
                )}
                {selected && selected.stock > 0 && selected.stock <= 5 && (
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">
                    ⚡ {lang === "ar" ? `باقي ${selected.stock} فقط` : `Only ${selected.stock} left`}
                  </span>
                )}
              </div>
            </div>

            {/* اختيار الحجم */}
            {variants.length > 0 && (
              <div className="mb-6">
                <label className="text-xs uppercase tracking-widest text-ink dark:text-[#FAF8F5] font-semibold block mb-2">
                  {tr.size}:{" "}
                  <span className="font-normal text-gold-dark dark:text-[#D4AF37]">
                    {selected ? `${selected.size_ml}ml` : "—"}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {variants.map((v) => {
                    const active = selected?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedId(v.id);
                          setQuantity(1);
                        }}
                        disabled={v.stock === 0}
                        className={`py-3 px-4 text-xs tracking-wider uppercase border transition-all flex items-center justify-between ${
                          v.stock === 0
                            ? "opacity-40 cursor-not-allowed border-line text-muted"
                            : active
                            ? "border-[#1A1816] dark:border-[#D4AF37] bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] font-semibold"
                            : "border-line-2 dark:border-[#38312A] hover:border-ink dark:hover:border-[#D4AF37] text-ink dark:text-[#FAF8F5] bg-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                              active
                                ? "border-[#FAF9F6] dark:border-[#0E0D0C]"
                                : "border-muted dark:border-[#6B6359]"
                            }`}
                          >
                            {active && (
                              <span className="w-1.5 h-1.5 bg-[#FAF9F6] dark:bg-[#0E0D0C] rounded-full" />
                            )}
                          </span>
                          <span className="font-medium">{v.size_ml}ml</span>
                        </div>
                        <span className="font-semibold">{formatEGP(getFinalPrice(v))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* الكمية + السلة + المفضلة */}
            <div className="flex gap-3 pt-2">
              <div className="flex items-center border border-line-2 dark:border-[#38312A] bg-surface dark:bg-[#1A1714]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-3 text-xs text-charcoal dark:text-[#C4BCB1] hover:text-ink dark:hover:text-[#FAF8F5]"
                  aria-label="−"
                >
                  −
                </button>
                <span className="px-3 py-3 text-xs font-semibold min-w-[2.5rem] text-center text-ink dark:text-[#FAF8F5]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => (selected ? Math.min(selected.stock, q + 1) : q))}
                  className="px-3 py-3 text-xs text-charcoal dark:text-[#C4BCB1] hover:text-ink dark:hover:text-[#FAF8F5]"
                  aria-label="+"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={`flex-grow py-3.5 px-6 uppercase tracking-[0.2em] text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md ${
                  outOfStock
                    ? "bg-surface-2 text-muted cursor-not-allowed"
                    : added
                    ? "bg-emerald-700 text-white"
                    : "bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#38332D] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C]"
                }`}
              >
                {added ? (
                  <span>✓ {tr.addedToCart}</span>
                ) : outOfStock ? (
                  tr.outOfStock
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7Zm3 0V5a3 3 0 0 1 6 0v2" />
                    </svg>
                    <span>{tr.addToCart}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => toggleFavorite(product.slug)}
                aria-label={tr.favorites}
                className={`p-3.5 border transition-colors flex items-center justify-center ${
                  fav
                    ? "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                    : "border-line-2 dark:border-[#38312A] hover:border-ink dark:hover:border-[#D4AF37] text-charcoal dark:text-[#C4BCB1] bg-surface dark:bg-[#1A1714]"
                }`}
              >
                <svg className={`w-5 h-5 ${fav ? "fill-rose-600 dark:fill-rose-400" : ""}`} fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.6c0 5-7.5 9.4-9 9.4s-9-4.4-9-9.4a4.6 4.6 0 0 1 9-1.4 4.6 4.6 0 0 1 9 1.4Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* شريط الضمانات */}
          <div className="mt-8 pt-6 border-t border-[#E8E2D6] dark:border-[#26211C] grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider text-charcoal dark:text-[#A8A096]">
            <div className="flex flex-col items-center gap-1">
              <span className="text-gold-dark dark:text-[#D4AF37] text-base">🚚</span>
              <span>{tr.deliveryToDoor}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-gold-dark dark:text-[#D4AF37] text-base">🛡️</span>
              <span>{tr.authentic}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-gold-dark dark:text-[#D4AF37] text-base">💵</span>
              <span>{tr.cod}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── التقييمات ── */}
      <ReviewsSection productId={product.id} lang={lang} />

      {/* ── منتجات مشابهة ── */}
      <section className="mt-20">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-dark dark:text-[#D4AF37] font-semibold mb-1">
            {lang === "ar" ? "من نفس العائلة العطرية" : "From The Same Olfactory Family"}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-ink dark:text-[#FAF8F5]">
            {tr.mayAlsoLike}
          </h2>
        </div>
        <ProductsGrid category={product.category} limit={4} excludeSlug={product.slug} />
      </section>
    </div>
  );
}

// ── قسم المراجعات — مطابق لتصميم l'élixir ───────────────────

interface ReviewRow {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  verified_purchase: boolean;
  created_at: string;
}

function ReviewsSection({
  productId,
  lang,
}: {
  productId: string;
  lang: "ar" | "en";
}) {
  const tr = t[lang];
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (!cancelled) setReviews(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const safeReviews = reviews ?? [];
  const total = safeReviews.length;
  const avg = total ? safeReviews.reduce((s, r) => s + r.rating, 0) / total : 0;

  const starBreakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = safeReviews.filter((r) => r.rating === stars).length;
    return { stars, count, pct: total ? (count / total) * 100 : 0 };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || rating === 0) {
      setFormError(lang === "ar" ? "اكتب اسمك واختار تقييم" : "Add your name and a rating");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      customer_name: name.trim().slice(0, 60),
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setFormError(lang === "ar" ? "حصل خطأ، جرب تاني" : "Something went wrong, try again");
      return;
    }
    setSubmitted(true);
  }

  return (
    <section className="pt-16 max-w-5xl mx-auto">
      <div className="mb-10 text-center sm:text-start">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-dark dark:text-[#D4AF37] font-semibold mb-1">
          {lang === "ar" ? "تجارب العملاء" : "Authentic Feedback"}
        </p>
        <h2 className="font-display text-3xl text-ink dark:text-[#FAF8F5] tracking-tight">
          {tr.customerReviews}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* الملخص + أشرطة التوزيع */}
        <div className="md:col-span-5 bg-[#F2EFE9] dark:bg-[#171513] border border-[#E3DCD2] dark:border-[#2C2621] p-6 sm:p-8">
          <div className="text-center pb-6 border-b border-line-2 dark:border-[#2E2822]">
            <span className="font-display text-5xl font-medium text-ink dark:text-[#FAF8F5]">
              {total ? avg.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-charcoal dark:text-[#A8A096] ms-1">/ 5.0</span>
            <div className="flex justify-center mt-2">
              <StarRating value={Math.round(avg)} size="text-lg" />
            </div>
            <p className="text-xs text-charcoal dark:text-[#A8A096] uppercase tracking-wider mt-2">
              {lang === "ar"
                ? `بناءً على ${total} تقييماً معتمداً`
                : `Based on ${total} verified reviews`}
            </p>
          </div>

          <div className="space-y-2.5 pt-6">
            {starBreakdown.map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <span className="w-6 text-end font-medium text-ink dark:text-[#FAF8F5]">
                  {item.stars} ★
                </span>
                <div className="flex-grow h-2 bg-line-2 dark:bg-[#28231E] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1A1816] dark:bg-[#D4AF37]"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="w-8 text-charcoal dark:text-[#A8A096] text-[11px] text-end">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* القائمة + النموذج */}
        <div className="md:col-span-7 space-y-8">
          {/* نموذج الإضافة */}
          <div className="p-6 bg-surface dark:bg-[#171513] border border-[#E3DCD2] dark:border-[#2C2621]">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-ink dark:text-[#FAF8F5] mb-4">
              {tr.writeReview}
            </h4>

            {submitted ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800/50">
                {lang === "ar"
                  ? "تم استلام تقييمك! هيظهر بعد مراجعة سريعة من فريقنا 🙏"
                  : "Thank you! Your review will appear after a quick moderation."}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-charcoal dark:text-[#A8A096] mb-1">
                      {tr.yourName} *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={60}
                      className="w-full bg-cream dark:bg-[#100F0D] border border-line-2 dark:border-[#332D27] p-2 text-xs text-ink dark:text-[#FAF8F5] focus:outline-none focus:border-gold-dark dark:focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-charcoal dark:text-[#A8A096] mb-1">
                      {lang === "ar" ? "التقييم *" : "Rating *"}
                    </label>
                    <div className="flex items-center h-[34px]">
                      <StarRating value={rating} onChange={setRating} interactive size="text-xl" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-charcoal dark:text-[#A8A096] mb-1">
                    {tr.yourOpinion}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full bg-cream dark:bg-[#100F0D] border border-line-2 dark:border-[#332D27] p-2 text-xs text-ink dark:text-[#FAF8F5] focus:outline-none focus:border-gold-dark dark:focus:border-[#D4AF37] resize-none"
                  />
                </div>
                {formError && (
                  <p className="text-red-600 dark:text-red-400 text-xs">{formError}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#38332D] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C] text-xs uppercase tracking-widest font-semibold px-6 py-2.5 transition-colors disabled:opacity-50"
                >
                  {submitting ? "..." : tr.sendReview}
                </button>
              </form>
            )}
          </div>

          {/* قائمة المراجعات */}
          {reviews === null ? (
            <>
              <div className="skeleton h-24" />
              <div className="skeleton h-24" />
            </>
          ) : total === 0 ? (
            <div className="p-8 text-center bg-[#F5F2EA] dark:bg-[#151311] border border-line text-charcoal font-light text-sm">
              {tr.noReviews}
            </div>
          ) : (
            safeReviews.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-5 bg-surface dark:bg-[#171513] border border-[#E3DCD2] dark:border-[#2C2621]"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F2EFE9] dark:bg-[#221E1A] flex items-center justify-center text-sm font-bold text-ink dark:text-[#FAF8F5]">
                      {r.customer_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-ink dark:text-[#FAF8F5]">
                        {r.customer_name}
                        {r.verified_purchase && (
                          <span className="ms-2 text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 uppercase tracking-wider">
                            ✓ {tr.verifiedPurchase}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <StarRating value={r.rating} />
                </div>
                {r.comment && (
                  <p className="text-charcoal dark:text-[#C4BCB1] text-sm leading-relaxed mt-3 font-light">
                    {r.comment}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
