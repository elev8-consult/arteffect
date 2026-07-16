import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/account", "/checkout"]
      }
    ],
    host: siteConfig.url,
    sitemap: `${siteConfig.url}/sitemap.xml`
  };
}
