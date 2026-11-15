"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";
import { SITE_NAME } from "@/lib/constants";

export default function Footer() {
  const pathname = usePathname();
  const { lang } = useUIPrefs();
  const tr = t[lang];

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-hero text-[#C7BFB5] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-display text-2xl text-[#FAF9F6]">{tr.brand}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C8A97E] font-semibold">
                {tr.brandSub}
              </span>
            </div>
            <p className="text-sm leading-relaxed font-light max-w-xs">
              {lang === "ar"
                ? "عطور فاخرة بأرواق تُخلّد الذكرى. جودة أصلية وتوصيل لباب بيتك."
                : "Luxury fragrances with unforgettable character. Authentic quality, delivered to your door."}
            </p>
          </div>

          <div>
            <div className="text-[#FAF9F6] font-semibold mb-3 text-sm uppercase tracking-widest">
              {lang === "ar" ? "روابط سريعة" : "Quick Links"}
            </div>
            <ul className="space-y-2.5 text-sm font-light">
              <li>
                <Link href="/products" className="hover:text-[#E0C498] transition-colors">
                  {tr.allProducts}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#E0C498] transition-colors">
                  {tr.contactUs}
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-[#E0C498] transition-colors">
                  {tr.favorites}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[#FAF9F6] font-semibold mb-3 text-sm uppercase tracking-widest">
              {lang === "ar" ? "السياسات" : "Policies"}
            </div>
            <ul className="space-y-2.5 text-sm font-light">
              <li>
                <Link href="/policies/shipping" className="hover:text-[#E0C498] transition-colors">
                  {lang === "ar" ? "سياسة الشحن والتوصيل" : "Shipping Policy"}
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-[#E0C498] transition-colors">
                  {lang === "ar" ? "الاستبدال والإرجاع" : "Returns & Exchange"}
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-[#E0C498] transition-colors">
                  {lang === "ar" ? "الخصوصية والشروط" : "Privacy & Terms"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="gold-divider my-8 opacity-40" />
        <div className="text-center text-xs text-[#A89F93] font-light">
          © {new Date().getFullYear()} {SITE_NAME} — {tr.rightsReserved}
        </div>
      </div>
    </footer>
  );
}
