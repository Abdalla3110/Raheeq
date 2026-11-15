"use client";

import Link from "next/link";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";

export default function PolicyContent({ slug }: { slug: string }) {
  const { lang } = useUIPrefs();
  const tr = t[lang];
  const policy = tr.policies[slug as keyof typeof tr.policies];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl text-ink mb-6">{policy.title}</h1>
      <div className="gold-divider w-24 mb-6" />
      <div className="bg-surface border border-line p-6 space-y-4">
        {policy.body.map((p, i) => (
          <p key={i} className="text-charcoal leading-relaxed font-light">
            {p}
          </p>
        ))}
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 mt-8 text-gold font-bold hover:underline"
      >
        <span className="rtl:rotate-180">←</span>
        <span>{tr.backHome}</span>
      </Link>
    </div>
  );
}
