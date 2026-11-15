import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * عميل بصلاحيات Service Role — للسيرفر فقط.
 * يستخدم في: إنشاء الأوردرات (تجاوز RLS لحساب الأسعار من الداتابيز)،
 * وتحديث الستوك بشكل ذري.
 * ⚠️ لا تستورده أبدًا في أي client component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY مفقود. أضفه في .env.local — للسيرفر فقط."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
