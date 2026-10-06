export function HeroTitleFade() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-[190%] w-[168%] -translate-x-1/2 -translate-y-1/2 sm:h-[175%] sm:w-[155%] md:h-[158%] md:w-[140%]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at center, rgba(51, 17, 16, 0.78) 0%, rgba(51, 17, 16, 0.64) 36%, rgba(51, 17, 16, 0.3) 62%, rgba(51, 17, 16, 0) 88%)",
        filter: "blur(12px)",
      }}
    />
  );
}
