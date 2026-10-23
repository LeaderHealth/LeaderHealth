import { EnergyLongevityHero } from "@/components/EnergyLongevityHero";
import { EnergyLongevityIntro } from "@/components/EnergyLongevityIntro";
import { EnergyLongevityWalkthrough } from "@/components/EnergyLongevityWalkthrough";
import { EnergyLongevityMatters } from "@/components/EnergyLongevityMatters";
import { EnergyLongevityFaq } from "@/components/EnergyLongevityFaq";
import { JsonLd } from "@/components/JsonLd";
import { energyLongevityFaqs } from "@/lib/content/faqs";
import { buildFaqSchema } from "@/lib/seo/schema";
import { isPublicHref } from "@/lib/content/visibility";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Energy & Longevity" };

export default function EnergyPage() {
  if (!isPublicHref("/energy-longevity")) notFound();
  return (
    <div>
      <JsonLd data={buildFaqSchema(energyLongevityFaqs)} />
      <EnergyLongevityHero />
      <EnergyLongevityIntro />
      <EnergyLongevityWalkthrough />
      <EnergyLongevityMatters />
      <EnergyLongevityFaq />
    </div>
  );
}
