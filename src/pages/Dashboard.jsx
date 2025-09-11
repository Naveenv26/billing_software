import React, { useEffect, useState } from "react";
import { getInvoices } from "../api/invoices";

import { getProducts } from "../api/products";

export default function Dashboard() {
  const [todaySales, setTodaySales] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [monthSales, setMonthSales] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch invoices
        const invRes = await getInvoices();
        const invoices = invRes.data;

        // Today’s stats
        const today = new Date().toISOString().split("T")[0];
        const todaysInvoices = invoices.filter(
          (i) => i.invoice_date.startsWith(today)
        );

        setInvoiceCount(todaysInvoices.length);
        setTodaySales(
          todaysInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0)
        );

        // Monthly sales
        const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"
        const monthlyInvoices = invoices.filter((i) =>
          i.invoice_date.startsWith(month)
        );
        setMonthSales(
          monthlyInvoices.reduce(
            (sum, inv) => sum + Number(inv.grand_total),
            0
          )
        );

        // Products → low stock
        const prodRes = await getProducts();
        const products = prodRes.data;
        setLowStock(
          products.filter((p) => Number(p.quantity) <= p.low_stock_threshold)
            .length
        );
      } catch (err) {
        console.error("Dashboard load failed:", err.response?.data || err);
      }
    };

    loadData();
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-lg font-semibold">Today’s Sales</h2>
        <p className="text-2xl mt-2">₹{todaySales.toFixed(2)}</p>
      </div>
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-lg font-semibold">Invoices Today</h2>
        <p className="text-2xl mt-2">{invoiceCount}</p>
      </div>
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-lg font-semibold">Low Stock Items</h2>
        <p className="text-2xl mt-2">{lowStock}</p>
      </div>
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-lg font-semibold">This Month’s Sales</h2>
        <p className="text-2xl mt-2">₹{monthSales.toFixed(2)}</p>
      </div>
    </div>
  );
}
