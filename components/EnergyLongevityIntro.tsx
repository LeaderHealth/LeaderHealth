import Image from "next/image";
import { assets } from "@/lib/content/site";

const benefits = [
  "No membership cost or hidden fees",
  "Ongoing care, unlimited provider messaging",
  "Convenient delivery, right to your doorstep",
];

const systems = [
  {
    n: "01",
    title: "Cellular energy production",
    body: "Mitochondria convert fuel into usable energy. Output declines with age, nutrient gaps, and oxidative stress, which shows up as low stamina and mid-afternoon collapse.",
  },
  {
    n: "02",
    title: "Hormonal and stress regulation",
    body: "Thyroid, testosterone, estrogen, and cortisol set the pace everything else runs at. Sustained stress keeps the body in survival mode and blunts recovery.",
  },
  {
    n: "03",
    title: "Inflammation and metabolic load",
    body: "Chronic inflammation and unstable blood sugar interrupt both energy production and clear thinking, compounding quietly over years.",
  },
];

function CheckIcon() {
  return (
    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e43d4e] text-white">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d="M5 12.5 9.5 17 19 7.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function FindingsCard({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`flex h-[145px] w-[234px] shrink-0 flex-col justify-center rounded-[18px] bg-[#e8dfc8] px-5 py-[18px] shadow-[0_12px_32px_rgba(51,17,16,0.12)] ${className}`}
    >
      <p className="whitespace-nowrap font-sans text-[12px] font-semibold leading-none tracking-[0.06em] text-[#e43d4e] uppercase">
        Most common findings
      </p>
      <p className="mt-2 font-sans text-[16px] font-normal leading-[1.35] text-[#331110]">
        Thyroid, ferritin, or vitamin D — not willpower.
      </p>
    </aside>
  );
}

export function EnergyLongevityIntro() {
  return (
    <>
      <section className="bg-[#F7F3F5] px-6 py-14 md:px-10 md:py-16 lg:py-[72px]">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
          <div className="min-w-0">
            <h2 className="max-w-[40rem] font-sans text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-[#4a2a26] sm:text-[38px] md:text-[42px] lg:text-[46px] lg:leading-[1.08]">
              Tired isn&apos;t a personality trait.
              <span className="block">It&apos;s a measurement.</span>
            </h2>
            <p className="mt-4 max-w-[34rem] font-sans text-[14px] leading-[1.55] text-[#331110] sm:text-[15px] md:text-base">
              Low energy, poor sleep, changes in weight, and slow recovery can have many contributing factors. Lab
              testing helps your provider understand what&apos;s happening and determine appropriate next steps.
            </p>
            <hr className="mt-7 max-w-[34rem] border-0 border-t border-[#331110]/15" />
            <ul className="mt-7 space-y-4">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckIcon />
                  <p className="pt-0.5 font-sans text-[15px] leading-snug text-[#331110] md:text-base">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] pl-10 sm:pl-14 lg:max-w-none lg:pl-[72px]">
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-full bg-[#c9a8ab] sm:aspect-[4/5] lg:aspect-[3/4]">
              <Image
                src={assets.energyMeasurement}
                alt="Woman resting after a workout, holding a Leader Health bottle"
                fill
                className="object-cover object-[center_20%]"
                sizes="(min-width: 1024px) 520px, 90vw"
              />
            </div>
            <FindingsCard className="absolute bottom-5 left-0 z-10" />
          </div>
        </div>
      </section>

      <section className="bg-[#321110] px-6 py-12 text-white md:px-10 md:py-14 lg:py-16">
        <div className="mx-auto w-full max-w-[1180px]">
          <h2 className="max-w-[22rem] font-sans text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-[#e98a90] sm:max-w-none sm:text-[40px] md:text-[46px] lg:text-[52px]">
            Three systems drive how you feel at 3PM.
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 md:mt-10 md:gap-4">
            {systems.map((item) => (
              <article
                key={item.n}
                className="rounded-[22px] px-5 py-6 text-[#331110] md:rounded-[26px] md:px-6 md:py-7"
                style={{
                  backgroundImage: "linear-gradient(180deg, #EBE4DC 0%, #E3C5BB 48%, #D9A39A 100%)",
                }}
              >
                <p className="font-sans text-[13px] text-[#331110]/70">({item.n})</p>
                <h3 className="mt-3 font-sans text-[26px] font-medium leading-[1.12] tracking-[-0.03em] md:text-[30px] lg:text-[34px]">
                  {item.title}
                </h3>
                <p className="mt-4 font-sans text-[14px] leading-[1.55] text-[#331110]/90 md:text-[15px]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
