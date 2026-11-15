"use client";

import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";

const WHATSAPP_DISPLAY = "+20 10 3755 1572";
const WHATSAPP_LINK = `https://wa.me/201037551572?text=${encodeURIComponent(
  "مرحبًا، عندي استفسار بخصوص العطور"
)}`;
const EMAIL = "lailami1221@gmail.com";

export default function ContactClient() {
  const { lang } = useUIPrefs();
  const tr = t[lang];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-dark font-semibold mb-2">
          {tr.contactUs}
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ink mb-2">
          {tr.contactTitle}
        </h1>
        <div className="gold-divider w-40 mx-auto" />
      </div>

      {/* صورة توضيحية */}
      <div className="max-w-md mx-auto mb-8 border border-line overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/detail.jpg"
          alt={tr.contactTitle}
          loading="lazy"
          className="w-full h-40 object-cover object-center"
        />
      </div>

      <div className="bg-surface border border-line p-8 space-y-5 text-center">
        <div>
          <div className="text-3xl mb-2">💬</div>
          <h2 className="font-bold text-ink mb-1">{tr.whatsapp}</h2>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-charcoal/70 text-sm hover:text-gold-dark transition-colors"
            dir="ltr"
          >
            {WHATSAPP_DISPLAY}
          </a>
        </div>
        <div className="gold-divider opacity-50" />
        <div>
          <div className="text-3xl mb-2">✉️</div>
          <h2 className="font-bold text-ink mb-1">{tr.emailLabel}</h2>
          <a
            href={`mailto:${EMAIL}`}
            className="text-charcoal/70 text-sm hover:text-gold-dark transition-colors"
            dir="ltr"
          >
            {EMAIL}
          </a>
        </div>
        <div className="gold-divider opacity-50" />
      </div>
    </div>
  );
}
