import Image from "next/image";
import Link from "next/link";
import { labs } from "@/lib/content/products";

const labMetrics = [
  { value: "2-5", label: "business days from draw to results" },
  { value: "30", label: "minutes clinical view, included" },
  { value: "", label: "HSA / FSA" },
];

export function LabsTeaser() {
  return (
    <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 bg-white py-[30px]">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-6 md:grid-cols-12 md:gap-8">
        <div className="min-w-0 md:col-span-5">
          <p className="font-sans text-[16px] font-semibold leading-[19.2px] tracking-normal text-[#e33b4f]">
            NOW AVAILABLE
          </p>
          <h2 className="mt-2 font-sans text-6xl font-medium leading-none tracking-normal text-[#e43c4e] md:text-[74px] md:leading-[88.8px]">
            Labs
          </h2>
          <p className="mt-4 max-w-[449px] font-sans text-[21px] font-normal leading-[25.2px] tracking-normal text-[#32120e]">
            Get a clearer picture of your health with comprehensive lab testing and expert clinical insights.
          </p>
          <div className="mt-8">
            {labMetrics.map((metric) => (
              <p
                key={metric.label}
                className="border-t border-ink/15 py-2 font-sans text-[21px] leading-[25.2px] tracking-normal text-[#32120e]"
              >
                {metric.value ? (
                  <span className="font-medium italic text-[#e33b4f]">{metric.value} </span>
                ) : null}
                {metric.label}
              </p>
            ))}
          </div>
        </div>
        <div className="grid min-w-0 gap-[19px] md:col-span-7 md:grid-cols-2">
          {labs.map((lab) => (
            <Link
              key={lab.slug}
              href={`/labs/${lab.slug}`}
              className="relative min-w-0 overflow-hidden rounded-[20px] pt-2"
              style={{
                background:
                  "linear-gradient(307deg, rgb(243, 218, 218) 0%, rgb(238, 208, 210) 16%, rgb(222, 211, 189) 100%)",
              }}
            >
              {"recommended" in lab && lab.recommended ? (
                <span className="absolute right-[19px] top-[21px] z-10 whitespace-nowrap rounded-[15px] bg-[#e43c4e]/75 px-2.5 py-[5px] text-[12px] font-medium text-white">
                  Recommended
                </span>
              ) : null}
              <Image
                src={lab.image}
                alt={lab.name}
                width={332}
                height={415}
                className="mx-auto h-auto w-full max-h-[415px] object-contain"
              />
              <div className="px-6 pb-6">
                <h3 className="font-sans text-[19px] font-medium uppercase leading-[22.8px] tracking-normal text-[#331110]">
                  {lab.name}
                </h3>
                <p className="mt-1 font-sans text-[18px] font-medium leading-[21.6px] tracking-normal text-[#e43c4e]">
                  ({lab.biomarkers}) / {lab.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
