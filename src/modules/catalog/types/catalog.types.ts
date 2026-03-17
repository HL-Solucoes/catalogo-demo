export type CatalogFinishType = "ALL" | "AUTOMATION" | "DIRECT";

export interface ICatalog {
  id: string;
  name: string;
  description: string | null;
  url: string;
  finishType: CatalogFinishType;
  companyId?: string;
}

export interface ICategory {
  id: string;
  name: string;
  description: string | null;
}

export interface IProductImage {
  id: string;
  url: string;
  key: string;
}

export interface IProduct {
  id: string;
  name: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  idControl: string;
  quantity: number;
  alertStock: number;
  price: string | null;
  isPriceVisible: boolean;
  discountPercentage: string | null;
  status: string;
  categoryId: string | null;
  brand: string | null;
  tags: string | null;
  images: IProductImage[];
  createdAt: string;
}

export interface IPaginatedResponse<T> {
  items: T[];
  meta: {
    itemCount: number;
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface IListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}
