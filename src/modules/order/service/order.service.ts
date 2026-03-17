import { Http } from "@/shared/api/http";
import type { ICheckoutPayload, ICheckoutResponse } from "../types/order.types";

const orderService = {
  async checkout(payload: ICheckoutPayload): Promise<ICheckoutResponse> {
    const { data } = await Http.post("/public/orders/direct", payload);
    return data.data;
  },
};

export default orderService;
