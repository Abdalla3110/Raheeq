"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/types";
import { formatEGP } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";

type RangeKey = "today" | "yesterday" | "5d" | "7d" | "30d" | "custom";

const ranges: { key: RangeKey; label: string }[] = [
  { key: "today", label: "اليوم" },
  { key: "yesterday", label: "أمس" },
  { key: "5d", label: "آخر 5 أيام" },
  { key: "7d", label: "آخر 7 أيام" },
  { key: "30d", label: "آخر 30 يوم" },
  { key: "custom", label: "مخصص" },
];

function getRangeDates(key: RangeKey, from?: string, to?: string) {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const startOfDay = (d: Date) => new Date(d.setHours(0, 0, 0, 0));

  switch (key) {
    case "today":
      return { from: fmt(startOfDay(new Date(now))), to: fmt(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: fmt(startOfDay(y)), to: fmt(y) };
    }
    case "5d":
    case "7d":
    case "30d": {
      const days = key === "5d" ? 5 : key === "7d" ? 7 : 30;
      const past = new Date(now);
      past.setDate(past.getDate() - (days - 1));
      return { from: fmt(startOfDay(past)), to: fmt(now) };
    }
    case "custom":
      return { from: from ?? fmt(now), to: to ?? fmt(now) };
  }
}

const PIE_COLORS = [
  "#C8A97E",
  "#9E7438",
  "#1A1816",
  "#D4AF37",
  "#595248",
  "#B89669",
];

export default function AdminDashboardPage() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = getRangeDates(range, customFrom, customTo);
    const supabase = createClient();

    const { data } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false });

    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [range, customFrom, customTo]);

  useEffect(() => {
    if (range === "custom" && (!customFrom || !customTo)) return;
    load();
  }, [range, customFrom, customTo, load]);

  // ── الحسابات ──
  const stats = (() => {
    if (!orders) return null;
    const active = orders.filter((o) => o.status !== "CANCELLED");
    const grossSales = active.reduce((s, o) => s + o.subtotal, 0);
    const discounts = active.reduce((s, o) => s + o.discount_total, 0);
    const shipping = active.reduce((s, o) => s + o.shipping_fee, 0);
    const netSales = active.reduce((s, o) => s + o.total, 0);
    const cancelled = orders.length - active.length;
    const pending = orders.filter(
      (o) => o.status === "NEW" || o.status === "CONFIRMED"
    ).length;

    // أوردرات كل يوم
    const byDay = new Map<string, { orders: number; revenue: number }>();
    for (const o of active) {
      const day = o.created_at.slice(0, 10);
      const entry = byDay.get(day) ?? { orders: 0, revenue: 0 };
      entry.orders += 1;
      entry.revenue += o.total;
      byDay.set(day, entry);
    }
    const daily = Array.from(byDay.entries())
      .map(([day, v]) => ({
        day: day.slice(5),
        أوردرات: v.orders,
        إيراد: v.revenue,
      }))
      .sort((a, b) => (a.day > b.day ? 1 : -1));

    // توزيع الحالات
    const statusCounts = new Map<OrderStatus, number>();
    for (const o of orders) {
      statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
    }
    const statusData = Array.from(statusCounts.entries()).map(([k, v]) => ({
      name: ORDER_STATUS_LABELS[k],
      value: v,
    }));

    return {
      count: orders.length,
      grossSales,
      discounts,
      shipping,
      netSales,
      cancelled,
      pending,
      daily,
      statusData,
    };
  })();

  const kpiCard = (label: string, value: string, accent = "text-ink dark:text-[#FAF8F5]", sub = "") => (
    <div className="bg-surface dark:bg-[#151311] border border-[#E3DCD2] dark:border-[#2C2621] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-[#736B61] dark:text-[#A8A096] font-medium">
          {label}
        </span>
        <div className="w-8 h-8 bg-[#F5F2EA] dark:bg-[#201C18] flex items-center justify-center text-gold-dark dark:text-[#D4AF37] text-sm">
          ◈
        </div>
      </div>
      <div className={`font-display text-3xl font-semibold ${accent}`} dir="ltr">
        {value}
      </div>
      {sub && (
        <p className="text-[11px] text-[#736B61] dark:text-[#A8A096] mt-2">{sub}</p>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold-dark dark:text-[#D4AF37] font-semibold mb-1">
            <span>▦</span>
            <span>نظرة عامة</span>
          </div>
          <h1 className="font-display text-2xl text-ink dark:text-[#FAF8F5]">لوحة المبيعات</h1>
        </div>

        {/* فلاتر التاريخ — مربعة زي l'élixir */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-all ${
                range === r.key
                  ? "border-[#1A1816] dark:border-[#D4AF37] bg-[#1A1816] dark:bg-[#D4AF37] text-[#FAF9F6] dark:text-[#0E0D0C] font-semibold"
                  : "border-[#DDD7CC] dark:border-[#38312A] text-[#595248] dark:text-[#C4BCB1] hover:border-[#9E7438] dark:hover:border-[#D4AF37] bg-transparent"
              }`}
            >
              {r.label}
            </button>
          ))}
          {range === "custom" && (
            <div className="flex gap-2 items-center text-xs p-2 bg-[#FAF9F6] dark:bg-[#181512] border border-[#DDD7CC] dark:border-[#38312A]">
              <span className="font-semibold uppercase tracking-wider text-ink dark:text-[#FAF8F5]">من:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-surface dark:bg-[#100F0D] border border-[#DDD7CC] dark:border-[#38312A] px-2 py-1 text-ink dark:text-[#FAF8F5]"
              />
              <span className="font-semibold uppercase tracking-wider text-ink dark:text-[#FAF8F5]">إلى:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-surface dark:bg-[#100F0D] border border-[#DDD7CC] dark:border-[#38312A] px-2 py-1 text-ink dark:text-[#FAF8F5]"
              />
            </div>
          )}
        </div>
      </div>

      {loading || !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {kpiCard("عدد الأوردرات", String(stats.count), "text-ink dark:text-[#FAF8F5]", "إجمالي الطلبات في الفترة")}
            {kpiCard("أوردرات معلقة", String(stats.pending), "text-amber-700 dark:text-amber-400", "تحتاج تأكيد أو تجهيز")}
            {kpiCard("ملغاة", String(stats.cancelled), "text-red-600 dark:text-red-400", "طلبات ملغاة في الفترة")}
            {kpiCard("صافي المبيعات", formatEGP(stats.netSales), "text-emerald-800 dark:text-emerald-400", "عبر الدفع عند الاستلام")}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {kpiCard("إجمالي قبل الخصم", formatEGP(stats.grossSales))}
            {kpiCard("قيمة الخصومات", formatEGP(stats.discounts))}
            {kpiCard("إيراد الشحن", formatEGP(stats.shipping))}
          </div>

          {/* رسم يومي */}
          {stats.daily.length > 0 && (
            <div className="bg-surface dark:bg-[#151311] border border-[#E3DCD2] dark:border-[#2C2621] p-6 sm:p-8 shadow-sm mb-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold-dark dark:text-[#D4AF37] font-semibold mb-1">
                <span>▦</span>
                <span>تحليلات المبيعات</span>
              </div>
              <h2 className="font-display text-2xl text-ink dark:text-[#FAF8F5] mb-6">الأوردرات والإيراد يوميًا</h2>
              <div style={{ direction: "ltr" }} className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke={"var(--border-subtle)"} />
                    <XAxis dataKey="day" fontSize={11} stroke="#8C827A" />
                    <YAxis fontSize={11} stroke="#8C827A" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 0,
                        border: "1px solid #C8A97E",
                        background: "#1A1816",
                        color: "#FAF9F6",
                        fontFamily: "inherit",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="أوردرات" fill="#C8A97E" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="إيراد" fill="#D4AF37" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* توزيع الحالات */}
          {stats.statusData.length > 0 && (
            <div className="bg-surface dark:bg-[#151311] border border-[#E3DCD2] dark:border-[#2C2621] p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-2xl text-ink dark:text-[#FAF8F5] mb-6">توزيع حالات الأوردرات</h2>
              <div style={{ direction: "ltr" }} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {stats.statusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 0,
                        border: "1px solid #C8A97E",
                        background: "#1A1816",
                        color: "#FAF9F6",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {stats.count === 0 && (
            <div className="bg-surface dark:bg-[#151311] border border-[#E3DCD2] dark:border-[#2C2621] p-10 text-center text-charcoal dark:text-[#A8A096] font-light">
              لا توجد أوردرات في هذه الفترة
            </div>
          )}
        </>
      )}
    </div>
  );
}
