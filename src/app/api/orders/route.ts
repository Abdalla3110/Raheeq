import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Offer } from "@/lib/types";
import { handleSupabaseError, AppError, createErrorResponse, createSuccessResponse, handleApiError } from "@/lib/error-handler";

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().regex(/^01[0-9]{9}$/),
    governorate: z.string().min(2).max(50),
    city: z.string().min(2).max(100),
    address: z.string().min(5).max(500),
    notes: z.string().max(500).optional(),
  }),
  items: z
    .array(
      z.object({
        variant_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(30),
});

/** سعر الوحدة النهائي مع الأخذ بالعرض الساري في الحسبان */
function computeFinal(price: number, offer: Offer | null): number {
  if (!offer || !offer.is_active) return price;
  const now = Date.now();
  if (offer.start_at && new Date(offer.start_at).getTime() > now) return price;
  if (offer.end_at && new Date(offer.end_at).getTime() < now) return price;
  const final =
    offer.discount_type === "percentage"
      ? Math.round(price * (1 - offer.discount_value / 100))
      : price - offer.discount_value;
  return Math.max(0, final);
}

export async function POST(request: NextRequest) {
  try {
    // التحقق من CSRF token (أساسي ولكن يوفر حماية إضافية)
    const csrfToken = request.headers.get("X-CSRF-Token");
    if (!csrfToken || csrfToken.length < 10) {
      return NextResponse.json(
        { error: "طلب غير صالح - حماية CSRF" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse(new AppError("بيانات الطلب غير صحيحة، راجع الفورم", "VALIDATION_ERROR", 400)),
        { status: 400 }
      );
    }

    const { customer, items } = parsed.data;
    const supabase = createAdminClient();

    // 1) جلب المتاحات المطلوبة من الداتابيز — مصدر الحقيقة
    const variantIds = items.map((i) => i.variant_id);
    const { data: variants, error: fetchErr } = await supabase
      .from("product_variants")
      .select(
        `id, sku, size_ml, price, stock, is_active,
         product:products(id, name, status),
         offer:offers(*)`
      )
      .in("id", variantIds);

    if (fetchErr || !variants) {
      const appError = handleSupabaseError(fetchErr);
      return NextResponse.json(
        createErrorResponse(appError),
        { status: appError.statusCode }
      );
    }

    const variantMap = new Map<string, (typeof variants)[number]>(
      variants.map((v) => [v.id, v])
    );

    const getProduct = (v: (typeof variants)[number]) => {
      const p = v.product as
        | { id: string; name: string; status: string }
        | { id: string; name: string; status: string }[]
        | null;
      return Array.isArray(p) ? p[0] : p;
    };

    // 2) التحقق وتجهيز عناصر الأوردر
    type PreparedItem = {
      product_id: string;
      variant_id: string;
      product_name: string;
      variant_size_ml: number;
      variant_sku: string;
      unit_price: number;
      discount_amount: number;
      final_price: number;
      quantity: number;
    };

    const prepared: PreparedItem[] = [];
    let subtotal = 0;
    let discountTotal = 0;

    for (const item of items) {
      const v = variantMap.get(item.variant_id);

      const product = v ? getProduct(v) : null;

      if (!v || !v.is_active || !product || product.status !== "published") {
        return NextResponse.json(
          createErrorResponse(new AppError("أحد المنتجات في سلتك لم يعد متاحًا — حدّث السلة", "PRODUCT_UNAVAILABLE", 409)),
          { status: 409 }
        );
      }
      if (v.stock < item.quantity) {
        return NextResponse.json(
          createErrorResponse(new AppError(
            `الكمية المطلوبة من ${product.name} (${v.size_ml} مل) غير متاحة — المتبقي ${v.stock}`,
            "INSUFFICIENT_STOCK",
            409
          )),
          { status: 409 }
        );
      }

      const offerRow = Array.isArray(v.offer) ? v.offer[0] : v.offer;
      const final = computeFinal(v.price, offerRow as Offer | null);
      const lineFinal = final * item.quantity;
      const lineOriginal = v.price * item.quantity;

      subtotal += lineOriginal;
      discountTotal += lineOriginal - lineFinal;
      prepared.push({
        product_id: product.id,
        variant_id: v.id,
        product_name: product.name,
        variant_size_ml: v.size_ml,
        variant_sku: v.sku,
        unit_price: v.price,
        discount_amount: (lineOriginal - lineFinal) / item.quantity,
        final_price: final,
        quantity: item.quantity,
      });
    }

    // 3) سعر التوصيل من مناطق الشحن
    const { data: zone } = await supabase
      .from("shipping_zones")
      .select("delivery_fee, is_active")
      .eq("governorate", customer.governorate)
      .maybeSingle();

    if (!zone || !zone.is_active) {
      return NextResponse.json(
        createErrorResponse(new AppError("التوصيل غير متاح حاليًا لهذه المحافظة", "PRODUCT_UNAVAILABLE", 409)),
        { status: 409 }
      );
    }
    const shippingFee = zone.delivery_fee;

    // 4) رقم الأوردر التسلسلي - دالة next_order_number() مع إعادة محاولة عند التعارض
    const insertOrder = (orderNumber: number) =>
      supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_name: customer.name,
          phone: customer.phone,
          governorate: customer.governorate,
          city: customer.city,
          address: customer.address,
          notes: customer.notes ?? null,
          subtotal,
          discount_total: discountTotal,
          shipping_fee: shippingFee,
          total: subtotal - discountTotal + shippingFee,
          status: "NEW",
        })
        .select("id, order_number")
        .single();

    let order: { id: string; order_number: number } | null = null;
    let orderErr: { code?: string } | null = null;
    for (let attempt = 0; attempt < 3 && !order; attempt++) {
      const { data: nextNum } = await supabase.rpc("next_order_number");
      const candidate = typeof nextNum === "number" ? nextNum : Date.now() % 1000000000;
      const res = await insertOrder(candidate);
      if (!res.error && res.data) {
        order = res.data as { id: string; order_number: number };
      } else if (res.error?.code !== "23505") {
        orderErr = res.error;
        break;
      }
    }

    if (orderErr || !order) {
      const appError = handleSupabaseError(orderErr);
      return NextResponse.json(
        createErrorResponse(appError),
        { status: appError.statusCode }
      );
    }

    // 6) عناصر الأوردر + خصم الستوك + سجل الحالة - مع transaction محسّن
    const itemsToInsert = prepared.map((p) => ({
      ...p,
      order_id: order.id,
    }));

    // أولاً: إضافة عناصر الأوردر وسجل الحالة
    const [itemsRes, historyRes] = await Promise.all([
      supabase.from("order_items").insert(itemsToInsert),
      supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "NEW",
        note: "تم استلام الطلب",
      }),
    ]);

    if (itemsRes.error || historyRes.error) {
      // نحذف الأوردر بالكامل في حالة الفشل - rollback يدوي
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        createErrorResponse(new AppError("تعذر حفظ تفاصيل الطلب، جرب تاني", "DATABASE_ERROR", 500)),
        { status: 500 }
      );
    }

    // ثانياً: خصم الستوك بشكل ذري
    const stockRes = await supabase.rpc("decrease_stock", { p_items: itemsToInsert });

    if (stockRes.error) {
      // إذا فشل خصم الستوك، نحذف الأوردر وعناصره بالكامل
      await Promise.all([
        supabase.from("order_status_history").delete().eq("order_id", order.id),
        supabase.from("order_items").delete().eq("order_id", order.id),
        supabase.from("orders").delete().eq("id", order.id),
      ]);
      return NextResponse.json(
        createErrorResponse(new AppError(
          "تعذر تحديث المخزون، الطلب لم يُحفظ - جرب تاني",
          "DATABASE_ERROR",
          500
        )),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        ok: true,
        orderId: order.id,
        orderNumber: order.order_number,
      })
    );
  } catch (error) {
    const appError = handleApiError(error);
    return NextResponse.json(
      createErrorResponse(appError),
      { status: appError.statusCode }
    );
  }
}
