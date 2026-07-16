import { getAccountOrders } from "@/lib/cms/account";
import { commerceErrorResponse } from "@/lib/commerce/errors";
import { noStoreHeaders } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const data = await getAccountOrders(request.headers, {
      limit: params.has("limit") ? Number(params.get("limit")) : undefined,
      page: params.has("page") ? Number(params.get("page")) : undefined
    });
    return Response.json({ data }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
