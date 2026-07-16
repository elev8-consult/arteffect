import { createCart } from "@/lib/commerce/cart";
import { commerceErrorResponse } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders } from "@/lib/commerce/http";
import { cartCookie } from "@/lib/commerce/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { cart, token } = await createCart(request.headers);
    return Response.json(
      { data: cart },
      {
        status: 201,
        headers: {
          ...noStoreHeaders(),
          "Set-Cookie": cartCookie(cart.id as number | string, token)
        }
      }
    );
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
