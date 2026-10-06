import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/content/products";
import { productFaqs, tirzepatideFaqs, tadalafilFaqs, womenHrtFaqs } from "@/lib/content/faqs";
import { ProductHero } from "@/components/ProductHero";
import { PriceCompare } from "@/components/PriceCompare";
import { ProductVariants } from "@/components/ProductVariants";
import { SiteTestimonials } from "@/components/TestimonialsVideoSection";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { FaqDropdownItems } from "@/components/PeptidesFaq";
import { ProductSignupPrompt } from "@/components/ProductSignupPrompt";
import { WomenHormoneTherapy } from "@/components/WomenHormoneTherapy";
import { WomenComboTroches, womenComboTrochesFaqs } from "@/components/WomenComboTroches";
import { MenComboTroches, menComboTrochesFaqs } from "@/components/MenComboTroches";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

function faqsFor(slug: string) {
  if (slug === "weight-loss-tirzepatide") return tirzepatideFaqs;
  if (slug === "men-sexual-health-tadalafil") return tadalafilFaqs;
  if (slug === "women-hormone-therapy") return womenHrtFaqs;
  return productFaqs;
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (slug === "women-hormone-therapy") {
    return {
      title: "Hormone Therapy for Women (HRT) Online",
      description:
        "Lab-guided HRT to support comfort through perimenopause and menopause. Licensed providers, ongoing monitoring, treatment tailored to your labs.",
    };
  }
  return { title: product?.seoTitle ?? product?.name ?? "Treatment" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  if (slug === "women-hormone-therapy") {
    return (
      <>
        <WomenHormoneTherapy />
        <SiteTestimonials />
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-left font-sans text-[40px] leading-[1.1] font-medium !tracking-[-0.04em] text-[#331110]">
              FAQ: We&apos;ve Got <span className="font-serif-italic !tracking-[-0.04em] text-[#e43d4e]">Answers</span>.
            </h2>
            <div className="mt-[26px]">
              <FaqDropdownItems items={womenHrtFaqs} />
            </div>
          </div>
        </section>
        <ProductSignupPrompt />
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

  if (slug === "men-sexual-health-combo-troches") {
    return (
      <>
        <MenComboTroches />
        <SiteTestimonials />
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-left font-sans text-[40px] leading-[1.1] font-medium !tracking-[-0.04em] text-[#331110]">
              FAQ: We&apos;ve Got <span className="font-serif-italic !tracking-[-0.04em] text-[#e43d4e]">Answers</span>.
            </h2>
            <div className="mt-[26px]">
              <FaqDropdownItems items={menComboTrochesFaqs} />
            </div>
          </div>
        </section>
        <ProductSignupPrompt />
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

  if (slug === "women-sexual-health-combo-troches") {
    return (
      <>
        <WomenComboTroches />
        <SiteTestimonials />
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-left font-sans text-[40px] leading-[1.1] font-medium !tracking-[-0.04em] text-[#331110]">
              FAQ: We&apos;ve Got <span className="font-serif-italic !tracking-[-0.04em] text-[#e43d4e]">Answers</span>.
            </h2>
            <div className="mt-[26px]">
              <FaqDropdownItems items={womenComboTrochesFaqs} />
            </div>
          </div>
        </section>
        <ProductSignupPrompt />
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
      <ProductHero product={product} />
      {product.compare !== false && <PriceCompare />}
      <SiteTestimonials />
      {product.variants && <ProductVariants product={product} />}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-left font-sans text-[40px] leading-[1.1] font-medium !tracking-[-0.04em] text-[#331110]">
            FAQ: We&apos;ve Got <span className="font-serif-italic !tracking-[-0.04em] text-[#e43d4e]">Answers</span>.
          </h2>
          <div className="mt-[26px]">
            <FaqDropdownItems items={product.faqs ?? faqsFor(slug)} />
          </div>
        </div>
      </section>
      <ProductSignupPrompt />
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
