"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import ProductsGrid from "@/components/ProductsGrid";
import LazyVideo from "@/components/LazyVideo";
import { useUIPrefs } from "@/lib/ui-prefs";
import { t } from "@/lib/translations";

// ── الهيرو الداكن الفخم ──────────────────────────────────────
function Hero() {
  const { lang } = useUIPrefs();
  const tr = t[lang];

  return (
    <section className="relative w-full min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] bg-hero text-[#FAF9F6] overflow-hidden">
      {/* الخلفية */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt=""
          width={2000}
          height={1125}
          priority
          className="w-full h-full object-cover object-center opacity-40 brightness-75"
        />
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          src="/videos/hero-smoke.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#141210]/80 via-[#141210]/60 to-[#141210]/90" />
      </div>

      {/* طبقة التوسيط — طولي وعرضي مطلق */}
      <div className="relative z-10 min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] w-full flex items-center justify-center">
        <div className="px-4 sm:px-6 lg:px-8 py-16 w-full max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C8A97E]/15 border border-[#C8A97E]/30 rounded-full text-[#E0C498] text-sm uppercase tracking-[0.25em] font-medium mb-7"
          >
            <span>✦</span>
            <span>{tr.heroEyebrow}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#FAF9F6] leading-[1.1] mb-7"
          >
            {tr.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-[#C7BFB5] leading-relaxed mb-10 max-w-2xl mx-auto font-light"
          >
            {tr.heroDesc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            <Link
              href="/products"
              className="px-10 py-4.5 bg-[#C8A97E] hover:bg-[#B89669] text-[#141210] font-semibold text-sm sm:text-base tracking-[0.2em] uppercase transition-all duration-300 shadow-lg shadow-[#C8A97E]/20 active:scale-95"
            >
              {tr.shopCollection}
            </Link>

            <div className="hidden sm:flex items-center gap-8 text-sm text-[#A89F93] tracking-widest uppercase border-s border-[#38332D] ps-8">
              <div>
                <span className="block font-display text-2xl text-[#FAF9F6] font-semibold">
                  100%
                </span>
                <span className="text-xs">{tr.natural}</span>
              </div>
              <div>
                <span className="block font-display text-2xl text-[#FAF9F6] font-semibold">
                  16h+
                </span>
                <span className="text-xs">{tr.longevity}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── التصنيفات بصور ───────────────────────────────────────────
function ExploreCategories() {
  const { lang } = useUIPrefs();
  const tr = t[lang];

  const categories = [
    {
      id: "men",
      title: tr.men,
      subtitle: lang === "ar" ? "أخشاب، جلود، حمضيات دخانية" : "Woods, Leather, Smoked Citrus",
      image: "/images/atelier.jpg",
    },
    {
      id: "women",
      title: tr.women,
      subtitle: lang === "ar" ? "زهور مخملية، فانيليا، مسك أبيض" : "Velvet Florals, Vanilla, White Musk",
      image: "/images/detail.jpg",
    },
    {
      id: "unisex",
      title: tr.unisex,
      subtitle: lang === "ar" ? "عود ملكي، عنبر، صندل حريري" : "Imperial Oud, Ambergris, Silky Santal",
      image: "/images/banner.jpg",
    },
  ];

  return (
    <section className="py-20 bg-cream border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-dark font-semibold mb-2">
            {tr.curatedUniverses}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink">{tr.exploreCollection}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
            >
              <Link
                href={`/products?category=${cat.id}`}
                className="group relative block h-96 sm:h-[420px] overflow-hidden border border-line hover:border-gold transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/90 via-[#141210]/35 to-transparent group-hover:from-[#141210]/95 transition-all duration-300" />

                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex items-end justify-between text-[#FAF9F6]">
                  <div>
                    <h3 className="font-display text-2xl tracking-wide uppercase group-hover:text-[#E0C498] transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#C7BFB5] mt-1 tracking-wide">{cat.subtitle}</p>
                  </div>
                  <span className="w-10 h-10 shrink-0 rounded-full border border-[#C8A97E]/50 flex items-center justify-center text-[#E0C498] group-hover:bg-[#C8A97E] group-hover:text-[#141210] transition-colors">
                    {lang === "ar" ? "←" : "→"}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── قصة البراند ──────────────────────────────────────────────
function BrandStory() {
  const { lang } = useUIPrefs();
  const tr = t[lang];

  return (
    <section className="py-24 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/story.jpg"
                alt=""
                loading="lazy"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/50 to-transparent" />
            </div>

            <div className="absolute -bottom-6 -end-4 sm:-end-6 bg-[#1F1D1A] text-[#FAF9F6] p-4 sm:p-5 border border-[#38332D] shadow-xl max-w-[200px]">
              <p className="font-display text-2xl text-[#C8A97E] font-medium">100%</p>
              <p className="text-[11px] uppercase tracking-wider text-[#A89F93] mt-0.5">
                {lang === "ar" ? "تركيزات عطرية أصيلة" : "Extrait de Parfum Grade"}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold-dark font-semibold">
              <span>✦</span>
              <span>{tr.maisonManifesto}</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl text-ink leading-snug">
              {tr.brandStoryTitle}
            </h2>

            <p className="text-sm sm:text-base text-charcoal leading-relaxed font-light">
              {tr.brandStoryDesc}
            </p>

            <div className="pt-4 grid grid-cols-2 gap-6 border-t border-line">
              <div className="space-y-1">
                <span className="font-display text-xl sm:text-2xl text-ink font-medium">
                  Paris & Cairo
                </span>
                <p className="text-xs text-muted uppercase tracking-wider">{tr.heritage}</p>
              </div>
              <div className="space-y-1">
                <span className="font-display text-xl sm:text-2xl text-ink font-medium">
                  Small Batches
                </span>
                <p className="text-xs text-muted uppercase tracking-wider">{tr.smallBatches}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── بانر العروض الفخم — مطابق لـ l'élixir ──────────────────
function SpecialOffersBanner() {
  const { lang } = useUIPrefs();
  const tr = t[lang];

  return (
    <section className="py-20 bg-[#F4F1EA] dark:bg-[#0B0A09] border-b border-[#E6E0D4] dark:border-[#1E1B18] relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1C1A17] dark:bg-[#151311] border border-[#2D2822] dark:border-[#26211C] text-[#FAF9F6] p-8 sm:p-12 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
          {/* خلفية فيديو دخاني */}
          <LazyVideo
            src="/videos/ambient.mp4"
            className="opacity-20"
          />
          {/* توهج ذهبي */}
          <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-[#C8A97E]/10 dark:bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 text-center lg:text-start z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C8A97E]/20 dark:bg-[#D4AF37]/20 text-[#E0C498] dark:text-[#EEDCB2] text-xs uppercase tracking-widest font-semibold">
              <span>🏷</span>
              <span>{tr.limitedTime}</span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-tight">
              {tr.hottestOffers}
            </h3>

            <p className="text-xs sm:text-sm text-[#B8AEA3] leading-relaxed font-light">
              {lang === "ar"
                ? "تمتع بخصومات حصرية على تشكيلة العطور المختارة مع هدايا فاخرة وتوصيل سريع لكل المحافظات."
                : "Acquire selected master flacons with exclusive seasonal savings and fast nationwide delivery."}
            </p>
          </div>

          <div className="z-10">
            <a
              href="/products?filter=offers"
              className="px-6 py-3.5 bg-[#C8A97E] dark:bg-[#D4AF37] hover:bg-[#B89669] dark:hover:bg-[#B88E4F] text-[#141210] font-semibold text-xs tracking-[0.2em] uppercase transition-colors flex items-center gap-2 shadow-md"
            >
              <span>{lang === "ar" ? "تسوق كل العروض" : "Shop All Offers"}</span>
              <span className="rtl:rotate-180">→</span>
            </a>
          </div>
        </div>

        {/* 3 عطور مخفضة — بتختفي لو مفيش عروض سارية */}
        <div className="mt-12">
          <ProductsGrid offersOnly limit={3} hideEmpty />
        </div>
      </div>
    </section>
  );
}

// ── شريط سينمائي بفيديو الرش ────────────────────────────────
function CinematicBand() {
  const { lang } = useUIPrefs();

  return (
    <section className="relative w-full h-[55vh] min-h-[320px] overflow-hidden bg-[#141210]">
      <LazyVideo
        src="/videos/spray.mp4"
        className="opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#141210]/70 via-[#141210]/40 to-[#141210]/80" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[#E0C498] mb-4"
        >
          {lang === "ar" ? "تجربة العطر" : "The Fragrance Experience"}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-3xl sm:text-5xl text-[#FAF9F6] max-w-2xl leading-snug"
        >
          {lang === "ar"
            ? "عطر لا يُوصف — يُعاش"
            : "A scent beyond description — felt, not just worn"}
        </motion.h2>
      </div>
    </section>
  );
}

// ── الصفحة ───────────────────────────────────────────────────
export default function HomePage() {
  const { lang } = useUIPrefs();
  const tr = t[lang];

  return (
    <div>
      <Hero />
      <ExploreCategories />
      <SpecialOffersBanner />
      <CinematicBand />

      {/* عطور مختارة */}
      <section className="py-20 bg-cream border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold-dark font-semibold mb-2">
                {tr.signatureIcons}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-ink">
                {tr.featuredProducts}
              </h2>
            </div>
            <Link
              href="/products"
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-ink hover:text-gold-dark transition-colors"
            >
              <span>{tr.viewAll}</span>
              <span className="rtl:rotate-180">→</span>
            </Link>
          </div>

          <ProductsGrid featuredOnly limit={4} />
        </div>
      </section>

      <BrandStory />
    </div>
  );
}
