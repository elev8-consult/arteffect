import {
  NewsletterInputError,
  NewsletterUnavailableError,
  subscribeToNewsletter
} from "@/lib/cms/newsletter";
import { commerceErrorResponse } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const data = await subscribeToNewsletter(request.headers, await readJsonBody(request));
    return Response.json({ data }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    if (error instanceof NewsletterInputError || error instanceof SyntaxError) {
      return Response.json(
        { error: { code: "INVALID_NEWSLETTER_SIGNUP", message: error.message } },
        { status: 400, headers: noStoreHeaders() }
      );
    }
    if (error instanceof NewsletterUnavailableError) {
      return Response.json(
        { error: { code: "NEWSLETTER_UNAVAILABLE", message: error.message } },
        { status: 503, headers: noStoreHeaders() }
      );
    }
    return commerceErrorResponse(error);
  }
}
