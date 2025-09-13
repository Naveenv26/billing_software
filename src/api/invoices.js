import api from "./axios";

// Get sales summary
export async function salesReport(params = {}) {
  const res = await api.get("invoices/report/", { params });
  return res.data;
}



// create invoice
export const createInvoice = (data) => api.post("/invoices/", data);

// get all invoices
export const getInvoices = () => api.get("/invoices/");

// get single invoice by id
export const getInvoice = (id) => api.get(`/invoices/${id}/`);

// delete invoice (optional)
export const deleteInvoice = (id) => api.delete(`/invoices/${id}/`);


export const listInvoices = async () => {
  const res = await api.get("invoices/");
  return res.data;
};


