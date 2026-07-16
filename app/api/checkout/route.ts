import { checkout } from "@/lib/commerce/checkout";
import { commerceErrorResponse } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJsonBody(request);
    return Response.json({ data: await checkout(request.headers, body) }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
