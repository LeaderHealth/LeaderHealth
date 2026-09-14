import Image from "next/image";
import Link from "next/link";
import { labs } from "@/lib/content/products";

export function LabsTeaser() {
  return (
    <section className="mt-20">
      <p className="text-xs uppercase tracking-wider text-accent">Now available</p>
      <h2 className="mt-2 text-4xl md:text-5xl">Labs</h2>
      <p className="mt-3 max-w-xl text-taupe">
        Get a clearer picture of your health with comprehensive lab testing and expert clinical insights.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-brown">
        <span>2-5 business days from draw to results</span>
        <span>30 minutes clinical view, included</span>
        <span>HSA / FSA</span>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {labs.map((lab) => (
          <Link key={lab.slug} href={`/labs/${lab.slug}`} className="overflow-hidden rounded-3xl bg-white">
            <Image
              src={lab.image}
              alt={lab.name}
              width={400}
              height={700}
              className="h-72 w-full bg-[#1a1a1a] object-contain"
            />
            <div className="p-6">
              <h3 className="text-2xl uppercase">
                {lab.name}{" "}
                {"recommended" in lab && lab.recommended && (
                  <span className="ml-2 text-sm normal-case text-accent">Recommended</span>
                )}
              </h3>
              <p className="text-taupe">
                ({lab.biomarkers}) / {lab.price}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
