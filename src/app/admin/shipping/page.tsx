"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShippingZone } from "@/lib/types";
import { EGYPT_GOVERNORATES } from "@/lib/constants";
import { formatEGP } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";

export default function AdminShippingPage() {
  const [zones, setZones] = useState<ShippingZone[] | null>(null);
  const [newGov, setNewGov] = useState("");
  const [newFee, setNewFee] = useState(50);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("shipping_zones")
      .select("*")
      .order("governorate");
    setZones((data as ShippingZone[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateZone(zone: ShippingZone, patch: Partial<ShippingZone>) {
    const supabase = createClient();
    setZones((prev) =>
      prev ? prev.map((z) => (z.id === zone.id ? { ...z, ...patch } : z)) : prev
    );
    await supabase.from("shipping_zones").update(patch).eq("id", zone.id);
  }

  async function addZone(e: React.FormEvent) {
    e.preventDefault();
    if (!newGov) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("shipping_zones")
      .insert({ governorate: newGov, delivery_fee: Number(newFee), is_active: true });
    setNewGov("");
    setSaving(false);
    load();
  }

  async function removeZone(id: string) {
    const supabase = createClient();
    await supabase.from("shipping_zones").delete().eq("id", id);
    load();
  }

  const availableGovernorates = EGYPT_GOVERNORATES.filter(
    (g) => !(zones ?? []).some((z) => z.governorate === g)
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink mb-2">مناطق الشحن</h1>
      <p className="text-sm text-charcoal/60 mb-6">
        حدد سعر التوصيل لكل محافظة — يظهر للعميل تلقائيًا في صفحة إتمام الطلب.
      </p>

      {/* إضافة منطقة */}
      <form
        onSubmit={addZone}
        className="bg-surface border border-line p-4 flex flex-wrap gap-3 items-end mb-6"
      >
        <div className="flex-1 min-w-40">
          <label className="text-xs font-bold text-charcoal block mb-1">
            المحافظة
          </label>
          <select
            value={newGov}
            onChange={(e) => setNewGov(e.target.value)}
            className="w-full bg-surface border border-line px-4 py-2.5 text-sm"
          >
            <option value="">اختار المحافظة</option>
            {availableGovernorates.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="text-xs font-bold text-charcoal block mb-1">
            سعر التوصيل (ج)
          </label>
          <input
            type="number"
            value={newFee}
            onChange={(e) => setNewFee(Number(e.target.value))}
            min={0}
            className="w-full bg-surface border border-line px-4 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !newGov}
          className="bg-gold text-white font-bold px-6 py-2.5 rounded-full hover:bg-ink transition-colors disabled:opacity-50 text-sm"
        >
          + إضافة
        </button>
      </form>

      {/* قائمة المناطق */}
      {zones === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-surface border border-line p-10 text-center text-charcoal/60">
          لم تضف مناطق شحن بعد — بدون مناطق لن يستطيع العملاء الطلب
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((z) => (
            <div
              key={z.id}
              className="bg-surface border border-line p-4 flex flex-wrap items-center gap-4"
            >
              <span className="font-bold text-ink min-w-32">{z.governorate}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-charcoal/60">سعر التوصيل:</span>
                <input
                  type="number"
                  value={z.delivery_fee}
                  onChange={(e) =>
                    updateZone(z, { delivery_fee: Number(e.target.value) })
                  }
                  min={0}
                  className="w-24 bg-surface border border-line px-3 py-1.5 text-sm"
                />
                <span className="text-xs text-charcoal/60">
                  ({formatEGP(z.delivery_fee)})
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm mr-auto">
                <input
                  type="checkbox"
                  checked={z.is_active}
                  onChange={(e) =>
                    updateZone(z, { is_active: e.target.checked })
                  }
                />
                مفعّلة
              </label>
              <button
                onClick={() => removeZone(z.id)}
                className="text-red-500 text-sm hover:underline"
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
