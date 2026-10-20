const bundledLabs: Record<string, { title: string; body: string }> = {
  "women-hormone-therapy": {
    title: "Complete Lab or Advanced Lab",
    body: "Included with Testosterone Treatments",
  },
  "men-trt-testosterone-cypionate": {
    title: "Complete Lab Panel",
    body: "Included with your treatment",
  },
  "men-trt-testosterone-cream": {
    title: "Complete Lab Panel",
    body: "Included with your treatment",
  },
  "men-trt-enclomiphene": {
    title: "Choose Advanced or Complete Panel",
    body: "Included with your treatment",
  },
  "women-hormone-therapy-estradiol-pill": {
    title: "Choose Advanced Or Complete Panel",
    body: "Included with your treatment",
  },
  "women-hrt-testosterone-cream": {
    title: "Complete Lab Panel",
    body: "Included with your treatment",
  },
  "women-hrt-testosterone-injection-low-dose": {
    title: "Complete Lab Panel",
    body: "Included with your treatment",
  },
};

const labelClass =
  "shrink-0 rounded-full bg-[#F2C6C3] px-3 py-1 font-sans text-[12px] font-medium text-[#331110]";

export function BundledLabPanel({ slug }: { slug: string }) {
  const lab = bundledLabs[slug];
  if (!lab) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-[16px] border border-white/35 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <p className="font-sans text-[15px] font-semibold leading-tight">{lab.title}</p>
          <p className="mt-0.5 font-sans text-[13px] leading-snug text-white/80">{lab.body}</p>
        </div>
        <span className={labelClass}>Included</span>
      </div>
      <div className="mx-4 border-t border-dotted border-white/40" />
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <p className="font-sans text-[15px] font-semibold leading-tight">Provider consultation</p>
          <p className="mt-0.5 font-sans text-[13px] leading-snug text-white/80">
            No charge, before anything is prescribed
          </p>
        </div>
        <span className={labelClass}>Free</span>
      </div>
    </div>
  );
}
