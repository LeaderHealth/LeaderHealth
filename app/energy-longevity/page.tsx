import { EnergyLongevityHero } from "@/components/EnergyLongevityHero";
import { EnergyLongevityIntro } from "@/components/EnergyLongevityIntro";
import { EnergyLongevityWalkthrough } from "@/components/EnergyLongevityWalkthrough";
import { EnergyLongevityMatters } from "@/components/EnergyLongevityMatters";
import { EnergyLongevityFaq } from "@/components/EnergyLongevityFaq";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Energy & Longevity" };

export default function EnergyPage() {
  return (
    <div>
      <EnergyLongevityHero />
      <EnergyLongevityIntro />
      <EnergyLongevityWalkthrough />
      <EnergyLongevityMatters />
      <EnergyLongevityFaq />
    </div>
  );
}
