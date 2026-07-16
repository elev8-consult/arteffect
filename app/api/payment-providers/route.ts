import { noStoreHeaders } from "@/lib/commerce/http";
import { listPaymentProviders } from "@/lib/commerce/payments/registry";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ data: listPaymentProviders() }, { headers: noStoreHeaders() });
}
