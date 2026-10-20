import type { JsonLdNode } from "@/lib/seo/schema";

function serialize(node: JsonLdNode) {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: JsonLdNode | null | undefined | Array<JsonLdNode | null | undefined> }) {
  const nodes = (Array.isArray(data) ? data : [data]).filter((node): node is JsonLdNode => node != null);
  if (nodes.length === 0) return null;

  return (
    <>
      {nodes.map((node, index) => (
        <script
          key={`${node["@type"]}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serialize(node) }}
        />
      ))}
    </>
  );
}
