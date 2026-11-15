"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";

const navItems = [
  { href: "/admin", labelAr: "لوحة المبيعات", labelEn: "Overview", icon: "▦" },
  { href: "/admin/orders", labelAr: "الطلبات", labelEn: "Orders", icon: "▣" },
  { href: "/admin/products", labelAr: "المنتجات", labelEn: "Products", icon: "▧" },
  { href: "/admin/reviews", labelAr: "التقييمات", labelEn: "Reviews", icon: "★" },
  { href: "/admin/shipping", labelAr: "الشحن", labelEn: "Shipping", icon: "▲" },
];

export default function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, toggleTheme, lang, toggleLang } = useUIPrefs();
  const tr = t[lang];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
              active
                ? "bg-[#1A1816] dark:bg-[#2A241E] text-[#FAF9F6] dark:text-[#FAF8F5]"
                : "text-[#595248] dark:text-[#A8A096] hover:bg-[#FAF9F6] dark:hover:bg-[#221E1A] hover:text-ink dark:hover:text-[#FAF8F5]"
            }`}
          >
            <span className="w-4 text-center opacity-70">{item.icon}</span>
            <span>{lang === "ar" ? item.labelAr : item.labelEn}</span>
          </Link>
        );
      })}
    </nav>
  );

  const sidebarBox = (
    <div className="bg-surface dark:bg-[#171513] border border-[#E3DCD2] dark:border-[#2C2621] p-2 space-y-1 shadow-sm sticky top-24">
      {nav}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F2EA] dark:bg-[#0E0D0C] text-ink dark:text-[#FAF8F5] flex flex-col transition-colors duration-300">
      {/* الهيدر الداكن العلوي */}
      <header className="bg-[#1A1816] dark:bg-[#080706] text-[#FAF9F6] border-b border-[#2E2A26] dark:border-[#1E1B18] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg tracking-widest uppercase font-semibold">
              RAHEEQ
            </span>
            <span className="text-[10px] uppercase tracking-widest bg-[#2E2A26] dark:bg-[#1E1B18] text-[#C8A97E] dark:text-[#D4AF37] px-2 py-0.5 font-mono">
              ADMIN
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#A69B8F] ps-4 border-s border-[#332F2A]">
            <span className="text-[#C8A97E] dark:text-[#D4AF37]">🛡️</span>
            <span>{lang === "ar" ? "وحدة إدارة المتجر" : "Store Management Console"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
          {/* زر الموبايل */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-1.5 text-[#D1C8BC] border border-[#3D3833] dark:border-[#2E2822]"
            aria-label="Menu"
          >
            ☰
          </button>

          {/* الثيم */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-[#D1C8BC] hover:text-[#D4AF37] border border-[#3D3833] dark:border-[#2E2822] transition-colors"
            title={tr.themeToggle}
          >
            {theme === "dark" ? (
              <span className="text-[#D4AF37] text-sm">☀</span>
            ) : (
              <span className="text-sm">☾</span>
            )}
          </button>

          {/* اللغة */}
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 text-[#D1C8BC] hover:text-white border border-[#3D3833] dark:border-[#2E2822] transition-colors"
          >
            <span className="uppercase text-[11px]">{lang === "en" ? "العربية" : "English"}</span>
          </button>

          {/* معاينة المتجر */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#C8A97E] hover:bg-[#B89669] text-[#1A1816] font-semibold uppercase tracking-wider text-[11px] transition-colors"
          >
            <span>◈</span>
            <span className="hidden sm:inline">
              {lang === "ar" ? "معاينة المتجر" : "View Storefront"}
            </span>
          </Link>

          {/* الخروج */}
          <button
            onClick={logout}
            className="p-1.5 text-[#A69B8F] hover:text-rose-400 transition-colors"
            title={tr.logout}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H4m0 0 3-3m-3 3 3 3m8-11h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
            </svg>
          </button>
        </div>
      </header>

      {/* المحتوى: سايدبار + صفحات */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6 sm:gap-8">
        {/* سايدبار الديسكتوب */}
        <aside className="hidden md:block w-56 shrink-0">{sidebarBox}</aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* درج الموبايل */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 start-0 h-full w-60 bg-surface dark:bg-[#171513] z-50 md:hidden shadow-2xl p-4"
            >
              <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-[#EBE5DA] dark:border-[#221D18]">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base tracking-widest uppercase font-semibold text-ink dark:text-[#FAF8F5]">
                    RAHEEQ
                  </span>
                  <span className="text-[9px] uppercase tracking-widest bg-[#1A1816] dark:bg-[#2A241E] text-[#C8A97E] dark:text-[#D4AF37] px-1.5 py-0.5 font-mono">
                    ADMIN
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-charcoal dark:text-[#A8A096]"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              {nav}
              <div className="mt-6 pt-4 border-t border-[#EBE5DA] dark:border-[#221D18]">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#C8A97E] text-[#1A1816] mb-2"
                >
                  <span>◈</span>
                  {lang === "ar" ? "معاينة المتجر" : "View Storefront"}
                </Link>
                <div className="text-[10px] text-muted px-2 mb-1 truncate" dir="ltr">
                  {userEmail}
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider text-[#595248] dark:text-[#A8A096] hover:text-rose-500 transition-colors"
                >
                  {tr.logout}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
