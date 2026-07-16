import { getJournalArticle, JournalNotFoundError } from "@/lib/cms/journal";
import { publicCacheHeaders } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    return Response.json({ data: await getJournalArticle(slug) }, { headers: publicCacheHeaders() });
  } catch (error) {
    if (error instanceof JournalNotFoundError) {
      return Response.json({ error: { code: "JOURNAL_ARTICLE_NOT_FOUND", message: "The journal article was not found." } }, { status: 404 });
    }
    console.error("Journal article read failed.", error);
    return Response.json({ error: { code: "JOURNAL_UNAVAILABLE", message: "The journal article could not be loaded." } }, { status: 500 });
  }
}
