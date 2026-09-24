import Link from "next/link";

const parchment = [
  "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(219, 212, 189, 0.75) 0%, rgba(219, 212, 189, 0) 68%)",
  "radial-gradient(ellipse 92% 58% at 50% 76%, rgba(219, 212, 189, 0.4) 0%, rgba(219, 212, 189, 0) 72%)",
  "radial-gradient(ellipse 64% 50% at 0% 0%, rgba(219, 212, 189, 0.35) 0%, rgba(219, 212, 189, 0) 66%)",
].join(", ");

export default function NotFound() {
  return (
    <section
      className="flex min-h-dvh items-center justify-center bg-[#F7F3F5] px-6 pt-28 pb-20 sm:px-8"
      style={{ backgroundImage: parchment }}
    >
      <div className="flex w-full max-w-[520px] flex-col items-center text-center">
        <p className="font-sans text-[12px] font-medium tracking-[0.16em] text-[rgba(51,17,16,0.78)] uppercase">
          Error 404
        </p>
        <p className="mt-4 font-sans text-[clamp(5.75rem,17vw,12.5rem)] font-light leading-[0.92] tracking-[-0.035em] text-[#331110]">
          404
        </p>
        <h1
          className="mt-3 font-sans text-[clamp(1.75rem,3.2vw,2.25rem)] font-medium text-[#331110]"
          style={{ letterSpacing: "-0.01em" }}
        >
          Page not found.
        </h1>
        <p className="mt-3 max-w-[28rem] font-sans text-[16px] leading-[1.6] font-normal text-[rgba(51,17,16,0.78)]">
          Sorry, we can&apos;t find the page you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="group relative mt-8 inline-flex items-center rounded-full bg-[#E43D4E] px-[26px] py-[14px] font-sans text-[16px] font-semibold tracking-[-0.02em] text-[#F7F3F5] transition-[background-color,transform] duration-300 ease-out hover:-translate-y-px hover:bg-[#E44F5D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#331110]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 h-1 w-1 -translate-y-1/2 rounded-full bg-[#F7F3F5] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          />
          Back To Homepage
        </Link>
      </div>
    </section>
  );
}
