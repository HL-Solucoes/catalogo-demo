import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductByIdControl,
  getActiveProducts,
} from "@/shared/constants/products";
import { ProductDetailClient } from "./product-detail-client";

interface Props {
  params: Promise<{ idControl: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idControl } = await params;
  const decoded = decodeURIComponent(idControl);
  const product = getProductByIdControl(decoded);

  if (!product) {
    return { title: "Produto não encontrado" };
  }

  return {
    title: product.title,
    description:
      product.description ??
      `${product.title} - Moda country no atacado. No Limite do Laço.`,
  };
}

export async function generateStaticParams() {
  const products = getActiveProducts();
  return products.map((p) => ({
    idControl: encodeURIComponent(p.idControl),
  }));
}

export default async function ProductDetailPage({ params }: Props) {
  const { idControl } = await params;
  const decoded = decodeURIComponent(idControl);
  const product = getProductByIdControl(decoded);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
