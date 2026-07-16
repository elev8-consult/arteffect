import { estimateCartShipping } from "@/lib/commerce/cart";
import { commerceErrorResponse } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ cartId: string }> }) {
  try {
    assertSameOrigin(request);
    const [{ cartId }, body] = await Promise.all([context.params, readJsonBody(request)]);
    return Response.json({ data: await estimateCartShipping(request.headers, cartId, body) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
