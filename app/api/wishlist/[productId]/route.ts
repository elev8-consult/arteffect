import { DELETE as deleteWishlistProduct } from "@/app/api/wishlist/route";

export async function DELETE(request: Request, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params;
  const url = new URL(request.url);
  url.searchParams.set("productId", productId);

  return deleteWishlistProduct(new Request(url, request));
}
