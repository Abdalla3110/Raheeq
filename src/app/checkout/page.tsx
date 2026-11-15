"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/store";
import { useUIPrefs } from "@/lib/ui-prefs";
import { useToast } from "@/components/Toast";
import { t } from "@/lib/translations";
import { formatEGP } from "@/lib/pricing";
import { EGYPT_GOVERNORATES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { validateEgyptianPhone } from "@/lib/validation";

// دالة آمنة لتوليد CSRF token
function generateCSRFToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function CheckoutPage() {
  const { items, isReady, subtotal, discountTotal, total, clearCart } = useCart();
  const { lang } = useUIPrefs();
  const tr = t[lang];
  const router = useRouter();
  const { showToast } = useToast();

  const [csrfToken, setCsrfToken] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    governorate: "",
    city: "",
    address: "",
    notes: "",
  });
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // توليد CSRF token عند تحميل الصفحة
  useEffect(() => {
    setCsrfToken(generateCSRFToken());
  }, []);

  useEffect(() => {
    if (!form.governorate) {
      setShippingFee(null);
      return;
    }
    const supabase = createClient();
    supabase
      .from("shipping_zones")
      .select("delivery_fee, is_active")
      .eq("governorate", form.governorate)
      .maybeSingle()
      .then(({ data }) => {
        setShippingFee(data && data.is_active ? data.delivery_fee : null);
      });
  }, [form.governorate]);

  const grandTotal = total + (shippingFee ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim())
      return setError(lang === "ar" ? "اكتب الاسم بالكامل" : "Full name is required");
    if (!validateEgyptianPhone(form.phone.trim()))
      return setError(
        lang === "ar"
          ? "اكتب رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)"
          : "Enter a valid Egyptian phone (11 digits starting 01)"
      );
    if (!form.governorate)
      return setError(lang === "ar" ? "اختار المحافظة" : "Select your governorate");
    if (!form.city.trim())
      return setError(lang === "ar" ? "اكتب المدينة / المنطقة" : "City is required");
    if (!form.address.trim())
      return setError(lang === "ar" ? "اكتب العنوان بالتفصيل" : "Street address is required");

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            governorate: form.governorate,
            city: form.city.trim(),
            address: form.address.trim(),
            notes: form.notes.trim() || undefined,
          },
          items: items.map((i) => ({
            variant_id: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حصل خطأ في إتمام الطلب، جرب تاني");
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/order-success?order=${data.orderNumber}`);
      showToast("تم استلام طلبك بنجاح!", "success");
    } catch {
      setError("تعذر الاتصال، تأكد من الإنترنت وجرب تاني");
      setSubmitting(false);
      showToast("حدث خطأ في الاتصال", "error");
    }
  }

  if (!isReady) return <div className="max-w-6xl mx-auto px-4 py-12 skeleton h-96" />;

  if (items.length === 0)
    return (
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20 text-center bg-surface dark:bg-[#151311] border border-[#EBE5DA] dark:border-[#26211C] p-8 max-w-lg mx-auto shadow-sm">
            <h1 className="font-display text-xl text-ink dark:text-[#FAF8F5] mb-2">
              {lang === "ar" ? "حقيبة التسوق فارغة حالياً." : "Your luxury cart is empty."}
            </h1>
            <p className="text-xs text-charcoal dark:text-[#A8A096] mb-6">
              {lang === "ar" ? "ضيف عطور للسلة الأول" : "Add fragrances before checkout."}
            </p>
            <a
              href="/products"
              className="px-6 py-2.5 bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#34302C] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C] text-xs uppercase tracking-widest font-semibold transition-colors"
            >
              {tr.continueShopping}
            </a>
          </div>
        </div>
      </div>
    );

  const inputCls =
    "w-full bg-[#FAF9F6] dark:bg-[#100F0D] border border-[#DDD7CC] dark:border-[#38312A] p-3 text-xs text-[#1A1816] dark:text-[#FAF8F5] focus:outline-none focus:border-[#9E7438] dark:focus:border-[#D4AF37]";
  const labelCls =
    "block text-xs uppercase tracking-wider text-[#595248] dark:text-[#C4BCB1] font-medium mb-1";

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <a
          href="/cart"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-charcoal dark:text-[#A8A096] hover:text-ink dark:hover:text-[#FAF8F5] transition-colors mb-8 group"
        >
          <span className="rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform">←</span>
          <span>{lang === "ar" ? "العودة لحقيبة التسوق" : "Return to Shopping Bag"}</span>
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* اليسار: فورم الشحن */}
          <div className="lg:col-span-7">
            <div className="bg-surface dark:bg-[#151311] border border-[#E3DCD2] dark:border-[#26211C] p-6 sm:p-8 shadow-sm">
              <div className="border-b border-[#EBE5DA] dark:border-[#26211C] pb-4 mb-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold-dark dark:text-[#D4AF37] font-semibold mb-1">
                  <span>🚚</span>
                  <span>{lang === "ar" ? "بيانات الشحن والتوصيل" : "Shipping Information"}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-[#FAF8F5]">
                  {lang === "ar" ? "إتمام طلبك الفاخر" : "Complete Your Order"}
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      {lang === "ar" ? "الاسم بالكامل" : "Full Name"} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      className={inputCls}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={lang === "ar" ? "أحمد محمد" : "Ahmed Mohamed"}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {lang === "ar" ? "رقم الهاتف / الواتساب" : "Phone Number"} *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      className={inputCls}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="01012345678"
                      inputMode="tel"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      {lang === "ar" ? "المحافظة" : "Governorate"} *
                    </label>
                    <select
                      className={`${inputCls} cursor-pointer`}
                      value={form.governorate}
                      onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                    >
                      <option value="">{lang === "ar" ? "اختار المحافظة" : "Select..."}</option>
                      {EGYPT_GOVERNORATES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>
                      {lang === "ar" ? "المدينة / المنطقة" : "City / District"} *
                    </label>
                    <input
                      type="text"
                      name="city"
                      autoComplete="address-level2"
                      className={inputCls}
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder={lang === "ar" ? "مدينة نصر" : "New Cairo"}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    {lang === "ar"
                      ? "العنوان بالتفصيل (الشارع والعمارة)"
                      : "Street Address"}{" "}
                    *
                  </label>
                  <textarea
                    name="address"
                    autoComplete="street-address"
                    className={`${inputCls} resize-none`}
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder={
                      lang === "ar"
                        ? "اسم الشارع، رقم العمارة، الدور، علامة مميزة..."
                        : "Street, building, floor, landmark..."
                    }
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    {lang === "ar" ? "ملاحظات خاصة بالتوصيل" : "Order Notes (Optional)"}
                  </label>
                  <textarea
                    name="notes"
                    className={`${inputCls} resize-none`}
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder={
                      lang === "ar"
                        ? "أي تفاصيل إضافية للمندوب أو وقت التسليم المفضل..."
                        : "Special delivery instructions or preferred time..."
                    }
                  />
                </div>

                {/* كاش عند الاستلام */}
                <div className="p-4 bg-[#F2EFE9] dark:bg-[#1A1714] border border-[#E3DCD2] dark:border-[#2E2822] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#1A1816] dark:border-[#D4AF37] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-[#1A1816] dark:bg-[#D4AF37]" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-ink dark:text-[#FAF8F5] block uppercase tracking-wider">
                        {tr.cod}
                      </span>
                      <span className="text-[11px] text-charcoal dark:text-[#A8A096]">
                        {lang === "ar"
                          ? "الدفع نقداً عند وصول المندوب ومعاينة الطلب"
                          : "Pay safely with cash upon delivery and inspection"}
                      </span>
                    </div>
                  </div>
                  <span className="text-muted">🔒</span>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-xs"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#1A1816] dark:bg-[#D4AF37] hover:bg-[#34302C] dark:hover:bg-[#B88E4F] text-[#FAF9F6] dark:text-[#0E0D0C] text-xs uppercase tracking-[0.2em] font-semibold transition-colors disabled:opacity-60 shadow-md"
                >
                  {submitting ? (
                    <span className="animate-pulse">
                      {lang === "ar" ? "جاري تسجيل الطلب..." : "Processing Order..."}
                    </span>
                  ) : (
                    <>✓ {tr.placeOrder}</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* اليمين: ملخص الطلب */}
          <div className="lg:col-span-5 bg-surface dark:bg-[#151311] border border-[#E3DCD2] dark:border-[#26211C] p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-xl text-ink dark:text-[#FAF8F5] pb-4 mb-4 border-b border-[#EBE5DA] dark:border-[#26211C]">
              {lang === "ar" ? "ملخص الطلب" : "Order Summary"}
            </h2>

            <div className="space-y-4 max-h-80 overflow-y-auto pb-4 border-b border-[#EBE5DA] dark:border-[#26211C]">
              {items.map((i) => (
                <div key={i.variantId} className="flex items-center gap-3">
                  <div className="w-14 h-16 object-cover border border-[#E0D9CE] dark:border-[#2A241E] shrink-0 bg-[#F2EFE9] dark:bg-[#1A1714] overflow-hidden">
                    {i.image && (
                      <Image
                        src={i.image}
                        alt={i.productName}
                        width={56}
                        height={64}
                        className="w-full h-full object-cover object-center"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-display font-medium text-ink dark:text-[#FAF8F5] truncate">
                      {i.productName}
                    </h4>
                    <p className="text-[11px] text-muted dark:text-[#9E9589]">
                      {i.sizeMl}ml × {i.quantity}
                    </p>
                  </div>
                  <div className="text-end text-xs font-semibold text-ink dark:text-[#FAF8F5] shrink-0">
                    {formatEGP(i.finalPrice * i.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-2 text-xs">
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
                <span className="font-medium text-ink dark:text-[#FAF8F5]">
                  {shippingFee === null
                    ? lang === "ar"
                      ? "اختار محافظتك"
                      : "Select governorate"
                    : formatEGP(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-base font-display font-bold text-ink dark:text-[#FAF8F5] pt-3 border-t border-[#EBE5DA] dark:border-[#26211C]">
                <span>{tr.total}</span>
                <span>{formatEGP(grandTotal)}</span>
              </div>
            </div>

            {/* صندوق الثقة */}
            <div className="mt-8 p-4 bg-cream dark:bg-[#100F0D] border border-[#E8E2D6] dark:border-[#26211C] space-y-2 text-[11px] text-charcoal dark:text-[#A8A096]">
              <div className="flex items-center gap-2 text-ink dark:text-[#FAF8F5] font-medium">
                <span className="text-gold-dark dark:text-[#D4AF37]">🛡️</span>
                <span>{lang === "ar" ? "تسوق آمن وموثوق" : "Safe & Direct Purchase"}</span>
              </div>
              <p className="leading-relaxed">
                {lang === "ar"
                  ? "يتم تغليف كل زجاجة بعناية فائقة في عبوة العطور الفاخرة المعتمدة."
                  : "Every flacon is carefully inspected and presented in our signature luxury gift box."}
              </p>
            </div>

            <p className="text-center text-[10px] text-muted dark:text-[#736B61] mt-4">
              {lang === "ar"
                ? "بالضغط على تأكيد الطلب أنت موافق على الشروط وسياسة الاستبدال"
                : "By placing your order you agree to our terms and return policy"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
