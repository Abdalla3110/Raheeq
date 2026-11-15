import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "كل العطور",
  description:
    "تشكيلة عطور رجالية وحريميه وللجنسين — فلتر بالتصنيف والترتيب بالسعر.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;

  const title =
    category === "men"
      ? "العطور الرجالية"
      : category === "women"
      ? "العطور الحريميه"
      : category === "unisex"
      ? "عطور للجنسين"
      : "كل العطور";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-dark font-semibold mb-2">
          The Collection
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ink mb-3">{title}</h1>
        <div className="gold-divider w-40 mx-auto" />
      </div>
      <ProductsClient initialCategory={category ?? ""} initialSort={sort ?? "newest"} />
    </div>
  );
}
