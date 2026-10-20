import Image from "next/image";
import { notFound } from "next/navigation";
import { CompleteLabBiomarkers } from "@/components/CompleteLabBiomarkers";
import { CompleteLabIncluded } from "@/components/CompleteLabIncluded";
import { SiteTestimonials } from "@/components/TestimonialsVideoSection";
import { CompleteLabStart } from "@/components/CompleteLabStart";
import { CompleteLabSteps } from "@/components/CompleteLabSteps";
import { CompleteLabFaq, labFaqs } from "@/components/CompleteLabFaq";
import { JsonLd } from "@/components/JsonLd";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { CompleteLabHero } from "@/components/CompleteLabHero";
import { HsaFsaBadge } from "@/components/HsaFsaBadge";
import { LabAddToCart } from "@/components/LabAddToCart";
import { labs } from "@/lib/content/products";
import { buildLabPageSchema } from "@/lib/seo/schema";
import type { Metadata } from "next";

const completeLabPoints = [
  {
    title: "Personalized to Your Biology",
    body: "No generic plans. Your treatment is built around your labs and adjusted as your body responds.",
  },
  {
    title: "Trusted by Licensed Providers",
    body: "Every protocol is reviewed and approved by board-certified clinicians, not algorithms.",
  },
  {
    title: "Catch Problems Before They Grow",
    body: "Identify hormonal and metabolic imbalances early, before they impact your health.",
  },
];

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

  if (lab.slug === "labs-complete-panel" || lab.slug === "labs-advance-panel") {
    const visible =
      lab.slug === "labs-advance-panel"
        ? {
            name: "Advanced Panel",
            biomarkers: lab.biomarkers,
            phoneSrc: "/images/also-like-advanced.png",
            phoneAlt: "Phone showing the Advanced Panel results",
            description:
              "Energy, mood, and sex drive all rely on hormonal balance. This lab panel analyzes 100 key biomarkers, providing a streamlined assessment of your hormone health.",
          }
        : {
            name: "Complete Panel",
            description:
              "Energy, mood, and sex drive all rely on hormonal balance. This lab panel analyzes 64 key biomarkers, providing a streamlined assessment of your hormone health.",
          };

    return (
      <>
        <JsonLd
          data={buildLabPageSchema(
            {
              slug: lab.slug,
              name: visible.name,
              description: visible.description,
              image: lab.image,
              price: lab.price,
            },
            labFaqs,
          )}
        />
        <CompleteLabHero
          slug={lab.slug}
          image={lab.image}
          price={lab.price}
          {...visible}
        />
        <section className="bg-[#f6f2f1] px-10 py-16 text-center md:py-20">
          <div className="mx-auto grid max-w-[1040px] gap-10 md:grid-cols-3 md:gap-x-16">
            {completeLabPoints.map((point) => (
              <article key={point.title}>
                <h2 className="font-sans text-[16px] font-semibold leading-snug tracking-normal text-[#321110]">
                  {point.title}
                </h2>
                <p className="mt-1.5 font-sans text-[14px] font-normal leading-[1.45] text-[#321110]">{point.body}</p>
              </article>
            ))}
          </div>
        </section>
        <CompleteLabBiomarkers panel={lab.slug === "labs-advance-panel" ? "advance" : "complete"} />
        <CompleteLabSteps />
        <CompleteLabIncluded />
        <SiteTestimonials />
        <CompleteLabFaq />
        <CompleteLabStart />
        <ArticleLibrary
          slugs={[
            "semaglutide-vs-tirzepatide-comparison-guide",
            "recovery-peptides-anti-doping-sourcing-guide",
            "low-libido-in-women-causes-evaluation-guide",
          ]}
        />
      </>
    );
  }

  return (
    <>
    <JsonLd
      data={buildLabPageSchema({
        slug: lab.slug,
        name: lab.name,
        description: lab.description,
        image: lab.image,
        price: lab.price,
      })}
    />
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
          <li>
            <HsaFsaBadge tone="onLight" />
          </li>
        </ul>
        <LabAddToCart slug={lab.slug} />
      </div>
    </section>
    </>
  );
}
