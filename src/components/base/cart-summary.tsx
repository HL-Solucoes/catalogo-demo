"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MessageCircle,
  Copy,
  Check,
  ClipboardList,
  Send,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  useCartStore,
  selectCartItems,
  selectCartTotal,
} from "@/shared/store/cart.store";
import { formatCurrency } from "@/shared/lib/format";
import {
  orderFormSchema,
  type OrderFormValues,
} from "@/shared/schemas/order.schema";
import { useCheckoutUseCase } from "@/modules/order/use-cases";

const WHATSAPP_NUMBER = "5500000000000"; // Mock number
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID || "";
const CATALOG_ID = process.env.NEXT_PUBLIC_CATALOG_ID || "";

function buildWhatsAppMessage(
  items: ReturnType<typeof selectCartItems>,
  total: number,
): string {
  let msg = "🤠 *Pedido - No Limite do Laço*\n\n";

  items.forEach((item, i) => {
    msg += `${i + 1}. ${item.title} (${item.idControl})\n`;
    msg += `   Qtd: ${item.qty}`;
    if (item.is_price_visible) {
      msg += ` | ${formatCurrency(item.price)} un.`;
    }
    msg += "\n";
  });

  msg += "\n";
  const visibleItems = items.filter((i) => i.is_price_visible);
  if (visibleItems.length > 0) {
    msg += `💰 *Subtotal visível: ${formatCurrency(total)}*\n`;
  }
  const hasHiddenPrice = items.some((i) => !i.is_price_visible);
  if (hasHiddenPrice) {
    msg += `⚠️ Alguns itens têm preço sob consulta.\n`;
  }
  msg += `\n📦 Total de itens: ${items.reduce((acc, i) => acc + i.qty, 0)}\n`;
  msg += `\nObrigado!`;

  return msg;
}

type ModalView = "choose" | "whatsapp" | "form" | "success";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

interface CheckoutResult {
  id: string;
  trackingCodeId: string;
}

export function CartSummary() {
  const items = useCartStore(selectCartItems);
  const total = useCartStore(selectCartTotal);
  const clear = useCartStore((s) => s.clear);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ModalView>("choose");
  const [copied, setCopied] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(
    null,
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { checkout, isCheckingOut } = useCheckoutUseCase();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(orderFormSchema as any),
    defaultValues: {
      name: "",
      phone: "",
      cpf: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      description: "",
    },
  });

  const message = buildWhatsAppMessage(items, total);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  const visibleTotal = items.filter((i) => i.is_price_visible);
  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenModal = () => {
    setView("choose");
    setCopied(false);
    setCheckoutError(null);
    setCheckoutResult(null);
    reset();
    setOpen(true);
  };

  const handleCloseModal = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setView("choose");
      setCheckoutError(null);
      reset();
    }
  };

  const doCheckout = async (
    source: "WHATSAPP" | "CATALOG",
    formData?: OrderFormValues,
  ) => {
    setCheckoutError(null);
    try {
      const address = formData
        ? [
            formData.street,
            formData.number,
            formData.complement,
            formData.neighborhood,
            formData.city,
            formData.state,
            formData.cep,
          ]
            .filter(Boolean)
            .join(", ")
        : undefined;

      const result = await checkout({
        companyId: COMPANY_ID,
        catalogId: CATALOG_ID,
        source,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.qty,
          unitPrice: item.is_price_visible ? String(item.price) : null,
        })),
        customerName: formData?.name || null,
        customerPhone: formData?.phone || null,
        customerAddress: address || null,
        description: formData?.description || null,
        total: total > 0 ? String(total) : null,
      });

      setCheckoutResult({
        id: result.id,
        trackingCodeId: result.trackingCodeId,
      });
      setView("success");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao finalizar pedido";
      setCheckoutError(errorMsg);
    }
  };

  const onSubmit = (data: OrderFormValues) => {
    doCheckout("CATALOG", data);
  };

  const handleSuccessClose = () => {
    clear();
    reset();
    setOpen(false);
    setView("choose");
    setCheckoutResult(null);
  };

  return (
    <>
      {/* Summary bar */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 text-base font-semibold">Resumo do pedido</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Itens</span>
            <span>{totalQty}</span>
          </div>
          {visibleTotal.length > 0 && (
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
          )}
          {items.some((i) => !i.is_price_visible) && (
            <p className="text-xs italic text-muted-foreground">
              * Alguns itens têm preço sob consulta
            </p>
          )}
        </div>

        <Separator className="my-3" />

        <Button
          className="w-full gap-2"
          size="lg"
          disabled={items.length === 0}
          onClick={handleOpenModal}
        >
          <Send className="size-4" />
          Finalizar pedido
        </Button>
      </div>

      {/* Finalize modal */}
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {/* ── Choose view ── */}
          {view === "choose" && (
            <>
              <DialogHeader>
                <DialogTitle>Como deseja finalizar?</DialogTitle>
                <DialogDescription>
                  Escolha a forma de envio do seu pedido
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 text-left whitespace-normal w-full"
                  onClick={() => setView("whatsapp")}
                >
                  <div className="flex w-full items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <MessageCircle className="size-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Via WhatsApp</p>
                      <p className="text-xs text-muted-foreground">
                        Envie a lista diretamente pelo WhatsApp
                      </p>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 text-left whitespace-normal w-full"
                  onClick={() => setView("form")}
                >
                  <div className="flex w-full items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <ClipboardList className="size-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Via Catálogo</p>
                      <p className="text-xs text-muted-foreground">
                        Preencha seus dados e envie o pedido por aqui
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
            </>
          )}

          {/* ── WhatsApp view ── */}
          {view === "whatsapp" && (
            <>
              <DialogHeader>
                <DialogTitle>Enviar via WhatsApp</DialogTitle>
                <DialogDescription>Revise e envie seu pedido</DialogDescription>
              </DialogHeader>

              <div className="max-h-52 overflow-y-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap font-mono">
                {message}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="size-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copiar mensagem
                    </>
                  )}
                </Button>

                <Button asChild className="gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4" />
                    Abrir WhatsApp
                  </a>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setView("choose")}
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar
                </Button>
              </div>
            </>
          )}

          {/* ── Form view ── */}
          {view === "form" && (
            <>
              <DialogHeader>
                <DialogTitle>Dados para o pedido</DialogTitle>
                <DialogDescription>
                  Preencha seus dados para finalizar
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {/* Name */}
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Nome completo <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <Input
                        placeholder="Seu nome completo"
                        maxLength={100}
                        {...field}
                      />
                    )}
                  />
                  {errors.name && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Phone + CPF */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Telefone <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="(00) 00000-0000"
                          inputMode="numeric"
                          onChange={(e) =>
                            field.onChange(formatPhone(e.target.value))
                          }
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      CPF <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="cpf"
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          onChange={(e) =>
                            field.onChange(formatCPF(e.target.value))
                          }
                        />
                      )}
                    />
                    {errors.cpf && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {errors.cpf.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Address */}
                <p className="text-xs font-medium text-muted-foreground">
                  Endereço
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="mb-1 block text-xs font-medium">
                      CEP <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="cep"
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="00000-000"
                          inputMode="numeric"
                          onChange={(e) =>
                            field.onChange(formatCEP(e.target.value))
                          }
                        />
                      )}
                    />
                    {errors.cep && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {errors.cep.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      Rua <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="street"
                      render={({ field }) => (
                        <Input
                          placeholder="Rua, Avenida..."
                          maxLength={120}
                          {...field}
                        />
                      )}
                    />
                    {errors.street && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {errors.street.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Nº <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="number"
                      render={({ field }) => (
                        <Input placeholder="Nº" maxLength={10} {...field} />
                      )}
                    />
                    {errors.number && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {errors.number.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      Complemento
                    </label>
                    <Controller
                      control={control}
                      name="complement"
                      render={({ field }) => (
                        <Input
                          placeholder="Apto, Bloco..."
                          maxLength={60}
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Bairro <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="neighborhood"
                      render={({ field }) => (
                        <Input placeholder="Bairro" maxLength={60} {...field} />
                      )}
                    />
                    {errors.neighborhood && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {errors.neighborhood.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Cidade <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="city"
                      render={({ field }) => (
                        <Input placeholder="Cidade" maxLength={60} {...field} />
                      )}
                    />
                    {errors.city && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      UF <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="state"
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="UF"
                          maxLength={2}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value.toUpperCase().slice(0, 2),
                            )
                          }
                        />
                      )}
                    />
                    {errors.state && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Observações{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </label>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        placeholder="Alguma observação sobre o pedido..."
                        maxLength={500}
                        rows={3}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                      />
                    )}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  {checkoutError && (
                    <p className="text-xs text-destructive text-center">
                      {checkoutError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Enviar pedido
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    disabled={isCheckingOut}
                    onClick={() => setView("choose")}
                  >
                    <ArrowLeft className="size-3.5" />
                    Voltar
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* ── Success view ── */}
          {view === "success" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Pedido enviado!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recebemos seu pedido e entraremos em contato em breve.
                </p>
                {checkoutResult && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Código de rastreio:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {checkoutResult.trackingCodeId}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID do pedido:{" "}
                      <span className="font-mono text-foreground">
                        {checkoutResult.id}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={handleSuccessClose}>
                Voltar ao catálogo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
