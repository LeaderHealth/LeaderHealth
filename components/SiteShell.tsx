import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartProvider } from "./cart/CartProvider";
import { SideCart } from "./cart/SideCart";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <SideCart />
    </CartProvider>
  );
}
