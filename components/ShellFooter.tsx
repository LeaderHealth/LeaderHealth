"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function ShellFooter() {
  const pathname = usePathname();
  if (pathname === "/checkout") return null;
  return <Footer />;
}
