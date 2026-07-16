import { applyCartCoupon, removeCartCoupon } from "@/lib/commerce/cart";
import { commerceErrorResponse } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ cartId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const [{ cartId }, body] = await Promise.all([context.params, readJsonBody(request)]);
    return Response.json({ data: await applyCartCoupon(request.headers, cartId, body.code) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { cartId } = await context.params;
    return Response.json({ data: await removeCartCoupon(request.headers, cartId) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
