import api from "./axios";

export const listProducts = async () => {
  const res = await api.get("products/");
  return res.data;
};

export const createProduct = async (product) => {
  const res = await api.post("products/", product);
  return res.data;
};

export const updateProduct = async (id, product) => {
  const res = await api.put(`products/${id}/`, product);
  return res.data;
};

// ✅ Soft delete instead of hard delete (to avoid ProtectedError)
export const deleteProduct = async (id) => {
  const res = await api.patch(`products/${id}/`, { is_active: false });
  return res.data;
};

// Stock report (low stock, out of stock)
export async function stockReport() {
  const res = await api.get("products/report/");
  return res.data;
}

export const getProducts = () => api.get("products/");
