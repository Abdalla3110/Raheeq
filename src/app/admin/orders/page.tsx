"use client";

import { useCallback, useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/types";
import { formatEGP, formatDateAr } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

const statusFlow: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [history, setHistory] = useState<
    Record<string, { status: OrderStatus; created_at: string; note: string | null }[]>
  >({});

  const load = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("orders")
      .select(`*, items:order_items(*)`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter) query = query.eq("status", statusFilter);
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

    const { data } = await query;
    setOrders((data as Database['public']['Tables']['orders']['Row'][]) ?? []);
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(order: Order, status: OrderStatus) {
    const statusLabels: Record<OrderStatus, string> = {
      NEW: "جديد",
      CONFIRMED: "مؤكد",
      PREPARING: "قيد التحضير",
      SHIPPED: "تم الشحن",
      DELIVERED: "تم التوصيل",
      CANCELLED: "ملغي",
    };
    const currentLabel = statusLabels[order.status];
    const newLabel = statusLabels[status];

    if (!confirm(`تأكيد تغيير حالة الطلب #${order.id.slice(-6)} من "${currentLabel}" إلى "${newLabel}"؟`)) {
      return;
    }

    const supabase = createClient();
    try {
      const { error: orderError } = await supabase.from("orders").update({ status }).eq("id", order.id);
      if (orderError) {
        console.error("Failed to update order status:", orderError);
        alert("فشل تحديث حالة الطلب");
        return;
      }
      const { error: historyError } = await supabase.from("order_status_history").insert({
        order_id: order.id,
        status,
        note: null,
      });
      if (historyError) {
        console.error("Failed to insert status history:", historyError);
        alert("فشل تسجيل سجل الحالة");
        return;
      }
      load();
    } catch (error) {
      console.error("Error changing status:", error);
      alert("حدث خطأ أثناء تغيير الحالة");
    }
  }

  async function toggleExpand(order: Order) {
    if (expanded === order.id) {
      setExpanded(null);
      return;
    }
    setExpanded(order.id);
    if (!history[order.id]) {
      const supabase = createClient();
      const { data } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });
      setHistory((prev) => ({ ...prev, [order.id]: data ?? [] }));
    }
  }

  const waLink = (phone: string, name: string, num: number) =>
    `https://wa.me/20${phone}?text=${encodeURIComponent(
      `مرحبًا ${name} 👋\nبخصوص طلبك رقم #ORD-${num} من رحيق`
    )}`;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-6">الأوردرات</h1>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface border border-line rounded-full px-4 py-2 text-xs uppercase tracking-widest font-semibold text-ink dark:text-[#FAF8F5]"
        >
          <option value="">كل الحالات</option>
          {statusFlow.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-surface border border-line rounded-full px-4 py-2 text-sm"
        />
        <span className="self-center text-charcoal/40 text-sm">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-surface border border-line rounded-full px-4 py-2 text-sm"
        />
      </div>

      {/* القائمة */}
      {orders === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface border border-line p-10 text-center text-charcoal/60">
          لا توجد أوردرات مطابقة
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-surface border border-line overflow-hidden"
            >
              {/* صف الأوردر */}
              <button
                onClick={() => toggleExpand(o)}
                className="w-full text-right p-4 flex flex-wrap items-center gap-3 hover:bg-surface-2/70 transition-colors"
              >
                <span className="font-extrabold text-ink" dir="ltr">
                  #ORD-{o.order_number}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${ORDER_STATUS_COLORS[o.status]}`}
                >
                  {ORDER_STATUS_LABELS[o.status]}
                </span>
                <span className="text-sm text-charcoal">
                  {o.customer_name} · {o.governorate}
                </span>
                <span className="text-sm font-bold text-gold mr-auto" dir="ltr">
                  {formatEGP(o.total)}
                </span>
                <span className="text-xs text-charcoal/50 w-full sm:w-auto">
                  {formatDateAr(o.created_at)}
                </span>
              </button>

              {/* التفاصيل */}
              {expanded === o.id && (
                <div className="border-t border-line p-4 bg-surface-2 space-y-4">
                  {/* بيانات العميل */}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-charcoal/60 text-xs mb-1">
                        بيانات العميل
                      </div>
                      <div className="font-bold text-ink">{o.customer_name}</div>
                      <div dir="ltr" className="text-right">
                        {o.phone}
                      </div>
                      <div className="text-charcoal/70">
                        {o.governorate} — {o.city}
                      </div>
                      <div className="text-charcoal/70">{o.address}</div>
                      {o.notes && (
                        <div className="text-charcoal/60 italic mt-1">
                          📝 {o.notes}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-charcoal/60 text-xs mb-1">
                        الفاتورة
                      </div>
                      <div className="flex justify-between">
                        <span>الإجمالي الفرعي</span>
                        <span>{formatEGP(o.subtotal)}</span>
                      </div>
                      {o.discount_total > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>الخصم</span>
                          <span>− {formatEGP(o.discount_total)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>الشحن</span>
                        <span>{formatEGP(o.shipping_fee)}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-ink border-t border-line mt-1 pt-1">
                        <span>الإجمالي</span>
                        <span>{formatEGP(o.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* المنتجات */}
                  <div>
                    <div className="text-charcoal/60 text-xs mb-2">المنتجات</div>
                    <div className="space-y-1.5">
                      {(o.items ?? []).map((it) => (
                        <div
                          key={it.id}
                          className="bg-surface rounded-xl px-3 py-2 flex justify-between text-sm"
                        >
                          <span>
                            {it.product_name} — {it.variant_size_ml} مل ×{" "}
                            {it.quantity}
                            <span className="text-charcoal/40 text-xs block" dir="ltr">
                              {it.variant_sku}
                            </span>
                          </span>
                          <span className="font-semibold">
                            {formatEGP(it.final_price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* سجل الحالات */}
                  {history[o.id]?.length > 0 && (
                    <div>
                      <div className="text-charcoal/60 text-xs mb-2">
                        سجل الحالات
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {history[o.id].map((h, i) => (
                          <span
                            key={i}
                            className="bg-surface border border-line rounded-full px-3 py-1"
                          >
                            {ORDER_STATUS_LABELS[h.status]} ·{" "}
                            {formatDateAr(h.created_at)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* الإجراءات */}
                  <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-line">
                    <span className="text-xs text-charcoal/60">
                      تغيير الحالة:
                    </span>
                    {statusFlow
                      .filter((s) => s !== o.status)
                      .map((s) => (
                        <button
                          key={s}
                          onClick={() => changeStatus(o, s)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 ${ORDER_STATUS_COLORS[s]}`}
                        >
                          {ORDER_STATUS_LABELS[s]}
                        </button>
                      ))}
                    <a
                      href={waLink(o.phone, o.customer_name, o.order_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 mr-auto"
                    >
                      💬 واتساب
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
