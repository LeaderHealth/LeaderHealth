import { HeroVideo } from "@/components/HeroVideo";
import { GET_STARTED_URL } from "@/lib/content/site";

export function CompleteLabStart() {
  return (
    <section className="bg-[#F7F3F5] px-4 pb-16 pt-2 md:px-8 md:pb-20 md:pt-4 lg:px-10 lg:pb-24">
      <div className="relative mx-auto w-full max-w-[1180px] overflow-hidden rounded-[24px] min-[1200px]:rounded-[28px]">
        <div className="absolute inset-0">
          <HeroVideo src="/videos/lab-start.mp4" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" aria-hidden />
        <div className="relative flex min-h-[640px] flex-col justify-end px-6 pb-10 min-[810px]:min-h-[440px] min-[810px]:flex-row min-[810px]:items-end min-[810px]:justify-between min-[810px]:gap-10 min-[810px]:px-10 min-[810px]:pb-12 min-[1200px]:min-h-[520px] min-[1200px]:px-14 min-[1200px]:pb-14">
          <div className="max-w-[640px]">
            <h2 className="font-sans text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-white min-[810px]:text-[44px] min-[1200px]:text-[56px]">
              Not sure where to start?
            </h2>
            <p className="mt-3 font-sans text-[15px] leading-snug text-white min-[810px]:max-w-[34rem] min-[810px]:text-[16px]">
              <span className="min-[810px]:hidden">
                We recommend getting lab-tested first to give you access to a health coach and clinician that will help
                guide your personal health.
              </span>
              <span className="hidden min-[810px]:inline">
                Tell us a little about your health and goals, and we&apos;ll help guide you toward the right next steps.
              </span>
            </p>
          </div>
          <a
            href={GET_STARTED_URL}
            className="mt-8 inline-flex h-11 items-center justify-center self-center rounded-full bg-[#2C1412] px-6 font-sans text-[15px] font-medium text-white transition-colors hover:bg-[#451816] min-[810px]:mb-1 min-[810px]:mt-0 min-[810px]:self-auto"
          >
            Get Started
          </a>
        </div>
      </div>
    </section>
  );
}
