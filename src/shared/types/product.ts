export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface Product {
  // Identification
  id: string;
  idControl: string; // pattern: #AAAA0000
  company_id: string;
  catalog_id: string;
  category_id?: string;

  // Basic info
  name: string;
  title: string;
  subtitle?: string;
  description?: string;

  // Stock
  quantity: number;
  alert_stock: number;

  // Status
  status: ProductStatus;

  // Price
  price: number;
  is_price_visible: boolean;
  discount_percentage?: number;

  // Classification
  brand?: string;
  tags: string[];
  technical_specs: Record<string, string | number | boolean>;

  // Images
  image: string;
  images?: string[];

  // Audit
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CartItem {
  productId: string;
  idControl: string;
  title: string;
  price: number;
  is_price_visible: boolean;
  image: string;
  qty: number;
  stock: number;
}
