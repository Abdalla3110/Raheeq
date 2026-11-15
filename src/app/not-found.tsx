"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";

function NotFoundContent() {
  const { lang } = useUIPrefs();
  const tr = t[lang];

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="text-7xl mb-4 opacity-30">🌸</div>
      <h1 className="text-3xl font-extrabold text-ink mb-3">
        {tr.notFoundTitle}
      </h1>
      <p className="text-charcoal/60 mb-8">{tr.notFoundDesc}</p>
      <Link
        href="/products"
        className="bg-gold text-white px-8 py-3 rounded-full font-bold hover:bg-ink transition-colors inline-block"
      >
        {tr.notFoundCta}
      </Link>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-24 text-center">...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
