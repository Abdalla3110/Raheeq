import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { invalidatePattern, invalidateCache } from "@/lib/cache";

/**
 * تحديث الكاش بعد تعديل الأدمن — محمي بجلسة أدمن صحيحة
 * (نفس حماية صفحات الأدمن: المستخدم لازم يكون في admin_users)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!admin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { slug } = await request.json().catch(() => ({ slug: null }));

    // تحديث كل الصفحات المتأثرة بتعديل المنتج
    revalidatePath("/", "page");
    revalidatePath("/products");
    if (slug) revalidatePath(`/products/${slug}`);

    // تحديث custom cache
    await invalidatePattern('products');
    if (slug) await invalidateCache(`product-${slug}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
