import { commerceErrorResponse } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders } from "@/lib/commerce/http";
import { cancelOrder } from "@/lib/commerce/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ orderNumber: string }> }) {
  try {
    assertSameOrigin(request);
    const { orderNumber } = await context.params;
    return Response.json({ data: await cancelOrder(request.headers, orderNumber) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
