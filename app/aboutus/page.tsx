import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { assets, GET_STARTED_URL } from "@/lib/content/site";

export const metadata: Metadata = { title: "About Us" };

const wordmark = "https://framerusercontent.com/images/sNMe9fVf2wXdbNnteLR9J7jY04g.png?width=8103&height=554";

const heroImage = "https://framerusercontent.com/images/7jQVmW4yiq3pvyrl3im6JIvOlAA.png?width=1264&height=848";

const collage = [
  {
    src: "https://framerusercontent.com/images/pJuQJ6GVQHWdbE5f53l3qpW3gOM.png?width=1200&height=896",
    alt: "Hand holding a smartphone displaying a Leader Health dose reminder screen reading \"Time for your dose\" with a progress ring and \"Mark as done\" button.",
  },
  {
    src: "https://framerusercontent.com/images/eS2i5fcV2jlzXSBJTEcJGOKVqCA.png?width=1391&height=1391",
    alt: "Clear glass vial of red Leader Health PT-141 injectable with a dark cap, labeled \"Pharmaceutical-Grade.\"",
    badge: true,
  },
  {
    src: "https://framerusercontent.com/images/CYnFHRJ69xxG8nvVHh5WSBHolQ.png?width=1264&height=848",
    alt: "Clinician in a white coat holding a stethoscope and notebook against a dark background.",
  },
  {
    src: "https://framerusercontent.com/images/UVBgqMEw9ZvcyGqEroIU5YlxFgA.png?width=1264&height=848",
    alt: "Man performing a cable triceps pushdown in a sunlit gym.",
  },
];

const missionImage = "https://framerusercontent.com/images/QqynVJdRw9UjUsat2eXAOFemEM.png?width=1264&height=848";
const statementImage = "https://framerusercontent.com/images/3zSFjjEYGk6V3OMDU3CrBF3docM.png?width=1264&height=848";
const careImage = "https://framerusercontent.com/images/hAoALjXB3s4SMGH0XvluP24r8gc.png?width=1152&height=928";

const carePoints = [
  {
    title: "Personalized treatment plans tailored to your body and goals.",
    body: "Every treatment is tailored to your health profile, so results feel natural and sustainable.",
  },
  {
    title:
      "care is delivered by independent licensed clinicians, each licensed in the state where you are located.",
    body: "Medical experts guide your progress and adjust your plan when needed.",
  },
  {
    title: "Safe and clinically proven therapies.",
    body: "Backed by science and trusted by thousands, ensuring results you can rely on.",
  },
  {
    title: "Support from start to finish.",
    body: "From first consultation to delivery, we make care simple and stress-free.",
  },
];

const leaders = [
  {
    name: "Stephen Ratcliff, MD, MBA",
    role: "CMO · Co-Founder",
    image: "https://framerusercontent.com/images/CBEORhbxaa9YtXhJqFi9Ce8oWS8.png?width=664&height=798",
    alt: "Stephen Ratcliff",
  },
  {
    name: "Steven Fowler, NP",
    role: "COO · Co-founder",
    image: "https://framerusercontent.com/images/csb09sKSMjlJ57j7c5rPUdl6ym8.jpg?width=2048&height=2560",
    alt: "Steven Fowler",
  },
  {
    name: "Patrick Anderson",
    role: "CEO · Co-founder",
    image: "https://framerusercontent.com/images/DqmDxqwQi1o7z5hXDwYSSCRBd6w.png?width=633&height=717",
    alt: "Patrick Anderson",
  },
];

const warmPanel = "linear-gradient(120deg, rgb(242, 218, 218) 0%, rgb(220, 212, 189) 100%)";
const hairline = "bg-[#E33D4D]";

function VerticalDivider({ className }: { className: string }) {
  return <div aria-hidden className={`absolute hidden w-px min-[1000px]:block ${hairline} ${className}`} />;
}

function Editorial({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`font-serif-italic font-normal ${className ?? ""}`} style={style}>
      {children}
    </span>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-[#F7F3F5] text-[#331110]">
      <section className="relative h-[78vh] overflow-hidden">
        <Image
          src={heroImage}
          alt="Provider meeting with Patient"
          fill
          priority
          className="object-cover object-[center_top]"
          sizes="100vw"
        />
        <div className="relative flex h-full items-center justify-center px-6 text-center">
          <div className="relative isolate w-full max-w-[480px]">
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: "140%",
                height: "145%",
                backgroundImage:
                  "radial-gradient(ellipse at center, rgba(51, 17, 16, 0.48) 0%, rgba(51, 17, 16, 0.38) 30%, rgba(51, 17, 16, 0.2) 55%, rgba(51, 17, 16, 0.06) 75%, rgba(51, 17, 16, 0) 100%)",
                filter: "blur(22px)",
              }}
            />
            <div className="relative z-10">
              <h1
                className="font-sans text-[46px] font-medium leading-[0.96] text-[#F7F3F5] min-[1000px]:text-[60px] min-[1200px]:text-[96px]"
                style={{ letterSpacing: "-0.035em" }}
              >
                Who <Editorial style={{ letterSpacing: "-0.035em" }}>Are</Editorial>
                <br />
                We?
              </h1>
              <p className="mt-4 font-sans text-[12px] font-medium tracking-[0.14em] text-[rgba(247,243,245,0.8)] uppercase">
                Leader is about{" "}
                <span className="font-bold text-[#E33D4D]">health</span>
                {", "}
                <span className="font-bold text-[#E33D4D]">fitness</span>
                {" & "}
                <span className="font-bold text-[#E33D4D]">formulas</span>
              </p>
              <p className="mx-auto mt-4 max-w-[480px] font-sans text-[16px] leading-[1.6] font-normal text-[rgba(247,243,245,0.9)] min-[1200px]:text-[18px]">
                Leader Health is a physician-led telehealth practice bringing clinical-grade hormone, weight, and
                longevity care within reach of everyone who needs it.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#E33D4D]" />
      </section>

      <section className="bg-[#F7F3F5] py-10 min-[1200px]:py-[50px]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 min-[1000px]:px-10 min-[1200px]:flex-row min-[1200px]:items-start min-[1200px]:gap-12 min-[1200px]:px-16 min-[1200px]:py-[50px]">
          <div className="min-[1200px]:w-[427px] min-[1200px]:shrink-0">
            <Image
              src={wordmark}
              alt="Leader Health"
              width={8103}
              height={554}
              className="h-[19px] w-[220px] min-[1200px]:w-[275px]"
            />
            <h2
              className="mt-2.5 font-sans text-[40px] font-medium leading-[1.05] text-[#331110] min-[1000px]:text-[44px] min-[1200px]:text-[60px] min-[1200px]:leading-[63px]"
              style={{ letterSpacing: "-0.03em" }}
            >
              Where <Editorial style={{ letterSpacing: "-0.03em" }}>Science</Editorial>
              <br className="hidden min-[1200px]:block" /> Meets Care
            </h2>
            <p className="mt-3.5 max-w-[36rem] font-sans text-[16px] leading-[1.72] min-[1200px]:text-[18px]">
              Personalized therapies for hormones, weight, and vitality — guided by doctors, backed by research,
              designed for real results.
            </p>
            <h2
              className="mt-8 font-sans text-[40px] font-medium leading-[1.05] text-[#331110] min-[1000px]:text-[44px] min-[1200px]:mt-9 min-[1200px]:text-[60px] min-[1200px]:leading-[63px]"
              style={{ letterSpacing: "-0.03em" }}
            >
              To Redefine
              <br className="hidden min-[1200px]:block" />{" "}
              <Editorial style={{ letterSpacing: "-0.03em" }}>Modern</Editorial> Wellness
            </h2>
            <p className="mt-3.5 max-w-[36rem] font-sans text-[16px] leading-[1.72] min-[1200px]:text-[18px]">
              At Leader Health, the goal is simple: to make advanced medical therapies accessible, safe, and
              effective for everyone.
            </p>
            <a
              href={GET_STARTED_URL}
              className="mt-4 inline-flex items-center justify-center rounded-[39px] bg-[#DF4452] px-[26px] py-[14px] font-sans text-[16px] leading-none font-semibold tracking-[-0.02em] text-[#F7F3F5] transition-colors duration-200 hover:bg-[#E43D4E] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#331110]"
            >
              Get Started
            </a>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3">
            {collage.map((item) => (
              <div
                key={item.src}
                className="relative h-[165px] overflow-hidden rounded-[8px] min-[1000px]:h-[290px] min-[1200px]:h-[318px]"
              >
                <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="(min-width: 1200px) 300px, 45vw" />
                {item.badge ? (
                  <span
                    className="absolute bottom-4 left-4 rounded-full bg-[rgba(253,252,248,0.42)] px-4 py-3 font-sans text-[9px] font-semibold tracking-[0.08em] text-[#331110] uppercase min-[1200px]:text-[11px]"
                    style={{
                      backdropFilter: "blur(22px)",
                      WebkitBackdropFilter: "blur(22px)",
                      backgroundImage:
                        "linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 48%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255, 255, 255, 0.72), inset 0 0 0 1px rgba(255, 255, 255, 0.38)",
                    }}
                  >
                    Pharmaceutical-grade
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-8 pb-12 min-[1200px]:pt-24 min-[1200px]:pb-20" style={{ backgroundImage: warmPanel }}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-6 min-[1000px]:flex-row min-[1000px]:items-start min-[1000px]:gap-14 min-[1000px]:px-10 min-[1200px]:gap-[56px] min-[1200px]:px-4">
          <div className="relative h-[327px] w-full overflow-hidden rounded-[16px] min-[1000px]:h-[506px] min-[1000px]:w-[354px] min-[1000px]:shrink-0 min-[1200px]:w-[393px]">
            <Image
              src={missionImage}
              alt="Man seated on a weight bench in a dimly lit gym, gripping a dumbbell mid-set."
              fill
              className="object-cover object-right"
              sizes="(min-width: 1200px) 393px, 90vw"
            />
          </div>
          <div className="relative min-[1000px]:max-w-[629px] min-[1000px]:pt-3 min-[1200px]:pl-6">
            <VerticalDivider className="top-0 bottom-0 -left-4" />
            <p className="font-sans text-[17px] font-bold tracking-[0.12em] uppercase">Our Mission</p>
            <h2
              className="mt-3.5 font-sans text-[40px] font-medium leading-[1.05] min-[1200px]:text-[64px] min-[1200px]:leading-[67px]"
              style={{ letterSpacing: "-0.03em" }}
            >
              Why We <Editorial style={{ letterSpacing: "-0.03em" }}>Exist</Editorial>
            </h2>
            <div className="mt-6 space-y-4 font-sans text-[16px] leading-[1.72] min-[1200px]:mt-7">
              <p>
                Leader Health started with a simple observation from inside the exam room: the most effective
                clinical tools were reserved for elite athletes, executives, and people who knew the right
                specialist.
              </p>
              <p>
                We set out to change that. Drawing from endocrinology, sports medicine, and longevity research,
                our clinical team built a protocol-first practice that moves at the pace of science — not insurance
                timelines or institutional inertia.
              </p>
              <p>
                The result is a practice built around the individual — where your biology, your goals, and your
                timeline shape everything from intake to ongoing care.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex h-[558px] items-center justify-center overflow-hidden min-[1000px]:h-[640px] min-[1200px]:h-[729px]">
        <div className="absolute inset-0 bg-[linear-gradient(rgb(51,17,16),rgb(74,43,36))]" />
        <Image
          src={statementImage}
          alt="Lifter standing in a sunlit warehouse gym surrounded by loaded barbells and racks."
          fill
          className="object-cover opacity-[0.12]"
          sizes="100vw"
        />
        <div className="relative w-full max-w-[1200px] px-6 text-center min-[1000px]:px-10 min-[1200px]:px-16">
          <div aria-hidden className={`h-px w-full ${hairline}`} />
          <h2
            className="my-8 font-sans text-[60px] font-semibold leading-[1.06] text-[#F2C6C3] min-[1200px]:my-14 min-[1200px]:text-[125px] min-[1200px]:leading-[132px]"
            style={{ letterSpacing: "-0.03em" }}
          >
            Lead your <Editorial className="text-[#E43D4E]" style={{ letterSpacing: "-0.03em" }}>health</Editorial>.
            <br />
            Live your <Editorial className="text-[#E43D4E]" style={{ letterSpacing: "-0.03em" }}>potential</Editorial>.
          </h2>
          <div aria-hidden className={`h-px w-full ${hairline}`} />
          <p className="mx-auto mt-8 inline-flex rounded-full border border-[rgba(247,243,245,0.45)] bg-[rgba(51,17,16,0.45)] px-6 py-2.5 font-sans text-[16px] font-medium tracking-[0.06em] text-[#F2C6C3] min-[1200px]:mt-10">
            Licensed providers. Real medicine.
          </p>
        </div>
      </section>

      <section className="py-12 min-[1200px]:pt-12 min-[1200px]:pb-12" style={{ backgroundImage: warmPanel }}>
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-8 px-6 min-[1000px]:flex-row min-[1000px]:items-start min-[1000px]:gap-16 min-[1000px]:px-10 min-[1200px]:gap-20 min-[1200px]:px-4">
          <div className="relative h-[433px] w-full max-w-[322px] overflow-hidden rounded-[28px] min-[1000px]:h-[635px] min-[1000px]:max-w-none min-[1000px]:w-[467px] min-[1000px]:shrink-0 min-[1000px]:rounded-[16px]">
            <Image
              src={careImage}
              alt="Physician in a white coat pointing to lab results on a tablet while speaking with a patient."
              fill
              className="object-cover object-[62%_54%]"
              sizes="(min-width: 1200px) 467px, 90vw"
            />
          </div>
          <div className="relative w-full min-[1000px]:max-w-[523px] min-[1000px]:pt-0">
            <VerticalDivider className="top-0 bottom-0 -left-8 min-[1200px]:-left-10" />
            <p className="font-sans text-[17px] font-bold tracking-[0.12em] uppercase">Personalized Care</p>
            <h2 className="mt-3 max-w-[523px] font-sans text-[40px] font-medium leading-[1.05] min-[1200px]:text-[64px] min-[1200px]:leading-[67px]">
              Care That <Editorial>Works</Editorial>, Because It&rsquo;s Built for <Editorial>You</Editorial>
            </h2>
            <ul className="mt-8 space-y-2.5">
              {carePoints.map((point) => (
                <li key={point.title} className="flex items-start gap-2.5">
                  <Image src={assets.check} alt="" width={30} height={30} className="mt-0.5 h-[30px] w-[30px] shrink-0" />
                  <div>
                    <p className="font-sans text-[16px] leading-[1.2] font-bold text-[#321110]">{point.title}</p>
                    <p className="font-sans text-[16px] leading-[1.2] font-normal text-[#321110]">{point.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F3F5] px-6 pt-16 pb-16 min-[1000px]:px-10 min-[1200px]:px-16 min-[1200px]:pt-24 min-[1200px]:pb-20">
        <h2
          className="mx-auto max-w-[1072px] text-center font-sans text-[40px] font-medium leading-[1.05] min-[1200px]:text-[72px] min-[1200px]:leading-[76px]"
          style={{ letterSpacing: "-0.032em" }}
        >
          Guided by Experts, Driven by{" "}
          <Editorial className="text-[#E33D4D]" style={{ letterSpacing: "-0.032em" }}>
            Innovation
          </Editorial>
        </h2>
        <div className="mx-auto mt-8 grid max-w-[1072px] grid-cols-1 gap-4 min-[1000px]:grid-cols-3 min-[1200px]:mt-12">
          {leaders.map((leader) => (
            <article
              key={leader.name}
              className="relative h-[425px] w-full overflow-hidden rounded-[16px] shadow-[0_12px_28px_rgba(51,17,16,0)] transition-[translate,scale,box-shadow] duration-[450ms] ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_12px_28px_rgba(51,17,16,0.14)]"
            >
              <Image
                src={leader.image}
                alt={leader.alt}
                fill
                className="object-cover object-top"
                sizes="(min-width: 1200px) 347px, 90vw"
              />
              <div
                className="absolute inset-x-0 bottom-0 flex h-[79px] flex-col justify-center px-5"
                style={{
                  backgroundColor: "rgba(247, 243, 245, 0.68)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                }}
              >
                <p className="font-sans text-[17px] leading-[1.3] font-semibold">{leader.name}</p>
                <p className="mt-1 font-sans text-[12px] leading-[1.4] font-semibold tracking-[0.1em] uppercase">
                  {leader.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
