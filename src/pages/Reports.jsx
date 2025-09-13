import React, { useState, useEffect } from "react";
import { getInvoices } from "../api/invoices";
import { getProducts } from "../api/products";

export default function Reports() {
  const [tab, setTab] = useState("sales");
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const invRes = await getInvoices();
    setInvoices(invRes.data);
    const prodRes = await getProducts();
    setProducts(prodRes.data);
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!fromDate && !toDate) return true;
    const invDate = new Date(inv.invoice_date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (from && invDate < from) return false;
    if (to && invDate > to) return false;
    return true;
  });

  const totalSales = filteredInvoices.reduce(
    (sum, inv) => sum + Number(inv.grand_total),
    0
  );

  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price) * Number(p.quantity),
    0
  );

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${
            tab === "sales" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTab("sales")}
        >
          Sales Report
        </button>
        <button
          className={`px-4 py-2 rounded ${
            tab === "stock" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setTab("stock")}
        >
          Stock Report
        </button>
      </div>

      {/* Sales Report */}
      {tab === "sales" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Sales Report</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Invoice No</th>
                <th className="p-2 border">Customer</th>
                <th className="p-2 border">Mobile</th>
                <th className="p-2 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="p-2 border">
                    {new Date(inv.invoice_date).toLocaleDateString()}
                  </td>
                  <td className="p-2 border">{inv.number}</td>
                  <td className="p-2 border">{inv.customer?.name || "Walk-in"}</td>
                  <td className="p-2 border">{inv.customer?.mobile || "-"}</td>
                  <td className="p-2 border">₹{inv.grand_total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-200">
                <td colSpan="4" className="p-2 border text-right">
                  Grand Total
                </td>
                <td className="p-2 border">₹{totalSales.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Stock Report */}
      {tab === "stock" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Stock Report</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Product</th>
                <th className="p-2 border">Quantity</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Value</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 border">{p.name}</td>
                  <td className="p-2 border">{p.quantity}</td>
                  <td className="p-2 border">₹{p.price}</td>
                  <td className="p-2 border">
                    ₹{(Number(p.price) * Number(p.quantity)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-200">
                <td colSpan="3" className="p-2 border text-right">
                  Total Inventory Value
                </td>
                <td className="p-2 border">₹{inventoryValue.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
