import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/content/products";
import { GET_STARTED_URL } from "@/lib/content/site";
import { productFaqs } from "@/lib/content/faqs";
import { ProductHero } from "@/components/ProductHero";
import { PriceCompare } from "@/components/PriceCompare";
import { Testimonials } from "@/components/Testimonials";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { FaqList } from "@/components/FaqList";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product?.name ?? "Treatment" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <>
      <ProductHero product={product} />

      {product.compare && <PriceCompare />}

      {product.variants && (
        <section id="find-what-fits" className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-4xl md:text-5xl">Find What Fits You</h2>
            <p className="mt-3 max-w-xl text-taupe">
              Same goal, two paths. Each option is personalized to your body and backed by clinician support. Tell us what fits your routine, and your provider helps you land on the right one.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {product.variants.map((v) => (
                <article key={v.name} className="rounded-[28px] bg-white p-8">
                  <p className="text-sm text-taupe">{v.detail.split("·")[0]}</p>
                  <h3 className="mt-2 text-3xl">{v.name}</h3>
                  <p className="mt-2 text-sm text-taupe">{v.detail}</p>
                  <ul className="mt-5 space-y-1 text-sm text-brown">
                    {v.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                  <p className="mt-6 text-lg">{v.price}</p>
                  <a
                    href={GET_STARTED_URL}
                    className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm text-white"
                  >
                    Start now
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl">FAQ: We&apos;ve Got Answers.</h2>
          <div className="mt-8">
            <FaqList items={productFaqs} />
          </div>
        </div>
      </section>
      <Testimonials />
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
