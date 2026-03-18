"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MessageCircle,
  ClipboardList,
  Send,
  ArrowLeft,
  Loader2,
  Check,
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCartStore,
  selectCartItems,
  selectCartTotal,
} from "@/shared/store/cart.store";
import { formatCurrency } from "@/shared/lib/format";
import {
  orderFormSchema,
  type OrderFormValues,
  whatsappOrderFormSchema,
  type WhatsappOrderFormValues,
} from "@/shared/schemas/order.schema";
import { useCheckoutUseCase } from "@/modules/order/use-cases";
import { useGetCatalogUseCase } from "@/modules/catalog/use-cases";

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+5543996809107";
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID || "";
const CATALOG_ID = process.env.NEXT_PUBLIC_CATALOG_ID || "";

const TRACKING_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const TRACKING_DIGITS = "0123456789";
const ITEM_BULLET = "•⁠  ⁠";
const WHATSAPP_FORM_STORAGE_KEY = "whatsapp-order-form";
const CATALOG_FORM_STORAGE_KEY = "catalog-order-form";
const ORDER_HISTORY_STORAGE_KEY = "whatsapp-order-history";

const WHATSAPP_DEFAULT_VALUES: WhatsappOrderFormValues = {
  name: "",
  cpf: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  description: "",
};

const CATALOG_DEFAULT_VALUES: OrderFormValues = {
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
};

function generateTrackingCode(): string {
  let code = "#";
  for (let i = 0; i < 4; i++) {
    code += TRACKING_LETTERS.charAt(
      Math.floor(Math.random() * TRACKING_LETTERS.length),
    );
  }
  for (let i = 0; i < 4; i++) {
    code += TRACKING_DIGITS.charAt(
      Math.floor(Math.random() * TRACKING_DIGITS.length),
    );
  }
  return code;
}

type OrderMessageFormValues = {
  name: string;
  cpf: string;
  cep: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  description?: string;
};

function buildOrderMessage(
  items: ReturnType<typeof selectCartItems>,
  formData: OrderMessageFormValues,
  trackingCodeId: string,
): string {
  const lines: string[] = [];

  lines.push(`/PEDIDO CRIADO ${trackingCodeId}`);
  lines.push(`CLIENTE: ${formData.name}`);
  lines.push(`CPF: ${formData.cpf}`);
  lines.push("ENDERECO:");
  lines.push(`CEP: ${formData.cep}`);
  const addressLines = [
    formData.street ? `RUA: ${formData.street}` : null,
    formData.number ? `NUMERO: ${formData.number}` : null,
    formData.complement ? `COMPLEMENTO: ${formData.complement}` : null,
    formData.neighborhood ? `BAIRRO: ${formData.neighborhood}` : null,
    formData.city ? `CIDADE: ${formData.city}` : null,
    formData.state ? `ESTADO: ${formData.state}` : null,
  ].filter(Boolean) as string[];
  if (addressLines.length > 0) {
    lines.push(...addressLines);
  }
  lines.push(`OBSERVACOES: ${formData.description || ""}`);
  lines.push("");
  lines.push("ITENS:");
  items.forEach((item) => {
    lines.push(
      `${ITEM_BULLET}ID: ${item.idControl} | QTD: ${item.qty} | ${item.title}`,
    );
  });

  return lines.join("\n");
}

function buildWhatsAppMessage(
  items: ReturnType<typeof selectCartItems>,
  formData: WhatsappOrderFormValues,
  trackingCodeId: string,
): string {
  return buildOrderMessage(items, formData, trackingCodeId);
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

interface OrderStoredForm {
  name?: string;
  cpf?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  description?: string;
}

type WhatsappStoredForm = Pick<
  WhatsappOrderFormValues,
  | "name"
  | "cpf"
  | "cep"
  | "street"
  | "number"
  | "complement"
  | "neighborhood"
  | "city"
  | "state"
  | "description"
>;

type CatalogStoredForm = Pick<
  OrderFormValues,
  | "name"
  | "phone"
  | "cpf"
  | "cep"
  | "street"
  | "number"
  | "complement"
  | "neighborhood"
  | "city"
  | "state"
  | "description"
>;

interface OrderHistoryItem {
  id: string;
  trackingCodeId: string;
  source: "WHATSAPP" | "DIRECT";
  createdAt: string;
  message?: string | null;
  orderId?: string | null;
  items: { idControl: string; title: string; qty: number }[];
  form: OrderStoredForm;
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatHistoryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CartSummary() {
  const items = useCartStore(selectCartItems);
  const total = useCartStore(selectCartTotal);
  const clear = useCartStore((s) => s.clear);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ModalView>("choose");
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(
    null,
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [savedWhatsappForm, setSavedWhatsappForm] =
    useState<WhatsappStoredForm | null>(null);
  const [savedCatalogForm, setSavedCatalogForm] =
    useState<CatalogStoredForm | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<
    Record<string, boolean>
  >({});
  const [showWhatsappDetails, setShowWhatsappDetails] = useState(false);

  const { catalog } = useGetCatalogUseCase();
  const { checkout, isCheckingOut } = useCheckoutUseCase();

  const {
    control: catalogControl,
    handleSubmit: handleCatalogSubmit,
    reset: resetCatalogForm,
    formState: { errors: catalogErrors },
  } = useForm<OrderFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(orderFormSchema as any),
    defaultValues: CATALOG_DEFAULT_VALUES,
  });

  const {
    control: whatsappControl,
    handleSubmit: handleWhatsappSubmit,
    reset: resetWhatsappForm,
    formState: { errors: whatsappErrors },
    watch: watchWhatsapp,
  } = useForm<WhatsappOrderFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(whatsappOrderFormSchema as any),
    defaultValues: WHATSAPP_DEFAULT_VALUES,
  });

  const visibleTotal = items.filter((i) => i.is_price_visible);
  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);
  const whatsappCepDigits = (watchWhatsapp("cep") || "").replace(/\D/g, "");
  const showWhatsappAddressFields = whatsappCepDigits.length === 8;
  const hasSavedWhatsappForm = Boolean(savedWhatsappForm);
  const shouldShowWhatsappAddressFields =
    showWhatsappAddressFields && (!hasSavedWhatsappForm || showWhatsappDetails);
  const finishType = catalog?.finishType ?? "DIRECT";

  const savedAddressSummary = savedWhatsappForm
    ? [
        savedWhatsappForm.cep ? `CEP ${savedWhatsappForm.cep}` : null,
        savedWhatsappForm.street,
        savedWhatsappForm.number,
        savedWhatsappForm.neighborhood,
        savedWhatsappForm.city,
        savedWhatsappForm.state,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedForm = safeJsonParse<WhatsappStoredForm | null>(
        window.localStorage.getItem(WHATSAPP_FORM_STORAGE_KEY),
        null,
      );
      if (storedForm) {
        setSavedWhatsappForm(storedForm);
        resetWhatsappForm({ ...WHATSAPP_DEFAULT_VALUES, ...storedForm });
        setShowWhatsappDetails(false);
      }

      const storedCatalogForm = safeJsonParse<CatalogStoredForm | null>(
        window.localStorage.getItem(CATALOG_FORM_STORAGE_KEY),
        null,
      );
      if (storedCatalogForm) {
        setSavedCatalogForm(storedCatalogForm);
        resetCatalogForm({ ...CATALOG_DEFAULT_VALUES, ...storedCatalogForm });
      }

      const storedHistory = safeJsonParse<OrderHistoryItem[]>(
        window.localStorage.getItem(ORDER_HISTORY_STORAGE_KEY),
        [],
      );
      if (Array.isArray(storedHistory)) {
        setOrderHistory(storedHistory);
      }
    } catch {
      // ignore storage errors
    }
  }, [resetWhatsappForm, resetCatalogForm]);

  const resolvedCompanyId = catalog?.companyId || COMPANY_ID;
  const resolvedCatalogId = catalog?.id || CATALOG_ID;

  const handleOpenModal = () => {
    const initialView: ModalView =
      finishType === "ALL"
        ? "choose"
        : finishType === "AUTOMATION"
          ? "whatsapp"
          : "form";
    setView(initialView);
    setCheckoutError(null);
    setCheckoutResult(null);
    resetCatalogForm(
      savedCatalogForm
        ? { ...CATALOG_DEFAULT_VALUES, ...savedCatalogForm }
        : CATALOG_DEFAULT_VALUES,
    );
    resetWhatsappForm(
      savedWhatsappForm
        ? { ...WHATSAPP_DEFAULT_VALUES, ...savedWhatsappForm }
        : WHATSAPP_DEFAULT_VALUES,
    );
    setShowWhatsappDetails(false);
    setOpen(true);
  };

  const handleCloseModal = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setView("choose");
      setCheckoutError(null);
      resetCatalogForm(
        savedCatalogForm
          ? { ...CATALOG_DEFAULT_VALUES, ...savedCatalogForm }
          : CATALOG_DEFAULT_VALUES,
      );
      resetWhatsappForm(
        savedWhatsappForm
          ? { ...WHATSAPP_DEFAULT_VALUES, ...savedWhatsappForm }
          : WHATSAPP_DEFAULT_VALUES,
      );
      setShowWhatsappDetails(false);
    }
  };

  const handleFlowBack = () => {
    if (finishType === "ALL") {
      setView("choose");
      return;
    }
    handleCloseModal(false);
  };

  const buildCatalogStoredForm = (
    data: OrderFormValues,
  ): CatalogStoredForm => ({
    name: data.name,
    phone: data.phone,
    cpf: data.cpf,
    cep: data.cep,
    street: data.street,
    number: data.number,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    description: data.description,
  });

  const persistCatalogForm = (data: OrderFormValues) => {
    const storedForm = buildCatalogStoredForm(data);
    try {
      window.localStorage.setItem(
        CATALOG_FORM_STORAGE_KEY,
        JSON.stringify(storedForm),
      );
      setSavedCatalogForm(storedForm);
    } catch {
      // ignore storage errors
    }
    return storedForm;
  };

  const pushOrderHistory = (item: OrderHistoryItem) => {
    try {
      const updatedHistory = [item, ...orderHistory].slice(0, 20);
      window.localStorage.setItem(
        ORDER_HISTORY_STORAGE_KEY,
        JSON.stringify(updatedHistory),
      );
      setOrderHistory(updatedHistory);
    } catch {
      // ignore storage errors
    }
  };

  const doCheckout = async (
    source: "WHATSAPP" | "CATALOG",
    formData?: OrderFormValues,
    storedForm?: CatalogStoredForm,
  ) => {
    setCheckoutError(null);
    if (
      source === "CATALOG" &&
      (!resolvedCompanyId || !resolvedCatalogId)
    ) {
      setCheckoutError("Catálogo inválido ou não carregado.");
      return;
    }
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

      const directTrackingCode =
        source === "CATALOG" ? generateTrackingCode() : undefined;
      const directMessage =
        source === "CATALOG" && formData && directTrackingCode
          ? buildOrderMessage(items, formData, directTrackingCode)
          : undefined;

      const result = await checkout({
        companyId: resolvedCompanyId,
        catalogId: resolvedCatalogId,
        source,
        trackingCodeId: directTrackingCode,
        message: directMessage,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.qty,
          unitPrice: item.is_price_visible ? item.price : null,
        })),
        customerName: formData?.name || null,
        customerPhone: formData?.phone || null,
        customerAddress: address || null,
        description: formData?.description || null,
        total: total > 0 ? total : null,
      });

      setCheckoutResult({
        id: result.id,
        trackingCodeId: result.trackingCodeId,
      });

      if (source === "CATALOG" && formData) {
        const historyForm = storedForm ?? buildCatalogStoredForm(formData);
        pushOrderHistory({
          id: result.id,
          orderId: result.id,
          trackingCodeId: result.trackingCodeId,
          source: "DIRECT",
          createdAt: result.createdAt || new Date().toISOString(),
          message: directMessage ?? null,
          items: items.map((item) => ({
            idControl: item.idControl,
            title: item.title,
            qty: item.qty,
          })),
          form: historyForm,
        });
      }

      setView("success");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao finalizar pedido";
      setCheckoutError(errorMsg);
    }
  };

  const onSubmit = (data: OrderFormValues) => {
    const storedForm = persistCatalogForm(data);
    doCheckout("CATALOG", data, storedForm);
  };

  const onWhatsAppSubmit = (data: WhatsappOrderFormValues) => {
    const trackingCodeId = generateTrackingCode();
    const message = buildWhatsAppMessage(items, data, trackingCodeId);
    const normalizedPhone = WHATSAPP_NUMBER.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

    const storedForm: WhatsappStoredForm = {
      name: data.name,
      cpf: data.cpf,
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      description: data.description,
    };

    try {
      window.localStorage.setItem(
        WHATSAPP_FORM_STORAGE_KEY,
        JSON.stringify(storedForm),
      );
      setSavedWhatsappForm(storedForm);
    } catch {
      // ignore storage errors
    }

    const historyItem: OrderHistoryItem = {
      id:
        typeof window !== "undefined" &&
        "crypto" in window &&
        typeof window.crypto.randomUUID === "function"
          ? window.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      trackingCodeId,
      source: "WHATSAPP",
      createdAt: new Date().toISOString(),
      message,
      items: items.map((item) => ({
        idControl: item.idControl,
        title: item.title,
        qty: item.qty,
      })),
      form: storedForm,
    };

    pushOrderHistory(historyItem);

    setShowWhatsappDetails(false);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleSuccessClose = () => {
    clear();
    resetCatalogForm(
      savedCatalogForm
        ? { ...CATALOG_DEFAULT_VALUES, ...savedCatalogForm }
        : CATALOG_DEFAULT_VALUES,
    );
    resetWhatsappForm(
      savedWhatsappForm
        ? { ...WHATSAPP_DEFAULT_VALUES, ...savedWhatsappForm }
        : WHATSAPP_DEFAULT_VALUES,
    );
    setShowWhatsappDetails(false);
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

        {orderHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setHistoryOpen(true)}
          >
            Pedidos gerados anteriormente ({orderHistory.length})
          </Button>
        )}
      </div>

      {/* Finalize modal */}
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {/* ── Choose view ── */}
          {view === "choose" && finishType === "ALL" && (
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
                <DialogDescription>
                  Preencha seus dados para abrir o WhatsApp
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleWhatsappSubmit(onWhatsAppSubmit)}
                className="space-y-3"
              >
                {/* Name */}
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Nome completo <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    control={whatsappControl}
                    name="name"
                    render={({ field }) => (
                      <Input
                        placeholder="Seu nome completo"
                        maxLength={100}
                        {...field}
                      />
                    )}
                  />
                  {whatsappErrors.name && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {whatsappErrors.name.message}
                    </p>
                  )}
                </div>

                {/* CPF */}
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    CPF <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    control={whatsappControl}
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
                  {whatsappErrors.cpf && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {whatsappErrors.cpf.message}
                    </p>
                  )}
                </div>

                <Separator />

                {/* CEP */}
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    CEP <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    control={whatsappControl}
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
                  {whatsappErrors.cep && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {whatsappErrors.cep.message}
                    </p>
                  )}
                </div>

                {showWhatsappAddressFields && hasSavedWhatsappForm && (
                  <>
                    <Separator />

                    <div className="rounded-md border border-dashed px-3 py-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">
                            Endereço salvo
                          </p>
                          {savedAddressSummary ? (
                            <p className="text-muted-foreground">
                              {savedAddressSummary}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">
                              Endereço salvo anteriormente.
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto px-2 py-1 text-xs"
                          onClick={() =>
                            setShowWhatsappDetails((prev) => !prev)
                          }
                        >
                          {showWhatsappDetails ? "Ocultar" : "Ver mais"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {shouldShowWhatsappAddressFields && (
                  <>
                    {!hasSavedWhatsappForm && <Separator />}

                    <p className="text-xs font-medium text-muted-foreground">
                      Endereço (opcional)
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs font-medium">
                          Rua
                        </label>
                        <Controller
                          control={whatsappControl}
                          name="street"
                          render={({ field }) => (
                            <Input
                              placeholder="Rua, Avenida..."
                              maxLength={120}
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Número
                        </label>
                        <Controller
                          control={whatsappControl}
                          name="number"
                          render={({ field }) => (
                            <Input placeholder="123" maxLength={20} {...field} />
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Complemento
                        </label>
                        <Controller
                          control={whatsappControl}
                          name="complement"
                          render={({ field }) => (
                            <Input
                              placeholder="Apto, casa, bloco..."
                              maxLength={120}
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Bairro
                        </label>
                        <Controller
                          control={whatsappControl}
                          name="neighborhood"
                          render={({ field }) => (
                            <Input placeholder="Bairro" maxLength={60} {...field} />
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          Cidade
                        </label>
                        <Controller
                          control={whatsappControl}
                          name="city"
                          render={({ field }) => (
                            <Input placeholder="Cidade" maxLength={60} {...field} />
                          )}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium">
                          UF
                        </label>
                        <Controller
                          control={whatsappControl}
                          name="state"
                          render={({ field }) => (
                            <Input
                              placeholder="UF"
                              maxLength={2}
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value.toUpperCase().slice(0, 2),
                                )
                              }
                            />
                          )}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Observations */}
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Observações
                  </label>
                  <Controller
                    control={whatsappControl}
                    name="description"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        placeholder="Alguma observação sobre o pedido..."
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                        rows={3}
                      />
                    )}
                  />
                </div>

                <Button type="submit" className="w-full gap-2">
                  <MessageCircle className="size-4" />
                  Abrir WhatsApp
                </Button>
              </form>

              <p className="text-xs text-muted-foreground">
                Ao enviar, o WhatsApp será aberto automaticamente com a mensagem
                pronta.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleFlowBack}
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

              <form
                onSubmit={handleCatalogSubmit(onSubmit)}
                className="space-y-3"
              >
                {/* Name */}
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Nome completo <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    control={catalogControl}
                    name="name"
                    render={({ field }) => (
                      <Input
                        placeholder="Seu nome completo"
                        maxLength={100}
                        {...field}
                      />
                    )}
                  />
                  {catalogErrors.name && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {catalogErrors.name.message}
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
                      control={catalogControl}
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
                    {catalogErrors.phone && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {catalogErrors.phone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      CPF <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={catalogControl}
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
                    {catalogErrors.cpf && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {catalogErrors.cpf.message}
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
                      control={catalogControl}
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
                    {catalogErrors.cep && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {catalogErrors.cep.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      Rua <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={catalogControl}
                      name="street"
                      render={({ field }) => (
                        <Input
                          placeholder="Rua, Avenida..."
                          maxLength={120}
                          {...field}
                        />
                      )}
                    />
                    {catalogErrors.street && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {catalogErrors.street.message}
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
                      control={catalogControl}
                      name="number"
                      render={({ field }) => (
                        <Input placeholder="Nº" maxLength={10} {...field} />
                      )}
                    />
                    {catalogErrors.number && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {catalogErrors.number.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      Complemento
                    </label>
                    <Controller
                      control={catalogControl}
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
                      control={catalogControl}
                      name="neighborhood"
                      render={({ field }) => (
                        <Input placeholder="Bairro" maxLength={60} {...field} />
                      )}
                    />
                    {catalogErrors.neighborhood && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {catalogErrors.neighborhood.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Cidade <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={catalogControl}
                      name="city"
                      render={({ field }) => (
                        <Input placeholder="Cidade" maxLength={60} {...field} />
                      )}
                    />
                    {catalogErrors.city && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {catalogErrors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      UF <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={catalogControl}
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
                    {catalogErrors.state && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {catalogErrors.state.message}
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
                    control={catalogControl}
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
                <div className="sticky bottom-0 -mx-6 flex flex-col gap-2 border-t bg-background px-6 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
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
                    onClick={handleFlowBack}
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

      {/* History modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pedidos gerados anteriormente</DialogTitle>
            <DialogDescription>
              Acesse rapidamente seus pedidos enviados pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>

          {orderHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum pedido foi gerado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {orderHistory.map((history) => {
                const expanded = Boolean(expandedHistory[history.id]);
                const trackingLabel = history.trackingCodeId || "Sem código";
                const sourceValue = history.source ?? "WHATSAPP";
                const sourceLabel =
                  sourceValue === "DIRECT" ? "Catálogo" : "WhatsApp";
                const safeItems = Array.isArray(history.items)
                  ? history.items
                  : [];
                const safeForm = history.form || ({} as WhatsappStoredForm);
                const itemCount = safeItems.reduce(
                  (acc, item) => acc + item.qty,
                  0,
                );
                const addressLines = [
                  safeForm.cep ? `CEP: ${safeForm.cep}` : null,
                  safeForm.street ? `Rua: ${safeForm.street}` : null,
                  safeForm.number ? `Numero: ${safeForm.number}` : null,
                  safeForm.complement
                    ? `Complemento: ${safeForm.complement}`
                    : null,
                  safeForm.neighborhood
                    ? `Bairro: ${safeForm.neighborhood}`
                    : null,
                  safeForm.city ? `Cidade: ${safeForm.city}` : null,
                  safeForm.state ? `UF: ${safeForm.state}` : null,
                ].filter(Boolean) as string[];

                return (
                  <Card key={history.id} className="gap-3 py-4">
                    <CardHeader className="gap-1 border-b">
                      <CardTitle className="text-sm">
                        Pedido {trackingLabel}
                      </CardTitle>
                      <CardDescription>
                        {formatHistoryDate(history.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="space-y-1 text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Itens: {itemCount}</span>
                          <span>{sourceLabel}</span>
                        </div>
                        <p>Cliente: {safeForm.name || "Cliente"}</p>
                        {history.orderId && <p>ID: {history.orderId}</p>}
                      </div>

                      {expanded && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              Itens
                            </p>
                            {safeItems.map((item) => (
                              <p key={`${history.id}-${item.idControl}`}>
                                {item.qty}x {item.title} (ID: {item.idControl})
                              </p>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              Cliente
                            </p>
                            <p>Nome: {safeForm.name || "-"}</p>
                            <p>CPF: {safeForm.cpf || "-"}</p>
                            {safeForm.phone && (
                              <p>Telefone: {safeForm.phone}</p>
                            )}
                          </div>

                          {addressLines.length > 0 && (
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                Endereço
                              </p>
                              {addressLines.map((line) => (
                                <p key={`${history.id}-${line}`}>{line}</p>
                              ))}
                            </div>
                          )}

                          {safeForm.description && (
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                Observações
                              </p>
                              <p>{safeForm.description}</p>
                            </div>
                          )}

                          {history.message && (
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                Mensagem enviada
                              </p>
                              <pre className="whitespace-pre-wrap rounded-md border bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                                {history.message}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedHistory((prev) => ({
                            ...prev,
                            [history.id]: !expanded,
                          }))
                        }
                      >
                        {expanded ? "Ocultar detalhes" : "Mostrar mais detalhes"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
