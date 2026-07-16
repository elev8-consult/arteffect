import { getShowcaseContent } from "@/lib/cms/showcase";
import { publicCacheHeaders } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = await getShowcaseContent();

  return Response.json({ data: content }, { headers: publicCacheHeaders() });
}
