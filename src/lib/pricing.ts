/**
 * دوال حساب الأسعار والعروض
 * 
 * @module pricing
 */

import type { Product, ProductVariant, Offer } from "./types";

/**
 * يحصل على العرض النشط لمتغير منتج معين
 * يتحقق من تواريخ البداية والنهاية باستخدام UTC لتجنب مشاكل timezone
 * 
 * @param {ProductVariant} variant - متغير المنتج
 * @returns {Offer | null} العرض النشط أو null إذا لم يكن هناك عرض نشط
 * 
 * @example
 * const offer = getActiveOffer(variant);
 * if (offer) {
 *   console.log(`Discount: ${offer.discount_value}${offer.discount_type === 'percentage' ? '%' : ' EGP'}`);
 * }
 */
export function getActiveOffer(variant: ProductVariant): Offer | null {
  // Supabase يرجع offer:offers(*) كـ Array أحياناً — نعمل normalize
  const raw = variant.offer;
  const offer: Offer | null = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);

  if (!offer || !offer.is_active) return null;
  
  const now = Date.now();
  // استخدام UTC لتجنب مشاكل timezone
  if (offer.start_at && new Date(offer.start_at).getTime() > now) return null;
  if (offer.end_at && new Date(offer.end_at).getTime() < now) return null;
  
  return offer;
}

/**
 * يحسب السعر النهائي لمتغير المنتج بعد تطبيق الخصم
 * 
 * @param {ProductVariant} variant - متغير المنتج
 * @returns {number} السعر النهائي بعد الخصم
 * 
 * @example
 * const finalPrice = getFinalPrice(variant);
 * console.log(`Final price: ${finalPrice} EGP`);
 */
export function getFinalPrice(variant: ProductVariant): number {
  const offer = getActiveOffer(variant);
  if (!offer) return variant.price;
  
  if (offer.discount_type === "percentage") {
    return Math.round(variant.price * (1 - offer.discount_value / 100));
  }
  return Math.max(0, variant.price - offer.discount_value);
}

/** أرخص سعر نهائي بين المتاحات — للعرض على الكارت */
/**
 * يحسب نطاق الأسعار لمنتج مع جميع متغيراته
 * 
 * @param {Product} product - المنتج
 * @returns {{min: number, max: number}} نطاق الأسعار
 * 
 * @example
 * const range = getPriceRange(product);
 * console.log(`Price range: ${range.min} - ${range.max} EGP`);
 */
export function getPriceRange(product: Product): {
  min: number;
  max: number;
  minOriginal?: number;
  hasDiscount: boolean;
} {
  const active = (product.variants ?? []).filter((v) => v.is_active);
  if (active.length === 0)
    return { min: 0, max: 0, hasDiscount: false };

  const finals = active.map((v) => getFinalPrice(v));
  const originals = active.map((v) => v.price);
  const min = Math.min(...finals);
  const max = Math.max(...finals);
  const minOriginal = Math.min(...originals);
  return {
    min,
    max,
    minOriginal: minOriginal > min ? minOriginal : undefined,
    hasDiscount: finals.some((f, i) => f < originals[i]),
  };
}

/** هل المنتج متاح (عليه ستوك)؟ */
/**
 * التحقق من توفر المنتج (يوجد متغير نشط مع مخزون)
 * 
 * @param {Product} product - المنتج
 * @returns {boolean} true إذا كان المنتج متاحاً
 * 
 * @example
 * if (isProductAvailable(product)) {
 *   console.log('Product is available');
 * }
 */
export function isProductAvailable(product: Product): boolean {
  return (product.variants ?? []).some((v) => v.is_active && v.stock > 0);
}

/**
 * تنسيق السعر بالجنيه المصري
 * 
 * @param {number} amount - المبلغ المراد تنسيقه
 * @returns {string} السعر منسقاً بالجنيه المصري
 * 
 * @example
 * formatEGP(1500) // "1,500 ج.م"
 */
export function formatEGP(amount: number): string {
  // أرقام إنجليزية (12345) دايمًا — مهما كانت لغة الواجهة
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount)} EGP`;
}

/**
 * تنسيق التاريخ بالعربية
 * 
 * @param {string} iso - التاريخ بصيغة ISO
 * @returns {string} التاريخ منسقاً بالعربية
 * 
 * @example
 * formatDateAr('2024-01-15') // "١٥ يناير ٢٠٢٤"
 */
export function formatDateAr(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
