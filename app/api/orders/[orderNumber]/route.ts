import { commerceErrorResponse } from "@/lib/commerce/errors";
import { noStoreHeaders } from "@/lib/commerce/http";
import { getOrder } from "@/lib/commerce/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await context.params;
    return Response.json({ data: await getOrder(request.headers, orderNumber) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
