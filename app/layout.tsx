import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Instrument_Sans, Instrument_Serif, Lexend } from "next/font/google";
import { Analytics } from "@/components/analytics/Analytics";
import { SiteShell } from "@/components/SiteShell";
import { site } from "@/lib/content/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const lexend = Lexend({
  variable: "--font-readable",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  icons: {
    icon: [
      {
        url: "/favicons/dark.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicons/light.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/favicons/apple-dark.png",
        sizes: "180x180",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicons/apple-light.png",
        sizes: "180x180",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${instrumentSans.variable} ${instrumentSerif.variable} ${lexend.variable} h-full antialiased`}
    >
      <body id="top" className="flex min-h-full flex-col bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var p=JSON.parse(localStorage.getItem("lh-a11y")||"null");if(p&&typeof p==="object"){var d=document.documentElement;var text=p.text===true?1:p.text;if(text===1||text===2||text===3)d.dataset.a11yText=String(text);var contrast=p.contrast===true?"light":p.contrast;if(contrast==="light"||contrast==="dark"||contrast==="invert")d.dataset.a11yContrast=contrast;if(p.cursor)d.dataset.a11yCursor="large";if(p.leading)d.dataset.a11yLeading="loose";if(p.spacing)d.dataset.a11ySpacing="wide";if(p.font)d.dataset.a11yFont="readable";if(p.links)d.dataset.a11yLinks="on";if(p.motion)d.dataset.a11yMotion="reduce";if(p.images)d.dataset.a11yImages="hide";if(p.align==="left"||p.align==="center"||p.align==="right")d.dataset.a11yAlign=p.align;if(p.saturation==="low"||p.saturation==="high"||p.saturation==="mono")d.dataset.a11ySaturation=p.saturation;var parts=[];if(contrast==="invert")parts.push("invert(1)","hue-rotate(180deg)");if(p.saturation==="low")parts.push("saturate(0.35)");if(p.saturation==="high")parts.push("saturate(1.8)");if(p.saturation==="mono")parts.push("grayscale(1)");if(parts.length){d.dataset.a11yFilter="on";d.style.setProperty("--a11y-filters",parts.join(" "));}}}catch(e){}',
          }}
        />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
