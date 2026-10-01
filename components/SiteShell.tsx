import { Header } from "./Header";
import { Footer } from "./Footer";
import { PageFade } from "./PageFade";
import { CartProvider } from "./cart/CartProvider";
import { SideCart } from "./cart/SideCart";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main className="flex-1">
        <PageFade>{children}</PageFade>
      </main>
      <Footer />
      <SideCart />
    </CartProvider>
  );
}
