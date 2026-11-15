"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUIPrefs } from "@/lib/ui-prefs";

export default function OrderSuccessPage() {
  const { lang, isReady } = useUIPrefs();
  const ar = lang === "ar";

  // قراءة رقم الأوردر من الـ query بعد المونتاج (لتفادي مشاكل SSR)
  const [order, setOrder] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrder(params.get("order"));
  }, []);

  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-surface dark:bg-[#151311] border border-[#E3DCD2] dark:border-[#26211C] p-8 sm:p-12 text-center shadow-sm">
          {/* علامة النجاح */}
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center"
            style={{ animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
          >
            <svg className="w-9 h-9 text-emerald-700 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
            </svg>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-gold-dark dark:text-[#D4AF37] font-semibold mb-2">
            {ar ? "الدفع عند الاستلام • COD" : "CASH ON DELIVERY • COD"}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-[#FAF8F5] mb-3">
            {ar ? "شكراً جزيلاً لطلبك!" : "Thank you for your order!"}
          </h1>

          {order && (
            <p className="text-sm text-charcoal dark:text-[#C4BCB1] mb-2">
              {ar ? "رقم الطلب: " : "Order number: "}
              <span
                className="font-display font-semibold text-gold-dark dark:text-[#D4AF37] text-lg"
                dir="ltr"
              >
                #ORD-{order}
              </span>
            </p>
          )}

          <p className="text-xs text-charcoal dark:text-[#A8A096] leading-relaxed mb-8 max-w-sm mx-auto font-light">
            {ar ? (
              <>
                سنتواصل معك عبر الهاتف قريباً لتأكيد موعد الشحن والتسليم.
                <br />
                الدفع نقداً عند وصول المندوب ومعاينة الطلب 💵
              </>
            ) : (
              <>
                We&apos;ll contact you by phone shortly to confirm shipping and delivery.
                <br />
                Pay in cash upon delivery and inspection 💵
              </>
            )}
          </p>

          <div className="gold-divider w-32 mx-auto mb-8 opacity-60" />

          <Link
            href="/products"
            className="px-8 py-3.5 bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#34302C] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C] text-xs uppercase tracking-[0.2em] font-semibold transition-colors shadow-md inline-block"
          >
            {ar ? "متابعة التسوق" : "Continue Shopping"}
          </Link>
        </div>
      </div>
    </div>
  );
}
