"use client";

import { useState, useEffect, useRef } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface VariantDraft {
  id?: string; // موجود لو متاح محفوظ قبل كده
  sku: string;
  size_ml: number;
  price: number;
  stock: number;
  is_active: boolean;
  // عرض
  offerActive: boolean;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startAt: string;
  endAt: string;
  offerId?: string;
}

export default function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const supabase = createClient();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "unisex");
  const [status, setStatus] = useState<Product["status"]>(
    product?.status ?? "published"
  );
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [metaTitle, setMetaTitle] = useState(product?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    product?.meta_description ?? ""
  );
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);

  const [variants, setVariants] = useState<VariantDraft[]>(
    (product?.variants ?? []).map((v: ProductVariant) => {
      const offer = Array.isArray(v.offer) ? v.offer[0] : v.offer;
      return {
        id: v.id,
        sku: v.sku,
        size_ml: v.size_ml,
        price: v.price,
        stock: v.stock,
        is_active: v.is_active,
        offerActive: !!offer?.is_active,
        discountType: offer?.discount_type ?? "percentage",
        discountValue: offer?.discount_value ?? 0,
        startAt: offer?.start_at?.slice(0, 16) ?? "",
        endAt: offer?.end_at?.slice(0, 16) ?? "",
        offerId: offer?.id,
      };
    })
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const hasUnsavedChanges = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // التحقق من وجود تغييرات غير محفوظة
  const checkUnsavedChanges = () => {
    const initialName = product?.name ?? "";
    const initialSlug = product?.slug ?? "";
    const initialDescription = product?.description ?? "";
    const initialCategory = product?.category ?? "unisex";
    const initialStatus = product?.status ?? "published";
    const initialFeatured = product?.featured ?? false;
    const initialImages = product?.images ?? [];
    const initialVariants = (product?.variants ?? []).map((v: ProductVariant) => {
      const offer = Array.isArray(v.offer) ? v.offer[0] : v.offer;
      return {
        id: v.id,
        sku: v.sku,
        size_ml: v.size_ml,
        price: v.price,
        stock: v.stock,
        is_active: v.is_active,
        offerActive: !!offer?.is_active,
        discountType: offer?.discount_type ?? "percentage",
        discountValue: offer?.discount_value ?? 0,
        startAt: offer?.start_at?.slice(0, 16) ?? "",
        endAt: offer?.end_at?.slice(0, 16) ?? "",
        offerId: offer?.id,
      };
    });

    return (
      name !== initialName ||
      slug !== initialSlug ||
      description !== initialDescription ||
      category !== initialCategory ||
      status !== initialStatus ||
      featured !== initialFeatured ||
      JSON.stringify(images) !== JSON.stringify(initialImages) ||
      JSON.stringify(variants) !== JSON.stringify(initialVariants)
    );
  };

  // منع إغلاق الصفحة بدون تأكيد
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [name, slug, description, category, status, featured, images, variants, product]);

  // Focus trap للـ dialog
  useEffect(() => {
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const dialog = document.querySelector('form');
      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  function handleClose() {
    if (checkUnsavedChanges()) {
      if (confirm("لديك تغييرات غير محفوظة. هل أنت متأكد من إغلاق النموذج؟")) {
        onClose();
      }
    } else {
      onClose();
    }
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      {
        sku: "",
        size_ml: 50,
        price: 0,
        stock: 0,
        is_active: true,
        offerActive: false,
        discountType: "percentage",
        discountValue: 0,
        startAt: "",
        endAt: "",
      },
    ]);
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v))
    );
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");

    const bucket = "product-images";
    const uploaded: string[] = [];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

    for (const file of Array.from(files).slice(0, 5)) {
      // التحقق من نوع الملف
      if (!allowedTypes.includes(file.type)) {
        setError(
          "نوع الملف غير مدعوم — يرجى رفع صور (JPG, PNG, WebP, GIF)"
        );
        setUploading(false);
        return;
      }

      // التحقق من حجم الملف
      if (file.size > maxFileSize) {
        setError(
          `حجم الصورة كبير جداً — الحد الأقصى 5MB (الصورة الحالية: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
        );
        setUploading(false);
        return;
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type });

      if (upErr) {
        setError(
          "فشل رفع الصورة — اتأكد إن bucket اسمه product-images ومسموح بالرفع"
        );
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setImages((prev) => [...prev, ...uploaded].slice(0, 8));
    setUploading(false);
  }

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleUpload(files);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("اكتب اسم المنتج");
    const finalSlug =
      slug.trim() ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^\u0621-\u064Aa-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) ||
      `product-${Date.now()}`;
    if (variants.length === 0) return setError("ضيف حجم واحد على الأقل");
    for (const v of variants) {
      if (!v.price || v.price <= 0) return setError("اكتب سعر صحيح لكل حجم");
      if (!v.sku.trim()) return setError("اكتب SKU لكل حجم");
    }

    // التحقق من تكرار slug
    let slugExists = false;
    if (!isEdit) {
      // للمنتجات الجديدة
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("slug", finalSlug)
        .maybeSingle();
      slugExists = !!existing;
    } else if (product && finalSlug !== product.slug) {
      // للمنتجات الموجودة، التحقق من التكرار في المنتجات الأخرى
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("slug", finalSlug)
        .neq("id", product.id)
        .maybeSingle();
      slugExists = !!existing;
    }

    if (slugExists) {
      return setError("الرابط (slug) مستخدم بالفعل — اختر اسماً آخر");
    }

    setSaving(true);

    try {
      // 1) حفظ المنتج
      const productPayload = {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        category,
        status,
        featured,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        images,
      };

      let productId: string;
      if (isEdit && product) {
        const { error: upErr } = await supabase
          .from("products")
          .update({ ...productPayload, updated_at: new Date().toISOString() })
          .eq("id", product.id);
        if (upErr) throw upErr;
        productId = product.id;
      } else {
        const { data, error: insErr } = await supabase
          .from("products")
          .insert(productPayload)
          .select("id")
          .single();
        if (insErr) throw insErr;
        productId = data.id;
      }

      // 2) حفظ المتاحات والعروض
      for (const v of variants) {
        const variantPayload = {
          product_id: productId,
          sku: v.sku.trim().toUpperCase(),
          size_ml: Number(v.size_ml),
          price: Number(v.price),
          stock: Number(v.stock),
          is_active: v.is_active,
        };

        let variantId = v.id;
        if (v.id) {
          const { error: upErr } = await supabase
            .from("product_variants")
            .update(variantPayload)
            .eq("id", v.id);
          if (upErr) throw upErr;
        } else {
          const { data, error: insErr } = await supabase
            .from("product_variants")
            .insert(variantPayload)
            .select("id")
            .single();
          if (insErr) throw insErr;
          variantId = data.id;
        }

        // العرض
        const offerPayload = {
          variant_id: variantId,
          discount_type: v.discountType,
          discount_value: Number(v.discountValue),
          start_at: v.startAt ? new Date(v.startAt).toISOString() : null,
          end_at: v.endAt ? new Date(v.endAt).toISOString() : null,
          is_active: v.offerActive,
        };

        if (v.offerId) {
          if (v.offerActive) {
            const { error: offerErr } = await supabase
              .from("offers")
              .update(offerPayload)
              .eq("id", v.offerId);
            if (offerErr) throw offerErr;
          } else {
            const { error: delErr } = await supabase
              .from("offers")
              .delete()
              .eq("id", v.offerId);
            if (delErr) throw delErr;
          }
        } else if (v.offerActive) {
          const { error: offerErr } = await supabase
            .from("offers")
            .insert(offerPayload);
          if (offerErr) throw offerErr;
        }
      }

      // تحديث صفحات الموقع المخزنة فورًا عشان التعديل يظهر للزوار على طول
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: finalSlug }),
      }).catch(() => {});

      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const supaMsg =
        typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
      if (msg.includes("duplicate")) {
        setError("الـ slug مستخدم بالفعل — غيّره لقيمة فريدة");
      } else if (supaMsg.includes("permission denied") || supaMsg.includes("42501")) {
        setError(
          "مشكلة صلاحيات في قاعدة البيانات — شغّل ملف supabase/fix_grants2.sql في SQL Editor"
        );
      } else if (supaMsg) {
        setError(`فشل الحفظ: ${supaMsg}`);
      } else {
        setError("حصل خطأ في الحفظ — راجع البيانات وجرب تاني");
      }
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full bg-surface dark:bg-[#1C1916] border border-line dark:border-[#38322B] px-4 py-2.5 text-sm text-ink dark:text-[#FAF8F5] focus:outline-none focus:border-gold-dark dark:focus:border-[#D4AF37]";
  const label = "text-sm font-semibold text-charcoal dark:text-[#C8C2B8] block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="bg-cream dark:bg-[#12100E] rounded-3xl w-full max-w-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink dark:text-[#FAF8F5]">
              {isEdit ? "تعديل منتج" : "منتج جديد"}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="text-charcoal/50 dark:text-[#A8A096] text-xl hover:text-ink dark:hover:text-[#FAF8F5]"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>

          {/* البيانات الأساسية */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>اسم المنتج *</label>
              <input
                className={input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: عود ملكي"
              />
            </div>
            <div>
              <label className={label}>الرابط (slug)</label>
              <input
                className={input}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="oud-royal (يُولد تلقائيًا لو فاضي)"
                dir="ltr"
              />
            </div>
            <div>
              <label className={label}>التصنيف</label>
              <select
                className={input}
                value={category}
                onChange={(e) => setCategory(e.target.value as Product["category"])}
              >
                <option value="men">رجالي</option>
                <option value="women">حريمي</option>
                <option value="unisex">للجنسين</option>
              </select>
            </div>
            <div>
              <label className={label}>حالة النشر</label>
              <select
                className={input}
                value={status}
                onChange={(e) => setStatus(e.target.value as Product["status"])}
              >
                <option value="published">منشور</option>
                <option value="draft">مسودة</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
          </div>

          <div>
            <label className={label}>الوصف</label>
            <textarea
              className={`${input} resize-none`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف العطر، المكونات، الأرواق..."
            />
          </div>

          {/* الصور */}
          <div>
            <label className={label}>الصور (حتى 8 صور)</label>
            <div
              className={`flex flex-wrap gap-3 mb-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
                isDragging
                  ? "border-gold bg-gold/5"
                  : "border-line"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover border border-line"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                    aria-label="حذف الصورة"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed border-line flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors text-xs text-charcoal/60">
                {uploading ? "جاري الرفع..." : "+ صورة"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-xs text-charcoal/50 mt-1">
              يمكنك سحب وإفلات الصور هنا أو النقر على "+ صورة" لاختيارها
            </p>
          </div>

          {/* الأحجام والأسعار */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${label} mb-0`}>الأحجام والأسعار *</label>
              <button
                type="button"
                onClick={addVariant}
                className="text-xs bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] px-3 py-1.5 hover:bg-[#38332D] dark:hover:bg-[#B88E4F] transition-colors"
              >
                + حجم
              </button>
            </div>
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="bg-surface border border-line p-4 space-y-3"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-charcoal/60 block mb-1">
                        الحجم (مل)
                      </label>
                      <input
                        type="number"
                        className={input}
                        value={v.size_ml}
                        onChange={(e) =>
                          updateVariant(i, { size_ml: Number(e.target.value) })
                        }
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-charcoal/60 block mb-1">
                        السعر (ج)
                      </label>
                      <input
                        type="number"
                        className={input}
                        value={v.price}
                        onChange={(e) =>
                          updateVariant(i, { price: Number(e.target.value) })
                        }
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-charcoal/60 block mb-1">
                        الستوك
                      </label>
                      <input
                        type="number"
                        className={input}
                        value={v.stock}
                        onChange={(e) =>
                          updateVariant(i, { stock: Number(e.target.value) })
                        }
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-charcoal/60 block mb-1">
                        SKU
                      </label>
                      <input
                        className={input}
                        value={v.sku}
                        onChange={(e) => updateVariant(i, { sku: e.target.value })}
                        placeholder="OUD-50"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* العرض */}
                  <div className="bg-[#C8A97E]/10 dark:bg-[#D4AF37]/10 border border-[#C8A97E]/30 dark:border-[#D4AF37]/30 p-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-charcoal mb-2">
                      <input
                        type="checkbox"
                        checked={v.offerActive}
                        onChange={(e) =>
                          updateVariant(i, { offerActive: e.target.checked })
                        }
                      />
                      🏷️ عرض / خصم على هذا الحجم
                    </label>
                    {v.offerActive && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <select
                          className={input}
                          value={v.discountType}
                          onChange={(e) =>
                            updateVariant(i, {
                              discountType: e.target.value as "percentage" | "fixed",
                            })
                          }
                        >
                          <option value="percentage">نسبة %</option>
                          <option value="fixed">مبلغ ثابت</option>
                        </select>
                        <input
                          type="number"
                          className={input}
                          value={v.discountValue}
                          onChange={(e) =>
                            updateVariant(i, {
                              discountValue: Number(e.target.value),
                            })
                          }
                          placeholder="قيمة الخصم"
                          min={0}
                        />
                        <input
                          type="datetime-local"
                          className={input}
                          value={v.startAt}
                          onChange={(e) =>
                            updateVariant(i, { startAt: e.target.value })
                          }
                          title="بداية العرض"
                        />
                        <input
                          type="datetime-local"
                          className={input}
                          value={v.endAt}
                          onChange={(e) =>
                            updateVariant(i, { endAt: e.target.value })
                          }
                          title="نهاية العرض"
                        />
                      </div>
                    )}
                    {v.offerActive && v.endAt && new Date(v.endAt).getTime() < Date.now() && (
                      <p className="mt-2 text-xs font-bold text-red-500">
                        ⚠️ تاريخ نهاية العرض في الماضي — العرض لن يظهر للعملاء. حدّث التاريخ أو اتركه فارغًا لعرض دائم.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-charcoal">
                      <input
                        type="checkbox"
                        checked={v.is_active}
                        onChange={(e) =>
                          updateVariant(i, { is_active: e.target.checked })
                        }
                      />
                      الحجم متاح للبيع
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-red-500 hover:underline"
                    >
                      حذف الحجم
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEO */}
          <details className="bg-surface border border-line p-4">
            <summary className="font-bold text-sm text-charcoal cursor-pointer">
              🔍 إعدادات SEO (اختياري)
            </summary>
            <div className="mt-3 space-y-3">
              <input
                className={input}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Meta Title"
              />
              <textarea
                className={`${input} resize-none`}
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Meta Description"
              />
            </div>
          </details>

          {/* مميز */}
          <label className="flex items-center gap-2 text-sm font-bold text-charcoal">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            ⭐ منتج مميز (يظهر في المقدمة)
          </label>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          {/* الأزرار */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] font-semibold text-xs uppercase tracking-widest py-3 hover:bg-[#38332D] dark:hover:bg-[#B88E4F] transition-colors disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "حفظ المنتج"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 border border-line hover:bg-surface-2"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
