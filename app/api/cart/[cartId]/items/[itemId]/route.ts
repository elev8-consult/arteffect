import { removeCartItem, updateCartItem } from "@/lib/commerce/cart";
import { commerceErrorResponse } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ cartId: string; itemId: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const [{ cartId, itemId }, body] = await Promise.all([context.params, readJsonBody(request)]);
    return Response.json({ data: await updateCartItem(request.headers, cartId, itemId, body) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { cartId, itemId } = await context.params;
    return Response.json({ data: await removeCartItem(request.headers, cartId, itemId) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
