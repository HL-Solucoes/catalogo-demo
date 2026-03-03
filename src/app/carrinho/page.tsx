import type { Metadata } from "next";
import { CartPageClient } from "./cart-page-client";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Revise seus itens e finalize seu pedido via WhatsApp.",
};

export default function CarrinhoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        Carrinho
      </h1>
      <CartPageClient />
    </div>
  );
}
