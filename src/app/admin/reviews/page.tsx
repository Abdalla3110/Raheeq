"use client";

import { useCallback, useEffect, useState } from "react";
import type { Review, ReviewStatus } from "@/lib/types";
import { formatDateAr } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import StarRating from "@/components/StarRating";

const filters: { value: string; label: string }[] = [
  { value: "pending", label: "قيد المراجعة" },
  { value: "approved", label: "معتمدة" },
  { value: "rejected", label: "مرفوضة" },
  { value: "", label: "الكل" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<
    (Review & { product?: { name: string; slug: string } })[] | null
  >(null);
  const [filter, setFilter] = useState("pending");

  const load = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("reviews")
      .select(`*, product:products(name, slug)`)
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter) query = query.eq("status", filter);
    const { data } = await query;
    setReviews((data as never) ?? []);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: ReviewStatus) {
    const supabase = createClient();
    try {
      const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
      if (error) {
        console.error("Failed to update review status:", error);
        alert("فشل تحديث حالة التقييم");
        return;
      }
      load();
    } catch (error) {
      console.error("Error setting status:", error);
      alert("حدث خطأ أثناء تغيير الحالة");
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) {
        console.error("Failed to delete review:", error);
        alert("فشل حذف التقييم");
        return;
      }
      load();
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  }

  const badge: Record<ReviewStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
  };
  const badgeLabel: Record<ReviewStatus, string> = {
    pending: "قيد المراجعة",
    approved: "معتمدة",
    rejected: "مرفوضة",
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-6">التقييمات</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold transition-colors ${
              filter === f.value
                ? "bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C]"
                : "bg-surface border border-line text-ink dark:text-[#FAF8F5] hover:border-gold-dark dark:hover:border-[#D4AF37]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {reviews === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-surface border border-line p-10 text-center text-charcoal/60">
          لا توجد تقييمات هنا
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-surface border border-line p-4"
            >
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-bold text-ink">{r.customer_name}</span>
                <StarRating value={r.rating} />
                {r.verified_purchase && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                    ✓ شراء موثق
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge[r.status]}`}
                >
                  {badgeLabel[r.status]}
                </span>
                <span className="text-xs text-charcoal/50 mr-auto">
                  {formatDateAr(r.created_at)}
                </span>
              </div>
              {r.comment && (
                <p className="text-sm text-charcoal/80 mb-2">{r.comment}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-charcoal/50">
                  على: <strong>{r.product?.name ?? "منتج محذوف"}</strong>
                </span>
                <span className="mr-auto flex gap-2">
                  {r.status !== "approved" && (
                    <button
                      onClick={() => setStatus(r.id, "approved")}
                      className="bg-green-600 text-white font-bold px-3 py-1.5 rounded-full hover:bg-green-700"
                    >
                      اعتماد ✓
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      onClick={() => setStatus(r.id, "rejected")}
                      className="border border-red-200 text-red-600 font-bold px-3 py-1.5 rounded-full hover:bg-red-50"
                    >
                      رفض
                    </button>
                  )}
                  <button
                    onClick={() => remove(r.id)}
                    className="text-red-500 hover:underline font-bold"
                  >
                    حذف
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
