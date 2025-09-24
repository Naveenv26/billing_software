import client from "./client";

// Get sales summary
export async function salesReport(params = {}) {
  const res = await client.get("invoices/report/", { params });
  return res.data;
}

// Create invoice
export const createInvoice = (data) => client.post("/invoices/", data);

// Get all invoices
export const getInvoices = () => client.get("/invoices/");

// Get single invoice by id
export const getInvoice = (id) => client.get(`/invoices/${id}/`);

// Delete invoice (optional)
export const deleteInvoice = (id) => client.delete(`/invoices/${id}/`);

// List invoices (async)
export const listInvoices = async () => {
  const res = await client.get("invoices/");
  return res.data;
};

