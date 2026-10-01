import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getLegal, legalPages, type LegalBlock, type LegalRun } from "@/lib/content/legal";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

function LegalRuns({ runs }: { runs: LegalRun[] }) {
  return runs.map((run, index) => {
    if (run.href) {
      const external = run.href.startsWith("mailto:") || run.href.startsWith("http");
      return (
        <a
          key={index}
          href={run.href}
          className={`text-accent underline decoration-1 underline-offset-2 ${run.bold ? "font-bold" : ""}`}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {run.text}
        </a>
      );
    }
    if (run.bold) {
      return (
        <strong key={index} className="font-bold">
          {run.text}
        </strong>
      );
    }
    return <span key={index}>{run.text}</span>;
  });
}

function LegalBlocks({ blocks }: { blocks: LegalBlock[] }) {
  return blocks.map((block, index) => {
    if (block.kind === "h3") {
      return (
        <h3 key={index} className="mt-6 text-xl">
          {block.runs ? <LegalRuns runs={block.runs} /> : block.text}
        </h3>
      );
    }
    if (block.kind === "list") {
      return (
        <ul key={index} className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-brown">
          {block.items.map((item, itemIndex) => {
            const runs = block.runs?.[itemIndex];
            return <li key={itemIndex}>{runs ? <LegalRuns runs={runs} /> : item}</li>;
          })}
        </ul>
      );
    }
    if (block.kind === "table") {
      return (
        <div key={index} className="mt-4 overflow-x-auto">
          <table className={`w-full border-collapse text-left text-sm leading-relaxed text-brown ${block.headers.length > 2 ? "min-w-[640px]" : ""}`}>
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
                  {row.map((cell, cellIndex) => {
                    const runs = block.cellRuns?.[rowIndex]?.[cellIndex];
                    return (
                      <td key={cellIndex} className="border-b border-ink/15 px-3 py-3 align-top">
                        {runs ? <LegalRuns runs={runs} /> : cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <p key={index} className="mt-4 leading-relaxed text-brown">
        {block.runs ? <LegalRuns runs={block.runs} /> : block.text}
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
      <Link href="/" aria-label="Leader Health" className="inline-flex">
        <Image
          src="/images/lh-logo-red.png"
          alt="Leader Health"
          width={1024}
          height={70}
          priority
          className="h-auto w-[220px] sm:w-[280px]"
        />
      </Link>
      <h1 className="mt-6 text-5xl">{page.title}</h1>
      {page.effective && <p className="mt-3 text-sm text-taupe">Effective Date: {page.effective}</p>}
      {page.intro && (
        <div className="mt-10">
          <LegalBlocks blocks={page.intro} />
        </div>
      )}
      <div className="mt-10 space-y-10">
        {page.sections.map((section, index) => (
          <section key={`${section.heading}-${index}`}>
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
