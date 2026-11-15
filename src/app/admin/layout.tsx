import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // صفحة login مش جوّا layout دي؟ هي — لكن layout بيلفّ كل /admin/*،
    // عشان كده نسحب عليها redirect هنا بس لو مفيش جلسة
    redirect("/admin/login");
  }

  // التحقق من دور الأدمن
  const { data: profile } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-4">
        <div className="text-center text-cream">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">غير مصرح بالدخول</h1>
          <p className="text-cream/60 text-sm">
            هذا الحساب لا يملك صلاحيات الأدمن. تواصل مع مالك المتجر.
          </p>
        </div>
      </div>
    );
  }

  return <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>;
}
