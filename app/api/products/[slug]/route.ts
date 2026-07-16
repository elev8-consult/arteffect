import { ProductNotFoundError, getShopProduct } from "@/lib/cms/products";
import { publicCacheHeaders } from "@/lib/commerce/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    return Response.json(
      { error: { code: "INVALID_PRODUCT_SLUG", message: "The product slug is invalid." } },
      { status: 400 }
    );
  }

  try {
    return Response.json({ data: await getShopProduct(slug) }, { headers: publicCacheHeaders() });
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return Response.json(
        { error: { code: "PRODUCT_NOT_FOUND", message: "Product not found." } },
        { status: 404 }
      );
    }

    console.error("Product detail read failed.", error);
    return Response.json(
      { error: { code: "PRODUCT_READ_FAILED", message: "The product could not be loaded." } },
      { status: 500 }
    );
  }
}
