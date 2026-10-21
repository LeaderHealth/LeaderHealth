import { Suspense } from "react";
import { Header } from "./Header";
import { ShellFooter } from "./ShellFooter";
import { PageFade } from "./PageFade";
import { MotionPreferences } from "./MotionPreferences";
import { CartProvider } from "./cart/CartProvider";
import { SideCart } from "./cart/SideCart";
import { AffiliateCapture } from "./affiliate/AffiliateCapture";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionPreferences>
    <CartProvider>
      <Suspense fallback={null}>
        <AffiliateCapture />
      </Suspense>
      <Header />
      <main className="flex-1">
        <PageFade>{children}</PageFade>
      </main>
      <ShellFooter />
      <SideCart />
    </CartProvider>
    </MotionPreferences>
  );
}
