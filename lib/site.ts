import { resolveSiteUrl } from "@/lib/site-url";

export const siteConfig = {
  name: "ArtEffect",
  url: resolveSiteUrl(),
  description:
    "Limited art objects that connect collectable design, working artists, and measurable NGO impact.",
  socialImage:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85",
  nav: [
    { label: "Products", href: "#products" },
    { label: "Drop", href: "#drop" },
    { label: "Design", href: "#design" },
    { label: "Artist", href: "#artist" },
    { label: "Cause", href: "#cause" },
    { label: "Impact", href: "#impact" }
  ],
  utilityNav: [
    { label: "About", href: "/about" },
    { label: "Journal", href: "/journal" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" }
  ]
} as const;
