import type { Metadata } from "next";
import { SuccessView } from "./SuccessView";

export const metadata: Metadata = { title: "Request received" };

export default function CheckoutSuccessPage() {
  return <SuccessView />;
}
