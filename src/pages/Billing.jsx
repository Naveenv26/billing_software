import React, { useState, useEffect, useRef } from "react";
import { getProducts } from "../api/products";
import { createInvoice } from "../api/invoices";

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [lastRemoved, setLastRemoved] = useState(null);

  const nameRef = useRef();
  const mobileRef = useRef();
  const searchRef = useRef();
  const productRefs = useRef({});

  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [highlightedId, setHighlightedId] = useState(null);

  const shopName = "My Shop Name";
  const today = new Date().toLocaleDateString();

  // Load products safely
  const loadProducts = async () => {
    try {
      const res = await getProducts();
      const rawProducts = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const normalized = rawProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        unit: p.unit || "",
        tax_rate: Number(p.tax_rate || 0),
        stock: Number(p.quantity ?? p.stock ?? p.available_qty ?? 0),
      }));
      setProducts(normalized);
    } catch (err) {
      console.error("Failed to load products:", err);
      setProducts([]);
      alert("Failed to load products. Please login or check network.");
    }
  };

  useEffect(() => {
    loadProducts();
    nameRef.current?.focus();
  }, []);

  // Cart operations
  const addToCart = (p) => {
    setCart((prev) => {
      const found = prev.find((c) => c.id === p.id);
      if (found) {
        return prev.map((c) =>
          c.id === p.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const removeItem = (id) => {
    const removed = cart.find((c) => c.id === id);
    if (removed) setLastRemoved(removed);
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const undoRemove = () => {
    if (lastRemoved) {
      setCart((prev) => [...prev, lastRemoved]);
      setLastRemoved(null);
    }
  };

  const updateQty = (id, newQty) => {
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, qty: newQty } : c))
    );
  };

  // Totals
  const subtotal = cart.reduce((sum, c) => sum + c.qty * c.price, 0);
  const tax = cart.reduce(
    (sum, c) => sum + (c.qty * c.price * c.tax_rate) / 100,
    0
  );
  const total = subtotal + tax;

  // Finalize invoice
  const finalizeInvoice = async () => {
    try {
      if (!cart.length) {
        alert("Cart is empty");
        return;
      }

      const payload = {
        payment_mode: "cash",
        customer_name: customerName || "",
        customer_mobile: customerMobile || "",
        items: cart.map((c) => {
          const lineTotal = c.qty * c.price;
          const taxAmt = (lineTotal * c.tax_rate) / 100;
          return {
            product: c.id,
            qty: c.qty,
            unit_price: c.price,
            tax_rate: c.tax_rate,
            line_total: lineTotal + taxAmt,
            oversold: c.qty > c.stock,
          };
        }),
        subtotal,
        tax_total: tax,
        grand_total: total,
      };

      const res = await createInvoice(payload);
      setInvoiceData(res.data);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to save invoice:", err.response?.data || err);
      alert("Failed to save invoice. Please try again.");
    }
  };

  const confirmInvoice = () => {
    setCart([]);
    setCustomerName("");
    setCustomerMobile("");
    setSearch("");
    setHighlightedId(null);
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
    setShowModal(false);
    nameRef.current?.focus();
  };

  const cancelInvoice = () => {
    setCart([]);
    setShowModal(false);
    nameRef.current?.focus();
  };

  // Search + highlight
  const handleSearchKeys = (e) => {
    const lowerSearch = search.toLowerCase();
    const filtered = (products || []).filter((p) =>
      p.name.toLowerCase().includes(lowerSearch)
    );
    const filteredIds = filtered.map((p) => p.id);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (!filteredIds.length) return;
      const nextIndex =
        currentMatchIndex + 1 < filteredIds.length ? currentMatchIndex + 1 : 0;
      setCurrentMatchIndex(nextIndex);
      setHighlightedId(filteredIds[nextIndex]);
      scrollToProduct(filteredIds[nextIndex]);
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (!filteredIds.length) return;
      const prevIndex =
        currentMatchIndex - 1 >= 0 ? currentMatchIndex - 1 : filteredIds.length - 1;
      setCurrentMatchIndex(prevIndex);
      setHighlightedId(filteredIds[prevIndex]);
      scrollToProduct(filteredIds[prevIndex]);
    }

    if (e.key === "Enter") {
      if (currentMatchIndex >= 0 && filteredIds.length > 0) {
        const prodId = filteredIds[currentMatchIndex];
        const prod = (products || []).find((p) => p.id === prodId);
        if (prod) addToCart(prod);
      }
    }

    if (!["Enter", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      setSearchMatches(filteredIds);
      setCurrentMatchIndex(-1);
      setHighlightedId(null);
    }
  };

  const scrollToProduct = (id) => {
    const element = productRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", inline: "center" });
      setHighlightedId(id);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white shadow rounded">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <p className="text-sm text-gray-600">{today}</p>
        <h1 className="text-xl font-bold">{shopName}</h1>
      </div>

      {/* Customer Info */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          ref={nameRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              mobileRef.current?.focus();
            }
          }}
          className="border p-2 rounded w-1/3"
        />
        <input
          type="text"
          placeholder="Mobile Number"
          value={customerMobile}
          onChange={(e) => setCustomerMobile(e.target.value)}
          ref={mobileRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              searchRef.current?.focus();
            }
          }}
          className="border p-2 rounded w-1/3"
        />
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search product..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setHighlightedId(null);
            setSearchMatches([]);
            setCurrentMatchIndex(-1);
          }}
          onKeyDown={handleSearchKeys}
          ref={searchRef}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* Product Row */}
      <div className="flex gap-4 mb-6 overflow-x-auto border p-3 rounded">
        {(products || [])
          .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
          .map((p) => {
            const orderedItem = cart.find((c) => c.id === p.id);
            const orderedQty = orderedItem ? orderedItem.qty : 0;
            const oversold = orderedQty > p.stock ? orderedQty - p.stock : 0;

            return (
              <div
                key={p.id}
                ref={(el) => (productRefs.current[p.id] = el)}
                className={`border p-3 min-w-[150px] rounded flex-shrink-0 cursor-pointer hover:bg-gray-100 
                  ${highlightedId === p.id ? "bg-indigo-200" : ""}`}
                onClick={() => addToCart(p)}
              >
                <h3 className="font-semibold">{p.name}</h3>
                <p>₹{p.price} ({p.unit})</p>
                <p className="text-sm text-gray-500">Tax: {p.tax_rate}%</p>
                <p className="text-xs text-gray-600">
                  Stock: {p.stock} | Ordered: {orderedQty}
                  {oversold > 0 && (
                    <span className="text-red-600 ml-2">⚠ Oversold: {oversold}</span>
                  )}
                </p>
              </div>
            );
          })}
      </div>

      {/* Cart Table */}
      <div className="overflow-x-auto">
        <table className="w-full border mb-4 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left w-1/3">Product</th>
              <th className="p-2 border text-center w-1/6">Qty</th>
              <th className="p-2 border text-right w-1/6">Price</th>
              <th className="p-2 border text-right w-1/6">Tax%</th>
              <th className="p-2 border text-right w-1/6">Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((c) => {
              const lineTotal = c.qty * c.price;
              const taxAmt = (lineTotal * c.tax_rate) / 100;
              const totalWithTax = lineTotal + taxAmt;

              return (
                <tr key={c.id}>
                  <td className="p-2 border">
                    <button
                      onClick={() => removeItem(c.id)}
                      className="text-red-600 font-bold hover:scale-110 mr-2"
                    >
                      ✕
                    </button>
                    {c.name}
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => updateQty(c.id, c.qty - 1)}
                      className="px-2 bg-gray-200 rounded hover:bg-gray-300"
                      disabled={c.qty <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.01"
                      value={c.qty}
                      onChange={(e) => updateQty(c.id, Number(e.target.value))}
                      className="w-16 border p-1 rounded text-center"
                    />
                    <button
                      onClick={() => updateQty(c.id, c.qty + 1)}
                      className="px-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                  </td>
                  <td className="p-2 border text-right">₹{c.price}</td>
                  <td className="p-2 border text-right">{c.tax_rate}%</td>
                  <td className="p-2 border text-right font-semibold">
                    ₹{totalWithTax.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="text-right mb-4 text-sm space-y-1">
        <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
        <p>Tax: ₹{tax.toFixed(2)}</p>
        <p className="font-bold">Grand Total: ₹{total.toFixed(2)}</p>
      </div>

      <button
        onClick={finalizeInvoice}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Finalize Invoice
      </button>

      {/* Invoice Modal */}
      {showModal && invoiceData && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <div id="printableBill" className="bg-white w-80 p-6">
            {/* Header */}
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold">{shopName}</h2>
              <p className="text-sm">Invoice No: {invoiceData.number}</p>
              <p className="text-sm">{new Date(invoiceData.invoice_date).toLocaleString()}</p>
            </div>

            {(invoiceData.customer_name || invoiceData.customer_mobile) && (
              <p className="mb-2 text-sm">
                Customer: {invoiceData.customer_name || ""}{" "}
                {invoiceData.customer_mobile ? `(${invoiceData.customer_mobile})` : ""}
              </p>
            )}

            <hr className="my-2 border-t-2 border-gray-400" />

            <table className="w-full text-sm my-2">
              <thead>
                <tr>
                  <th className="text-left">Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody className="my-2 border-t-2 border-gray-400">
                {invoiceData.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.product_name}</td>
                    <td className="text-center">{it.qty}</td>
                    <td className="text-right">₹{it.unit_price}</td>
                    <td className="text-right">₹{it.line_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr className="my-2 border-t-2 border-gray-400" />

            <div className="text-right text-sm space-y-1 mt-2">
              <p>Subtotal: ₹{invoiceData.subtotal}</p>
              <p>Tax: ₹{invoiceData.tax_total}</p>
              <p className="font-bold">Grand Total: ₹{invoiceData.grand_total}</p>
            </div>

            <hr className="my-2 border-t-2 border-gray-400" />

            <p className="text-center mt-4 text-sm">*** Thank you! Visit Again ***</p>

            <div id="modal-actions" className="mt-4 flex justify-end gap-2">
              <button
                onClick={async () => {
                  window.print();
                  confirmInvoice();
                  await loadProducts();
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
              >
                Print
              </button>
              <button onClick={cancelInvoice} className="bg-gray-200 px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT STYLING */}
      <style>{`
        @page {
          size: auto;
          margin: 0;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printableBill, #printableBill * {
            visibility: visible !important;
          }
          #printableBill {
            position: fixed;
            top: 0;
            left: 0;
            width: calc(100% - 40px) !important;
            margin: 0 20px !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          #modal-actions {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
