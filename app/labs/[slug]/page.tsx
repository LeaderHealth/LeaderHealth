import Image from "next/image";
import Link from "next/link";
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

const alsoLike = [
  {
    href: "/labs/labs-advance-panel",
    title: "Advanced Panel",
    body: "Expanded Panel covering 100 biomarkers",
    price: "$399",
    src: "/images/also-like-advanced.png",
    alt: "Phone showing the Advanced Panel results",
    width: 515,
    height: 967,
    imageClass: "max-h-[270px] max-w-[78%]",
  },
  {
    href: "/products/sexual-health-pt-141-nasal",
    title: "PT-141 nasal",
    body: "A fast-acting nasal spray for sexual desire and arousal.",
    price: "$179",
    src: "/images/also-like-pt141.png",
    alt: "PT-141 nasal spray bottle",
    width: 186,
    height: 553,
    imageClass: "max-h-[270px] max-w-full",
  },
  {
    href: "/products/men-sexual-health-tadalafil",
    title: "Tadalafil/Slidenadil PRN",
    body: "A clinically proven PDE5 inhibitor",
    price: "$39",
    src: "/images/also-like-tadalafil.png",
    alt: "Yellow tablet stamped LH",
    width: 417,
    height: 262,
    imageClass: "max-h-[150px] max-w-[220px]",
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
    const suggestions =
      lab.slug === "labs-advance-panel"
        ? [
            {
              href: "/labs/labs-complete-panel",
              title: "Complete Panel",
              body: "Baseline panel covering 64 biomarkers",
              price: "$179",
              src: "/images/complete-lab-phone.png",
              alt: "Phone showing the Complete Panel results",
              width: 457,
              height: 931,
              imageClass: "max-h-[270px] max-w-[78%]",
            },
            ...alsoLike.slice(1),
          ]
        : alsoLike;

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
        <CompleteLabHero slug={lab.slug} image={lab.image} price={lab.price} {...visible} />
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
        <section className="bg-[#F7F3F2] px-5 py-12 md:px-10 md:py-16">
          <div className="mx-auto w-full max-w-[1080px]">
            <h2 className="font-sans text-[28px] font-medium tracking-normal text-[#321110] md:text-[32px]">
              You might also like
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-10 min-[810px]:grid-cols-3 min-[810px]:gap-6">
              {suggestions.map((item) => (
                <Link key={item.href} href={item.href} className="group block">
                  <div className="mx-auto flex aspect-[305/321] w-full max-w-[305px] items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-b from-[#FAF4EA] to-[#DDD3BE]">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      className={`h-auto w-auto object-contain ${item.imageClass}`}
                    />
                  </div>
                  <h3 className="mt-4 font-sans text-[22px] font-medium leading-tight tracking-normal text-[#321110]">
                    {item.title}
                  </h3>
                  <p className="mt-1 font-sans text-[15px] leading-snug text-[#5c4a46]">{item.body}</p>
                  <p className="mt-2 font-sans text-[15px] text-[#321110]">{item.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
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
