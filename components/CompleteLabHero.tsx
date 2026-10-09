import Image from "next/image";
import Link from "next/link";

const serif = {
  fontFamily: "var(--font-instrument-serif), Georgia, serif",
  fontStyle: "normal" as const,
  fontWeight: 400,
  letterSpacing: 0,
};

function labsCta(title: string) {
  const name = title.trim().toLowerCase();
  if (name === "complete panel") return "Get your complete labs started";
  if (name === "advanced panel") return "Get your advanced labs started";
  return "Get your labs started";
}

function GenderLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#e23d4c] px-3 font-sans text-[13px] font-medium tracking-[0.04em] text-white transition-colors hover:bg-[#c42e3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e23d4c]"
    >
      <span>{children}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}

function PhonePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={457}
      height={931}
      priority
      className="h-auto w-[220px] shrink-0 drop-shadow-[0_24px_50px_rgba(80,40,36,0.18)] min-[810px]:w-[200px] lg:h-[610px] lg:w-auto"
    />
  );
}

export function CompleteLabHero({
  price,
  name = "Complete Panel",
  biomarkers = "64 biomarkers",
  phoneSrc = "/images/complete-lab-phone.png",
  phoneAlt = "Phone showing the Complete Panel annual baseline, with 64 core biomarkers and a View Results button",
  description = "Energy, mood, and sex drive all rely on hormonal balance. This lab panel analyzes 64 key biomarkers, providing a streamlined assessment of your hormone health.",
  menUrl,
  womenUrl,
}: {
  slug: string;
  image: string;
  price: string;
  name?: string;
  biomarkers?: string;
  phoneSrc?: string;
  phoneAlt?: string;
  description?: string;
  menUrl: string;
  womenUrl: string;
}) {
  return (
    <section
      className="flex items-center justify-center px-4 py-16 min-[810px]:px-8 min-[810px]:py-20 lg:px-10 lg:py-24"
      style={{
        background:
          "linear-gradient(307deg, rgb(243, 218, 218) 0%, rgb(238, 208, 210) 16%, rgb(222, 211, 189) 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-8 min-[810px]:flex-row min-[810px]:items-center min-[810px]:justify-center min-[810px]:gap-8 lg:gap-16">
        <PhonePreview src={phoneSrc} alt={phoneAlt} />

        <article className="w-full max-w-[500px] rounded-[24px] bg-[#FFFCFA] px-5 py-6 shadow-[0_16px_40px_rgba(50,17,16,0.08)] min-[810px]:w-[430px] min-[810px]:max-w-none min-[810px]:px-6 min-[810px]:py-7 min-[1200px]:w-[500px] min-[1200px]:px-8 min-[1200px]:py-8">
          <p className="font-sans text-[12px] font-medium uppercase leading-none tracking-[0.14em] text-[#c45c66]">
            Diagnostic labs
          </p>

          <h1
            className="mt-3 font-serif text-[34px] leading-[1.05] text-[#2c1410] min-[810px]:text-[38px] min-[1200px]:text-[44px]"
            style={serif}
          >
            {name}
          </h1>
          <p className="mt-3 font-sans text-[14px] leading-[1.45] text-[#4a3330] min-[1200px]:text-[15px]">
            {description}
          </p>

          <div className="mt-5 border-t border-[#eadfd8] pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <p className="font-serif text-[28px] leading-none text-[#2c1410] min-[1200px]:text-[32px]" style={serif}>
                  {price}
                </p>
                <p className="mt-2 font-sans text-[12px] leading-none text-[#6d5a56] min-[1200px]:text-[13px]">
                  HSA / FSA eligible
                </p>
              </div>
              <div className="min-w-0 border-l border-[#eadfd8] pl-4 min-[810px]:pl-5">
                <p className="font-serif text-[22px] leading-none text-[#c23b48] min-[1200px]:text-[26px]" style={serif}>
                  {biomarkers}
                </p>
                <p className="mt-2 font-sans text-[12px] leading-none text-[#6d5a56] min-[1200px]:text-[13px]">
                  Biomarkers analyzed
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 font-sans text-[15px] font-semibold leading-snug text-[#2c1410] min-[1200px]:text-[16px]">
            {labsCta(name)}
          </p>
          <div className="mt-3 flex flex-col gap-2.5 min-[380px]:flex-row">
            <GenderLink href={menUrl}>FOR MEN</GenderLink>
            <GenderLink href={womenUrl}>FOR WOMEN</GenderLink>
          </div>
          <p className="mx-auto mt-3 max-w-[22rem] text-center font-sans text-[12px] leading-[1.4] text-[#6d5a56]">
            Select the sex assigned at birth so we match the right biomarkers and reference ranges.
          </p>
        </article>
      </div>
    </section>
  );
}
