import { getJournalPage, JournalInputError } from "@/lib/cms/journal";
import { publicCacheHeaders } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const featured = params.get("featured");
    if (featured && featured !== "true" && featured !== "false") throw new JournalInputError("featured is invalid.");
    const data = await getJournalPage({
      category: params.get("category") ?? undefined,
      featured: featured === "true",
      limit: numberParam(params.get("limit")),
      page: numberParam(params.get("page")),
      query: params.get("q") ?? undefined,
      tag: params.get("tag") ?? undefined
    });
    return Response.json({ data }, { headers: publicCacheHeaders() });
  } catch (error) {
    if (error instanceof JournalInputError) {
      return Response.json({ error: { code: "INVALID_JOURNAL_QUERY", message: error.message } }, { status: 400 });
    }
    console.error("Journal list failed.", error);
    return Response.json({ error: { code: "JOURNAL_UNAVAILABLE", message: "The journal could not be loaded." } }, { status: 500 });
  }
}

function numberParam(value: string | null) {
  return value === null ? undefined : Number(value);
}
