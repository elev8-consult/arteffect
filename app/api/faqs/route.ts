import { FAQInputError, getFAQs } from "@/lib/cms/faqs";
import { publicCacheHeaders } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return Response.json(
      {
        data: await getFAQs({
          audience: params.get("audience") ?? undefined,
          category: params.get("category") ?? undefined,
          query: params.get("q") ?? undefined
        })
      },
      { headers: publicCacheHeaders() }
    );
  } catch (error) {
    if (error instanceof FAQInputError) {
      return Response.json({ error: { code: "INVALID_FAQ_QUERY", message: error.message } }, { status: 400 });
    }
    console.error("FAQ read failed.", error);
    return Response.json({ error: { code: "FAQ_UNAVAILABLE", message: "The FAQs could not be loaded." } }, { status: 500 });
  }
}
