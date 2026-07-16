import { getShopProducts } from "@/lib/cms/products";
import { publicCacheHeaders } from "@/lib/commerce/http";
import {
  PRODUCT_AVAILABILITY,
  PRODUCT_COLORS,
  PRODUCT_SIZES,
  PRODUCT_SORTS,
  ProductQueryError,
  parseProductQuery
} from "@/lib/shop/query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = parseProductQuery(new URL(request.url).searchParams);
    const result = await getShopProducts(query);

    return Response.json(
      {
        data: result.docs,
        filters: {
          availability: PRODUCT_AVAILABILITY,
          colors: PRODUCT_COLORS,
          sizes: PRODUCT_SIZES
        },
        meta: {
          ...result.pagination,
          sort: query.sort,
          sorts: PRODUCT_SORTS
        }
      },
      { headers: publicCacheHeaders() }
    );
  } catch (error) {
    if (error instanceof ProductQueryError) {
      return Response.json(
        { error: { code: "INVALID_QUERY", details: error.issues, message: error.message } },
        { status: 400 }
      );
    }

    console.error("Product list read failed.", error);
    return Response.json(
      { error: { code: "PRODUCT_READ_FAILED", message: "Products could not be loaded." } },
      { status: 500 }
    );
  }
}
