import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/cart-context";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageTransition } from "@/components/motion/page-transition";
import { siteConfig } from "@/lib/site";

import "./globals.css";

export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.socialImage,
        width: 1200,
        height: 630,
        alt: "ArtEffect limited edition art object"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.socialImage,
        alt: "ArtEffect limited edition art object"
      }
    ]
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  themeColor: "#192B1E",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        image: siteConfig.socialImage
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        publisher: { "@id": `${siteConfig.url}/#organization` },
        url: siteConfig.url,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/journal?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <CartProvider>
          <a
            href="#main-content"
            className="focus-ring fixed left-4 top-4 z-[60] -translate-y-20 bg-[var(--ae-forest)] px-4 py-2 text-sm font-semibold text-[var(--ae-white)] transition focus-visible:translate-y-0"
          >
            Skip to content
          </a>
          <SiteHeader />
          <PageTransition>{children}</PageTransition>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
