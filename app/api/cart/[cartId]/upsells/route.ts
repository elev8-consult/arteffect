import { commerceErrorResponse } from "@/lib/commerce/errors";
import { noStoreHeaders } from "@/lib/commerce/http";
import { getCartUpsells } from "@/lib/commerce/upsells";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ cartId: string }> }) {
  try {
    const { cartId } = await context.params;
    return Response.json({ data: await getCartUpsells(request.headers, cartId) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
