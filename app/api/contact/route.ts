import { ContactInputError, ContactUnavailableError, getContactContent, submitContact } from "@/lib/cms/contact";
import { CommerceError, commerceErrorResponse } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders, publicCacheHeaders, readJsonBody } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ data: await getContactContent() }, { headers: publicCacheHeaders() });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJsonBody(request);
    return Response.json({ data: await submitContact(request.headers, body) }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    if (error instanceof ContactInputError || error instanceof SyntaxError) {
      return Response.json(
        { error: { code: "INVALID_CONTACT_SUBMISSION", message: error.message } },
        { status: 400, headers: noStoreHeaders() }
      );
    }
    if (error instanceof ContactUnavailableError) {
      return Response.json(
        { error: { code: "CONTACT_UNAVAILABLE", message: error.message } },
        { status: 503, headers: noStoreHeaders() }
      );
    }
    if (error instanceof CommerceError) {
      return commerceErrorResponse(error);
    }
    console.error("Contact submission failed.", error);
    return Response.json(
      { error: { code: "CONTACT_SUBMISSION_FAILED", message: "Your message could not be submitted." } },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}
