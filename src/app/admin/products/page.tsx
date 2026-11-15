"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Product, ProductVariant } from "@/lib/types";
import { CATEGORY_LABELS, ProductStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import ProductForm from "./ProductForm";

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

const STATUS_STYLES: Record<ProductStatus, string> = {
  draft: "bg-surface-2 text-charcoal",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-700",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select(`*, variants:product_variants(*, offer:offers(*))`)
      .order("created_at", { ascending: false });
    setProducts((data as Product[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const supabase = createClient();
    try {
      // حذف المتاحات والعروض الأول (cascade في الداتابيز لو مفعّل)
      await supabase.from("offers").delete().in(
        "variant_id",
        (deleting.variants ?? []).map((v: ProductVariant) => v.id)
      );
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", deleting.id);
      await supabase.from("products").delete().eq("id", deleting.id);
      setDeleting(null);
      load();
    } catch (error) {
      setError("فشل حذف المنتج");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-ink">المنتجات</h1>
        <button
          onClick={() => setCreating(true)}
          className="bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] font-semibold text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-[#38332D] dark:hover:bg-[#B88E4F] transition-colors text-sm"
        >
          + إضافة منتج
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-sm border border-red-200 dark:border-red-800/50 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
            ✕
          </button>
        </div>
      )}

      {/* القائمة */}
      {products === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-surface border border-line p-10 text-center text-charcoal">
          لا توجد منتجات بعد — ابدأ بإضافة أول منتج
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-surface border border-line p-4 flex flex-wrap items-center gap-4"
            >
              <div className="w-16 h-16 overflow-hidden bg-surface-2 shrink-0">
                {p.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-40">
                <div className="font-bold text-ink">{p.name}</div>
                <div className="text-xs text-charcoal/60 mt-1">
                  {CATEGORY_LABELS[p.category]} ·{" "}
                  {(p.variants ?? []).length} حجم ·{" "}
                  {(p.variants ?? []).reduce((s, v) => s + v.stock, 0)} قطعة بالستوك
                </div>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLES[p.status]}`}
              >
                {STATUS_LABELS[p.status]}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(p)}
                  className="text-sm border border-line px-4 py-2 hover:border-gold transition-colors"
                >
                  تعديل
                </button>
                <button
                  onClick={() => setDeleting(p)}
                  className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نموذج الإضافة/التعديل */}
      {(creating || editing) && (
        <ProductForm
          product={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {/* تأكيد الحذف */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface p-6 max-w-sm w-full text-center">
            <div className="text-3xl mb-3">🗑</div>
            <p className="font-bold text-ink mb-1">حذف المنتج؟</p>
            <p className="text-sm text-charcoal/60 mb-5">
              هتحذف «{deleting.name}» وكل أحجامه وعروضه نهائيًا.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "جاري الحذف..." : "حذف نهائي"}
              </button>
              <button
                onClick={() => setDeleting(null)}
                disabled={isDeleting}
                className="flex-1 border border-line py-2.5 hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
