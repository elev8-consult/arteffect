import { getAboutContent } from "@/lib/cms/about";
import { publicCacheHeaders } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ data: await getAboutContent() }, { headers: publicCacheHeaders() });
}
