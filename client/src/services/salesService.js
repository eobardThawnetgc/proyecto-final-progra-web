import api from "./api";

// Obtiene la lista de productos disponibles para vender en el POS
export const fetchPosProducts = async () => {
  try {
    const response = await api.get("/products");
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    throw error;
  }
};

// Envía la venta creada en el carrito hacia el servidor para guardarla
export const createPosSale = async (salePayload) => {
  try {
    const response = await api.post("/sales", salePayload);
    return response.data;
  } catch (error) {
    throw error;
  }
};