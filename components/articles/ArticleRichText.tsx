import type { ArticleBlock, ArticleRun } from "@/lib/content/articles";

function headingId(text: string, used: Map<string, number>) {
  const base = text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function Runs({ runs }: { runs: ArticleRun[] }) {
  return runs.map((run, index) =>
    run.href ? (
      <a key={index} href={run.href} target={run.href.startsWith("http") ? "_blank" : undefined} rel={run.href.startsWith("http") ? "noreferrer" : undefined}>
        {run.text}
      </a>
    ) : (
      <span key={index}>{run.text}</span>
    ),
  );
}

export function ArticleRichText({ blocks, paragraphs }: { blocks?: ArticleBlock[]; paragraphs: string[] }) {
  if (!blocks?.length) {
    return paragraphs.map((paragraph) => <p key={paragraph.slice(0, 48)}>{paragraph}</p>);
  }

  const used = new Map<string, number>();

  return blocks.map((block, index) => {
    if (block.type === "heading") {
      const id = headingId(block.text, used);
      const Tag = block.level === 2 ? "h2" : "h3";
      return (
        <Tag key={`${id}-${index}`} id={id}>
          {block.text}
        </Tag>
      );
    }
    if (block.type === "list") {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag key={`list-${index}`}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>
              <Runs runs={item} />
            </li>
          ))}
        </Tag>
      );
    }
    return (
      <p key={index}>
        <Runs runs={block.runs} />
      </p>
    );
  });
}
