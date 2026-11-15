"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useCart } from "@/lib/store";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";
import { formatEGP } from "@/lib/pricing";

export default function CartPage() {
  const {
    items,
    isReady,
    subtotal,
    discountTotal,
    total,
    updateQuantity,
    removeItem,
    clearCart,
    refreshStock,
  } = useCart();
  const { lang } = useUIPrefs();
  const tr = t[lang];

  // تحديث الستوك عند فتح صفحة السلة
  useEffect(() => {
    if (isReady && items.length > 0) {
      refreshStock();
    }
  }, [isReady, items.length]);

  if (!isReady)
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
    );

  if (items.length === 0)
    return (
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20 text-center bg-surface dark:bg-[#151311] border border-[#EBE5DA] dark:border-[#26211C] p-8 max-w-lg mx-auto shadow-sm">
            <svg className="w-12 h-12 mx-auto text-line-2 dark:text-[#38312A] mb-4" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7Zm3 0V5a3 3 0 0 1 6 0v2" />
            </svg>
            <h1 className="font-display text-xl text-ink dark:text-[#FAF8F5] mb-2">
              {lang === "ar" ? "حقيبة التسوق فارغة حالياً." : "Your luxury cart is empty."}
            </h1>
            <p className="text-xs text-charcoal dark:text-[#A8A096] mb-6 max-w-xs mx-auto">
              {lang === "ar"
                ? "اختر عطرك المميز وابدأ تجربة الفخامة."
                : "Explore our catalog and discover your signature flacon."}
            </p>
            <Link
              href="/products"
              className="px-6 py-2.5 bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#34302C] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C] text-xs uppercase tracking-widest font-semibold transition-colors"
            >
              {tr.continueShopping}
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-dark dark:text-[#D4AF37] font-semibold mb-2">
            {lang === "ar" ? "حقيبة التسوق" : "Shopping Bag"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink dark:text-[#FAF8F5]">
            {tr.yourCart}
            <span className="text-base text-muted dark:text-[#9E9589] font-sans font-normal">
              {" "}({items.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </h1>
        </div>

        <div className="bg-surface dark:bg-[#151311] border border-[#E3DCD2] dark:border-[#26211C] p-6 sm:p-8 shadow-sm">
          <div className="space-y-0">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.variantId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="flex gap-4 py-5 border-b border-[#EBE5DA] dark:border-[#221D18] items-center first:pt-0 last:border-b-0"
                >
                  {/* المصغرة */}
                  <Link
                    href={`/products/${item.slug}`}
                    className="w-16 h-20 shrink-0 bg-[#F2EFE9] dark:bg-[#1A1714] border border-line-2 dark:border-[#2E2822] overflow-hidden"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        width={64}
                        height={80}
                        className="w-full h-full object-cover object-center"
                      />
                    )}
                  </Link>

                  {/* المعلومات */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-display text-sm font-medium text-ink dark:text-[#FAF8F5] hover:text-gold-dark dark:hover:text-[#D4AF37] transition-colors truncate block"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-[11px] text-muted dark:text-[#9E9589] uppercase tracking-wider mt-0.5">
                      {item.sizeMl}ml
                    </p>
                    {item.finalPrice < item.unitPrice && (
                      <p className="text-[11px] mt-0.5">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                          {formatEGP(item.finalPrice)}
                        </span>
                        <span className="text-muted line-through ms-2">
                          {formatEGP(item.unitPrice)}
                        </span>
                      </p>
                    )}
                    {item.finalPrice >= item.unitPrice && (
                      <p className="text-[11px] font-medium text-ink dark:text-[#FAF8F5] mt-0.5">
                        {formatEGP(item.finalPrice)}
                      </p>
                    )}

                    {/* الكمية + إزالة */}
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center border border-line-2 dark:border-[#38312A] bg-cream dark:bg-[#1A1714] text-xs">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-2 py-0.5 text-charcoal dark:text-[#C4BCB1] hover:text-ink dark:hover:text-[#FAF8F5]"
                          aria-label="−"
                        >
                          −
                        </button>
                        <span className="px-2.5 py-0.5 font-semibold text-ink dark:text-[#FAF8F5]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-2 py-0.5 text-charcoal dark:text-[#C4BCB1] hover:text-ink dark:hover:text-[#FAF8F5]"
                          aria-label="+"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-muted dark:text-[#7A7268] hover:text-red-500 transition-colors"
                        title={lang === "ar" ? "إزالة" : "Remove"}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.9 12.1A2 2 0 0 1 16.1 21H7.9a2 2 0 0 1-2-1.9L5 7m5 4v6m4-6v6M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* إجمالي السطر */}
                  <div className="text-end shrink-0">
                    <span className="font-display text-sm font-semibold text-ink dark:text-[#FAF8F5]">
                      {formatEGP(item.finalPrice * item.quantity)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* الحسابات */}
          <div className="pt-6 mt-2 border-t border-[#EBE5DA] dark:border-[#26211C] space-y-1.5 text-xs">
            <div className="flex justify-between text-charcoal dark:text-[#A8A096]">
              <span>{tr.subtotal}</span>
              <span className="font-medium text-ink dark:text-[#FAF8F5]">{formatEGP(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-charcoal dark:text-[#A8A096]">
                <span>{lang === "ar" ? "الخصم" : "Discount"}</span>
                <span className="font-medium text-emerald-800 dark:text-emerald-400">
                  − {formatEGP(discountTotal)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-charcoal dark:text-[#A8A096]">
              <span>{tr.delivery}</span>
              <span>{lang === "ar" ? "يُحسب عند إتمام الطلب" : "Calculated at checkout"}</span>
            </div>
            <div className="flex justify-between text-base font-display font-semibold text-ink dark:text-[#FAF8F5] pt-3 mt-2 border-t border-[#EBE5DA] dark:border-[#26211C]">
              <span>{tr.total}</span>
              <span>{formatEGP(total)}</span>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/checkout"
              className="flex-1 text-center py-4 bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#34302C] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C] text-xs uppercase tracking-[0.2em] font-semibold transition-colors shadow-md"
            >
              {tr.checkout} →
            </Link>
            <button
              onClick={clearCart}
              className="px-6 py-4 border border-line-2 dark:border-[#38312A] text-charcoal dark:text-[#C4BCB1] hover:border-red-400 hover:text-red-500 text-xs uppercase tracking-widest font-medium transition-colors"
            >
              {lang === "ar" ? "إفراغ الحقيبة" : "Clear Bag"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
