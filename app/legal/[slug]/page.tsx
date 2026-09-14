import { notFound } from "next/navigation";
import { getLegal, legalPages } from "@/lib/content/legal";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return legalPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getLegal(slug);
  return { title: page?.title ?? "Legal" };
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = getLegal(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 pb-20 pt-32">
      <h1 className="text-5xl">{page.title}</h1>
      {page.effective && <p className="mt-3 text-sm text-taupe">Effective Date: {page.effective}</p>}
      <div className="mt-10 space-y-10">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl">{section.heading}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)} className="mt-4 leading-relaxed text-brown">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
