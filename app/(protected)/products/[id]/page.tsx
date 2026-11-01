import { notFound } from "next/navigation";
import { loadProduct } from "../../actions";
import { ProductDetails } from "./product-details";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();
  return <ProductDetails initialProduct={product} />;
}
