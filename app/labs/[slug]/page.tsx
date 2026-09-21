import Image from "next/image";
import { notFound } from "next/navigation";
import { labs } from "@/lib/content/products";
import { LabAddToCart } from "@/components/LabAddToCart";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return labs.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lab = labs.find((l) => l.slug === slug);
  return { title: lab?.name ?? "Labs" };
}

export default async function LabPage({ params }: Props) {
  const { slug } = await params;
  const lab = labs.find((l) => l.slug === slug);
  if (!lab) notFound();

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-32 md:grid-cols-2">
      <div className="rounded-3xl bg-[#111] p-6">
        <Image src={lab.image} alt={lab.name} width={400} height={720} className="mx-auto h-[520px] w-auto object-contain" />
      </div>
      <div>
        {lab.recommended && <p className="text-xs uppercase tracking-wider text-accent">Recommended</p>}
        <h1 className="mt-2 text-5xl">{lab.name}</h1>
        <p className="mt-3 text-xl text-brown">
          {lab.biomarkers} · {lab.price}
        </p>
        <p className="mt-6 leading-relaxed text-brown">{lab.description}</p>
        <ul className="mt-6 space-y-2 text-sm text-taupe">
          <li>2-5 business days from draw to results</li>
          <li>30 minutes clinical view, included</li>
          <li>HSA / FSA eligible</li>
        </ul>
        <LabAddToCart slug={lab.slug} />
      </div>
    </section>
  );
}
