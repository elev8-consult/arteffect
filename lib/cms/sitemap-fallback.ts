/**
 * Sitemap generation runs during `next build`, before Railway starts the app
 * and applies Payload migrations. Keep a failed CMS lookup from taking down the
 * whole build while still allowing the remaining sitemap sections to resolve.
 */
export async function loadSitemapEntries<T>(
  section: string,
  load: () => Promise<T[]>
): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    console.error(`Payload ${section} sitemap read failed; omitting dynamic entries.`, error);
    return [];
  }
}
