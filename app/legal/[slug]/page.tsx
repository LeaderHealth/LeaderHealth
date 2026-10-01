import { notFound } from "next/navigation";
import { getLegal, legalPages, type LegalBlock } from "@/lib/content/legal";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

function LegalBlocks({ blocks }: { blocks: LegalBlock[] }) {
  return blocks.map((block, index) => {
    if (block.kind === "h3") {
      return (
        <h3 key={index} className="mt-6 text-xl">
          {block.text}
        </h3>
      );
    }
    if (block.kind === "list") {
      return (
        <ul key={index} className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-brown">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    }
    if (block.kind === "table") {
      return (
        <div key={index} className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm leading-relaxed text-brown">
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th key={header} className="border-b-2 border-ink px-3 py-3 align-bottom font-semibold text-ink">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border-b border-ink/15 px-3 py-3 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <p key={index} className="mt-4 leading-relaxed text-brown">
        {block.text}
      </p>
    );
  });
}

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
            {section.blocks ? (
              <LegalBlocks blocks={section.blocks} />
            ) : (
              section.paragraphs.map((p) => (
                <p key={p.slice(0, 48)} className="mt-4 leading-relaxed text-brown">
                  {p}
                </p>
              ))
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
