import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeName, sanitizeComment } from "@/lib/sanitization";

const reviewSchema = z.object({
  product_id: z.string().uuid(),
  customer_name: z.string().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// Rate limiting باستخدام Supabase بدلاً من الذاكرة
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; resetAt?: string }> {
  const supabase = createAdminClient();
  const windowMinutes = 60; // ساعة واحدة
  const maxCount = 3; // 3 تقييمات كحد أقصى

  try {
    // حذف السجلات المنتهية
    await supabase
      .from("rate_limits")
      .delete()
      .lt("expires_at", new Date().toISOString());

    // جلب العدد الحالي
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("identifier", ip)
      .eq("action_type", "review_submit")
      .gte("created_at", new Date(Date.now() - windowMinutes * 60 * 1000).toISOString())
      .single();

    const currentCount = existing?.count ?? 0;

    if (currentCount >= maxCount) {
      return {
        allowed: false,
        resetAt: existing?.expires_at,
      };
    }

    // تحديث أو إنشاء سجل
    if (existing) {
      await supabase
        .from("rate_limits")
        .update({
          count: currentCount + 1,
          expires_at: new Date(Date.now() + windowMinutes * 60 * 1000).toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("rate_limits").insert({
        identifier: ip,
        action_type: "review_submit",
        count: 1,
        expires_at: new Date(Date.now() + windowMinutes * 60 * 1000).toISOString(),
      });
    }

    return { allowed: true };
  } catch (error) {
    // في حالة فشل rate limiting، نسمح بالطلب لتجنب block المستخدمين
    console.error("Rate limiting error:", error);
    return { allowed: true };
  }
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anon";

  const rateCheck = await checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "بعت تقييمات كتير — جرب بعد شوية",
        resetAt: rateCheck.resetAt,
      },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }

  const { product_id, customer_name, rating, comment } = parsed.data;

  // تنظيف من أي HTML/script باستخدام DOMPurify
  const cleanName = sanitizeName(customer_name);
  const cleanComment = comment ? sanitizeComment(comment).slice(0, 500) : null;

  const supabase = await createClient();

  // التحقق إن المنتج منشور
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", product_id)
    .eq("status", "published")
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "منتج غير موجود" }, { status: 404 });
  }

  // RLS تسمح للـ anon بإدراج review بحالة pending فقط
  const { error } = await supabase.from("reviews").insert({
    product_id,
    customer_name: cleanName,
    rating,
    comment: cleanComment,
  });

  if (error) {
    return NextResponse.json(
      { error: "تعذر إرسال التقييم، جرب تاني" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
