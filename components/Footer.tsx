import Image from "next/image";
import Link from "next/link";
import { assets, PORTAL_URL, site } from "@/lib/content/site";

const treatments = [
  { href: "/shop-all-products", label: "Hormone Therapy" },
  { href: "/shop-men-products", label: "Men" },
  { href: "/products/men-trt-testosterone-cypionate", label: "Testosterone Therapy" },
  { href: "/products/men-trt-enclomiphene", label: "Enclomiphene" },
  { href: "/shop-men-products", label: "Anastrozole" },
  { href: "/shop-women-products", label: "Women" },
  { href: "/shop-all-products", label: "Sexual Health" },
  { href: "/products/sildenafil-combo-troche-(sildenafil-oxytocin-b12)", label: "Sildenafil" },
  { href: "/products/men-sexual-health-tadalafil", label: "Tadalafil" },
  { href: "/products/oxytocin-nasal-spray", label: "Oxytocin" },
  { href: "/products/weight-loss-semaglutide", label: "Weight Loss" },
  { href: "/products/weight-loss-semaglutide", label: "GLP-1 Therapy" },
  { href: "/products/weight-loss-tirzepatide", label: "Metabolic Support" },
  { href: "/energy-longevity", label: "Longevity" },
  { href: "/products/nad-injectable", label: "NAD+" },
  { href: "/products/longevity-glutathione", label: "Glutathione" },
  { href: "/energy-longevity", label: "Methylcobalamin B12" },
];

const labLinks = [
  { href: "/labs/labs-complete-panel", label: "Baseline Hormone Panel" },
  { href: "/labs/labs-advance-panel", label: "Comprehensive Metabolic" },
  { href: "/labs/labs-complete-panel", label: "Follow-up Panel" },
];

const whoLinks = [
  { href: "/aboutus", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/blogs", label: "Learn More" },
  { href: PORTAL_URL, label: "Patient portal", external: true },
];

const legalLinks = [
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/consumer-health-data-privacy", label: "Consumer Health Data Privacy" },
  { href: "/legal/do-not-sell", label: "Do Not Sell or Share My Info" },
  { href: "/legal/consent-notices", label: "Consent & Notices" },
  { href: "/legal/orders-billings", label: "Orders & Billings" },
];

export function Footer() {
  return (
    <footer id="footer" className="bg-[#1a0c0c] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <Image
          src={assets.logo}
          alt="LEADERHEALTH"
          width={420}
          height={40}
          className="mx-auto h-8 w-auto brightness-0 invert md:h-10"
        />
        <p className="mt-4 text-[11px] tracking-[0.28em] text-white/70">
          PHYSICIAN-LED CARE / FOR THE LONG RUN.
        </p>
        <p className="mt-2 text-sm text-white/55">
          Clinical updates and restock notices. Unsubscribe anytime.
        </p>
        <form
          className="mx-auto mt-6 flex max-w-md overflow-hidden rounded-full border border-white/15 bg-white/5"
          action={`mailto:${site.email}`}
          method="get"
        >
          <input
            type="email"
            name="body"
            required
            placeholder="Your Email Here"
            aria-label="Your Email Here"
            className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm outline-none placeholder:text-white/40"
          />
          <button
            type="submit"
            className="m-1 grid h-10 w-10 place-items-center rounded-full bg-accent"
            aria-label="Subscribe"
          >
            →
          </button>
        </form>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 text-sm md:grid-cols-4">
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-wider text-white/50">Treatments</p>
          <ul className="space-y-2 text-white/85">
            {treatments.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/energy-longevity" className="hover:text-white">
                Learn More About Energy & Longevity
              </Link>
            </li>
            <li>
              <Link href="/advanced-peptides" className="hover:text-white">
                Peptides
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-wider text-white/50">Labs</p>
          <ul className="space-y-2 text-white/85">
            {labLinks.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-wider text-white/50">Who We Are</p>
          <ul className="space-y-2 text-white/85">
            {whoLinks.map((l) => (
              <li key={l.label}>
                {l.external ? (
                  <a href={l.href} className="hover:text-white">
                    {l.label}
                  </a>
                ) : (
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-wider text-white/50">Legal</p>
          <ul className="space-y-2 text-white/85">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-3 px-6 pb-10 text-sm text-white/70">
        <p>
          Treatment plans are written by licensed U.S. clinicians after review of your intake and lab
          work. No plan is issued without a provider consultation.
        </p>
        <p>
          Address:{" "}
          <a href={site.addressHref} className="hover:text-white">
            321 S Persimmon, Tomball, TX 77375
          </a>
        </p>
        <p>
          <a href={`mailto:${site.email}`} className="hover:text-white">
            Help@myleaderhealth.com
          </a>
        </p>
        <p>Hours: Tue–Sat, 9am–5pm CT</p>
        <p>Sun–Mon, closed</p>
        <p>
          <a href={site.phoneHref} className="hover:text-white">
            {site.phone}
          </a>
        </p>
      </div>

      <div className="border-t border-white/10 px-6 py-8">
        <p className="mx-auto max-w-6xl text-[11px] leading-relaxed text-white/45">{site.legalNote}</p>
        <div className="mx-auto mt-6 flex max-w-6xl items-center justify-between text-sm text-white/70">
          <p>Leader Health © 2026 — All rights reserved</p>
          <a href="#top" className="hover:text-white">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
