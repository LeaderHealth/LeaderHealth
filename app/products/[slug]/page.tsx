import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/content/products";
import { faqsForProduct } from "@/lib/content/faqs";
import { ProductHero } from "@/components/ProductHero";
import { PriceCompare } from "@/components/PriceCompare";
import { ProductVariants } from "@/components/ProductVariants";
import { SiteTestimonials } from "@/components/TestimonialsVideoSection";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { FaqDropdownItems } from "@/components/PeptidesFaq";
import { ProductSignupPrompt } from "@/components/ProductSignupPrompt";
import { WomenHormoneTherapy } from "@/components/WomenHormoneTherapy";
import { WomenComboTroches } from "@/components/WomenComboTroches";
import { MenComboTroches } from "@/components/MenComboTroches";
import { IntimacyBlend } from "@/components/IntimacyBlend";
import { JsonLd } from "@/components/JsonLd";
import { buildProductPageSchema } from "@/lib/seo/schema";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

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

  const faqs = product.faqs ?? faqsForProduct(slug);
  const structuredData = <JsonLd data={buildProductPageSchema(product, faqs)} />;

  if (slug === "women-hormone-therapy") {
    return (
      <>
        {structuredData}
        <WomenHormoneTherapy />
        <SiteTestimonials />
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-left font-sans text-[40px] leading-[1.1] font-medium !tracking-[-0.04em] text-[#331110]">
              FAQ: We&apos;ve Got <span className="font-serif-italic !tracking-[-0.04em] text-[#e43d4e]">Answers</span>.
            </h2>
            <div className="mt-[26px]">
              <FaqDropdownItems items={faqs} />
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
        {structuredData}
        <MenComboTroches />
        <SiteTestimonials />
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-left font-sans text-[40px] leading-[1.1] font-medium !tracking-[-0.04em] text-[#331110]">
              FAQ: We&apos;ve Got <span className="font-serif-italic !tracking-[-0.04em] text-[#e43d4e]">Answers</span>.
            </h2>
            <div className="mt-[26px]">
              <FaqDropdownItems items={faqs} />
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

  if (slug === "intimacy-blend-(pt-141-oxytocin-tadalafil)") {
    return (
      <>
        {structuredData}
        <IntimacyBlend />
        <SiteTestimonials />
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-left font-sans text-[40px] leading-[1.1] font-medium !tracking-[-0.04em] text-[#331110]">
              FAQ: We&apos;ve Got <span className="font-serif-italic !tracking-[-0.04em] text-[#e43d4e]">Answers</span>.
            </h2>
            <div className="mt-[26px]">
              <FaqDropdownItems items={faqs} />
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
        {structuredData}
        <WomenComboTroches />
        <SiteTestimonials />
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-left font-sans text-[40px] leading-[1.1] font-medium !tracking-[-0.04em] text-[#331110]">
              FAQ: We&apos;ve Got <span className="font-serif-italic !tracking-[-0.04em] text-[#e43d4e]">Answers</span>.
            </h2>
            <div className="mt-[26px]">
              <FaqDropdownItems items={faqs} />
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
      {structuredData}
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
            <FaqDropdownItems items={faqs} />
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
