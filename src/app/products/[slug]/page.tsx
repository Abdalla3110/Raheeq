import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/types";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import ProductDetailsClient from "./ProductDetailsClient";

// بيانات المنتج عامة (منشورة) — بنقراها بعميل مباشر بدون كوكيز
// عشان الصفحة تقدر تتخزن (ISR) وتتخدم فورًا لكل الزوار
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// cache() بيمنع الاستعلام المكرر بين generateMetadata والصفحة
const getProduct = cache(async function getProduct(
  slug: string
): Promise<Product | null> {
  const { data } = await supabasePublic
    .from("products")
    .select(`*, variants:product_variants(*, offer:offers(*))`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return (data as Product) ?? null;
});

// الصفحة تتخزن دقيقة واحدة فقط — تعديلات الأدمن تظهر بسرعة
// (مع dynamic rendering: كل طلب بعد انتهاء الدقيقة بيجيب بيانات طازة)
export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "المنتج غير موجود" };

  const title = product.meta_title ?? product.name;
  const description =
    product.meta_description ??
    product.description?.slice(0, 160) ??
    `عطر ${product.name} من ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/products/${product.slug}` },
    openGraph: {
      title,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  // Structured data لمحركات البحث
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: (product.variants ?? [])
      .filter((v) => v.is_active)
      .map((v) => ({
        "@type": "Offer",
        name: `${v.size_ml} مل`,
        priceCurrency: "EGP",
        price: v.price,
        availability:
          v.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        url: `${SITE_URL}/products/${product.slug}`,
      })),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* مسار التنقل */}
      <nav className="text-sm text-charcoal/60 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-gold">
          الرئيسية
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gold">
          العطور
        </Link>
        <span>/</span>
        <span className="text-ink font-semibold">{product.name}</span>
      </nav>

      <ProductDetailsClient product={product} />
    </div>
  );
}
