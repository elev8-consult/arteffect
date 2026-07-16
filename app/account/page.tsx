import type { Metadata } from "next";

import { AccountExperience } from "@/components/account/account-experience";

export const metadata: Metadata = { title: "Your account", description: "Review your ArtEffect profile, saved addresses, wishlist, and edition history.", robots: { index: false, follow: false } };

export default function AccountPage() {
  return <main id="main-content" className="min-h-[75vh] bg-[var(--ae-parchment)] pt-16"><header className="border-b border-white/10 bg-[var(--ae-forest)] py-16 text-white"><div className="ae-container"><p className="ae-kicker">Private collection</p><h1 className="ae-display mt-4 text-[clamp(4rem,10vw,7.5rem)] font-light leading-[.8] tracking-[-.04em]">Your ArtEffect.</h1></div></header><AccountExperience /></main>;
}
