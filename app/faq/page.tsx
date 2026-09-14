import { FaqList } from "@/components/FaqList";
import { faqs } from "@/lib/content/faqs";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQs" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-32">
      <h1 className="text-5xl">FAQs</h1>
      <p className="mt-4 text-taupe">
        Straightforward answers about labs, compounding, shipping, and how care actually works.
      </p>
      <div className="mt-10">
        <FaqList items={faqs} />
      </div>
    </div>
  );
}
