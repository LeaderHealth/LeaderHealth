import { Header } from "./Header";
import { ShellFooter } from "./ShellFooter";
import { PageFade } from "./PageFade";
import { MotionPreferences } from "./MotionPreferences";
import { CartProvider } from "./cart/CartProvider";
import { SideCart } from "./cart/SideCart";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionPreferences>
    <CartProvider>
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
