import api from "./api";

export const fetchPosProducts = async () => {
  try {
    const response = await api.get("/sales/products");
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    throw error;
  }
};

export const createPosSale = async (salePayload) => {
  try {
    const response = await api.post("/sales", salePayload);
    return response.data;
  } catch (error) {
    throw error;
  }
};