import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/content/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/5] bg-[#f3e6e8]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-8 transition group-hover:scale-[1.02]"
        />
        {product.labRequired && (
          <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 text-xs text-white">
            Lab required
          </span>
        )}
        <p className="absolute inset-x-0 bottom-3 px-4 text-center font-serif-italic text-[11px] text-ink/55">
          Illustration only. Actual medication and label may vary.
        </p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-2xl">{product.name}</h3>
        <p className="mt-2 text-sm text-brown">{product.price}</p>
        <span className="mt-auto pt-5 text-sm font-medium underline underline-offset-4">View</span>
      </div>
    </Link>
  );
}
