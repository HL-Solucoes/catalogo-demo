export interface ICheckoutItem {
  productId: string;
  quantity: number;
  unitPrice?: string | null;
}

export interface ICheckoutPayload {
  companyId: string;
  catalogId: string;
  trackingCodeId?: string;
  source: "WHATSAPP" | "CATALOG";
  items: ICheckoutItem[];
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  description?: string | null;
  total?: string | null;
}

export interface ICheckoutResponse {
  id: string;
  trackingCodeId: string;
  status: string;
  total: string | null;
  customerName: string | null;
  customerPhone: string | null;
  cameFrom: string | null;
  createdAt: string;
}
