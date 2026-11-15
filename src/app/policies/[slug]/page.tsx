import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { t } from "@/lib/translations";
import PolicyContent from "./PolicyContent";

const slugs = Object.keys(t.ar.policies);

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = t.ar.policies[slug as keyof typeof t.ar.policies];
  return { title: policy?.title ?? "سياسات" };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slugs.includes(slug)) notFound();

  return <PolicyContent slug={slug} />;
}
