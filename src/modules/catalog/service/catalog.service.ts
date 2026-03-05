import { Http } from "@/shared/api/http";
import type {
  ICatalog,
  ICategory,
  IProduct,
  IPaginatedResponse,
  IListProductsParams,
} from "../types/catalog.types";

const CATALOG_ID = process.env.NEXT_PUBLIC_CATALOG_ID || "";

const catalogService = {
  async getCatalog(catalogId: string = CATALOG_ID): Promise<ICatalog> {
    const { data } = await Http.get(`/public/catalogs/${catalogId}`);
    return data.data;
  },

  async getCategories(catalogId: string = CATALOG_ID): Promise<ICategory[]> {
    const { data } = await Http.get(`/public/catalogs/${catalogId}/categories`);
    return data.data;
  },

  async getProducts(
    params?: IListProductsParams,
    catalogId: string = CATALOG_ID,
  ): Promise<IPaginatedResponse<IProduct>> {
    const { data } = await Http.get(`/public/catalogs/${catalogId}/products`, {
      params,
    });
    return data.data;
  },

  async getProduct(
    productId: string,
    catalogId: string = CATALOG_ID,
  ): Promise<IProduct> {
    const { data } = await Http.get(
      `/public/catalogs/${catalogId}/products/${productId}`,
    );
    return data.data;
  },
};

export default catalogService;
