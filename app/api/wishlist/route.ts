import {
  WishlistAuthenticationError,
  WishlistInputError,
  WishlistUnavailableError,
  addWishlistProduct,
  getWishlist,
  removeWishlistProduct
} from "@/lib/cms/wishlist";
import { CommerceError } from "@/lib/commerce/errors";
import { assertSameOrigin, noStoreHeaders, readJsonBody } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return Response.json({ data: await getWishlist(request.headers) }, { headers: noStoreHeaders() });
  } catch (error) {
    return wishlistError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await readJsonBody(request);
    return Response.json(
      { data: await addWishlistProduct(request.headers, body.productId) },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return wishlistError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const url = new URL(request.url);
    const body = request.headers.get("content-type")?.includes("application/json")
      ? await request.json()
      : undefined;
    const productId = body?.productId ?? url.searchParams.get("productId");
    return Response.json(
      { data: await removeWishlistProduct(request.headers, productId) },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    return wishlistError(error);
  }
}

function wishlistError(error: unknown) {
  if (error instanceof CommerceError) {
    const retryAfter =
      error.status === 429 && error.details && typeof error.details === "object" &&
      "retryAfter" in error.details && typeof error.details.retryAfter === "number"
        ? String(error.details.retryAfter)
        : undefined;
    return Response.json(
      { error: { code: error.code, message: error.message } },
      {
        status: error.status,
        headers: {
          ...noStoreHeaders(),
          ...(retryAfter ? { "Retry-After": retryAfter } : {})
        }
      }
    );
  }
  if (error instanceof WishlistAuthenticationError) {
    return Response.json(
      { error: { code: "AUTHENTICATION_REQUIRED", message: error.message } },
      { status: 401 }
    );
  }
  if (error instanceof WishlistInputError || error instanceof SyntaxError) {
    return Response.json(
      { error: { code: "INVALID_WISHLIST_REQUEST", message: error instanceof Error ? error.message : "Invalid request." } },
      { status: 400 }
    );
  }
  if (error instanceof WishlistUnavailableError) {
    return Response.json(
      { error: { code: "WISHLIST_UNAVAILABLE", message: error.message } },
      { status: 503 }
    );
  }

  console.error("Wishlist operation failed.", error);
  return Response.json(
    { error: { code: "WISHLIST_FAILED", message: "The wishlist could not be updated." } },
    { status: 500 }
  );
}
