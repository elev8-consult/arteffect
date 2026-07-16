import type { Metadata } from "next";

import { CheckoutExperience } from "@/components/cart/checkout-experience";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm delivery details and reserve your ArtEffect editions.",
  robots: { index: false, follow: false }
};

export default function CheckoutPage() {
  return <CheckoutExperience />;
}
