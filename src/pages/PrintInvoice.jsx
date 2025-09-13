// src/pages/PrintInvoice.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInvoice } from "../api/invoices";

export default function PrintInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getInvoice(id);
    setInvoice(res.data);
    setTimeout(() => window.print(), 500);
  };

  if (!invoice) return <p>Loading...</p>;

  return (
    <div className="w-[80mm] mx-auto text-xs font-mono">
      <h2 className="text-center text-base font-bold">My Shop Name</h2>
      <p className="text-center">Invoice: {invoice.number}</p>
      <p>Date: {new Date(invoice.invoice_date).toLocaleString()}</p>
      <p>
        Customer: {invoice.customer_name} ({invoice.customer_mobile})
      </p>

      <table className="w-full border-t border-b my-2">
        <thead>
          <tr>
            <th className="text-left">Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it) => (
            <tr key={it.id}>
              <td>{it.product_name}</td>
              <td>{it.qty}</td>
              <td>{it.unit_price}</td>
              <td>{it.line_total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>Subtotal: ₹{invoice.subtotal}</p>
      <p>Tax: ₹{invoice.tax_total}</p>
      <p className="font-bold">Grand Total: ₹{invoice.grand_total}</p>
      <p className="text-center mt-2">Thank you, Visit again!</p>
    </div>
  );
}
