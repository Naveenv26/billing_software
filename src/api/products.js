import client from "./client";

// Get all products
export const getProducts = async () => {
  const res = await client.get("products/");
  return res.data;
};

// Create a new product
export const createProduct = async (product) => {
  const res = await client.post("products/", product);
  return res.data;
};

// Update a product by ID
export const updateProduct = async (id, product) => {
  const res = await client.put(`products/${id}/`, product);
  return res.data;
};

// Soft delete a product by ID (set is_active to false)
export const deleteProduct = async (id) => {
  const res = await client.patch(`products/${id}/`, { is_active: false });
  return res.data;
};

// Get stock report (low stock, out of stock)
export const stockReport = async () => {
  const res = await client.get("products/report/");
  return res.data;
};
