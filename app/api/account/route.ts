import { getAccount, updateAccount } from "@/lib/cms/account";
import { commerceErrorResponse } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return Response.json({ data: await getAccount(request.headers) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    return Response.json({ data: await updateAccount(request.headers, await readJsonBody(request)) }, { headers: noStoreHeaders() });
  } catch (error) {
    return commerceErrorResponse(error);
  }
}
