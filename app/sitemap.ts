import type { MetadataRoute } from "next";

import { getPublishedDropSlugs } from "@/lib/cms/drops";
import { getPublishedArtistSlugs } from "@/lib/cms/artists";
import { getPublishedCauseSlugs } from "@/lib/cms/causes";
import { getShopProducts } from "@/lib/cms/products";
import { getPublishedJournalSlugs } from "@/lib/cms/journal";
import { loadSitemapEntries } from "@/lib/cms/sitemap-fallback";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, drops, artists, causes, journal] = await Promise.all([
    loadSitemapEntries("products", getAllPublishedProducts),
    loadSitemapEntries("drops", getPublishedDropSlugs),
    loadSitemapEntries("artists", getPublishedArtistSlugs),
    loadSitemapEntries("causes", getPublishedCauseSlugs),
    loadSitemapEntries("journal", getPublishedJournalSlugs)
  ]);

  return [
    {
      url: siteConfig.url,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteConfig.url}/shop`,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${siteConfig.url}/artists`,
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${siteConfig.url}/causes`,
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${siteConfig.url}/impact`,
      changeFrequency: "weekly",
      priority: 0.8
    },
    ...["about", "journal", "contact", "faq"].map((path) => ({
      url: `${siteConfig.url}/${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "journal" ? 0.8 : 0.6
    })),
    ...artists.map((slug) => ({
      url: `${siteConfig.url}/artists/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...causes.map((slug) => ({
      url: `${siteConfig.url}/causes/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...drops.map((slug) => ({
      url: `${siteConfig.url}/drops/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8
    })),
    ...journal.map((article) => ({
      url: `${siteConfig.url}/journal/${article.slug}`,
      ...(article.updatedAt && Number.isFinite(Date.parse(article.updatedAt))
        ? { lastModified: new Date(article.updatedAt) }
        : {}),
      changeFrequency: "monthly" as const,
      priority: 0.7
    })),
    ...products.map((product) => ({
      url: `${siteConfig.url}/shop/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];
}

async function getAllPublishedProducts() {
  const query = { availability: [], colors: [], limit: 100, sizes: [], sort: "featured" as const };
  const firstPage = await getShopProducts({ ...query, page: 1 });
  if (firstPage.pagination.totalPages <= 1) return firstPage.docs;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) =>
      getShopProducts({ ...query, page: index + 2 })
    )
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.docs);
}
