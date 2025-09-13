import React, { useState, useEffect, useRef } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/products";

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    unit: "pcs",
    price: "",
    quantity: "",
    tax_rate: "0",
  });
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  // Low stock threshold (frontend only)
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Undo Toast
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const lastDeleted = useRef(null);

  useEffect(() => {
    load();
  }, []);

  // safe load
  const load = async () => {
    try {
      const res = await getProducts();
      const list = res?.data ?? res;
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setProducts([]);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateProduct(editing.id, form);
      } else {
        await createProduct(form);
      }
      closeModal();
      await load();
    } catch (err) {
      console.error("Save failed:", err.response?.data || err);
      alert("Failed to save product");
    }
  };

  const handleDelete = async (p) => {
    try {
      lastDeleted.current = p;
      // optimistic UI remove
      setProducts((prev) => prev.filter((x) => x.id !== p.id));

      // toast with undo
      setToast({
        msg: `Deleted "${p.name}"`,
        action: async () => {
          try {
            const payload = {
              name: lastDeleted.current.name,
              unit: lastDeleted.current.unit,
              price: lastDeleted.current.price,
              quantity: lastDeleted.current.quantity,
              tax_rate:
                lastDeleted.current.tax_rate ??
                lastDeleted.current.gst ??
                "0",
            };
            await createProduct(payload);
            await load();
          } catch (err) {
            console.error("Undo failed:", err);
            alert("Undo failed to restore product.");
          }
        },
      });

      await deleteProduct(p.id);
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err);
      alert("Failed to delete product");
      await load();
    }
  };

  // Optimistic qty update
  const adjustQty = async (p, change) => {
    const prod = products.find((x) => x.id === p.id);
    if (!prod) return;

    const currentQty = Number(prod.quantity || 0);
    const newQty = currentQty + Number(change);
    if (newQty < 0) return;

    const updatedProduct = { ...prod, quantity: newQty };
    const backup = products;
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? updatedProduct : x))
    );

    try {
      await updateProduct(p.id, updatedProduct);
    } catch (err) {
      console.error("Quantity update failed:", err.response?.data || err);
      setProducts(backup);
      alert("Failed to update quantity. Reverted.");
    }
  };

  const openModal = (product = null) => {
    setEditing(product);
    if (product) {
      setForm({
        name: product.name ?? "",
        unit: product.unit ?? "pcs",
        price: product.price ?? "",
        quantity: product.quantity ?? "",
        tax_rate: product.tax_rate ?? product.gst ?? "0",
      });
    } else {
      setForm({
        name: "",
        unit: "pcs",
        price: "",
        quantity: "",
        tax_rate: "0",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  // Toast countdown
  useEffect(() => {
    if (toast) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setToast(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [toast]);

  // Filter + Sort
  const filtered = products.filter((p) =>
    (p.name || "").toString().toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    let v1 = a[sortKey];
    let v2 = b[sortKey];
    if (sortKey === "name") {
      v1 = (v1 || "").toString().toLowerCase();
      v2 = (v2 || "").toString().toLowerCase();
    } else {
      v1 = Number(v1 || 0);
      v2 = Number(v2 || 0);
    }
    if (v1 < v2) return sortDir === "asc" ? -1 : 1;
    if (v1 > v2) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Enter-to-next-input
  const handleEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const formEls = Array.from(
        e.target.form.querySelectorAll("input, select")
      );
      const index = formEls.indexOf(e.target);
      if (index > -1 && index < formEls.length - 1) {
        formEls[index + 1].focus();
      } else if (index === formEls.length - 1) {
        e.target.form.requestSubmit?.();
      }
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-slate-800">Stock Management</h1>
        <p className="text-sm text-slate-500">
          Track, add, and manage your product inventory.
        </p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow">
          <div className="text-slate-500 text-sm">Total Inventory Value</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700">
            ₹
            {products
              .reduce(
                (sum, p) =>
                  sum + Number(p.price || 0) * Number(p.quantity || 0),
                0
              )
              .toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow">
          <div className="text-slate-500 text-sm">
            Low Stock Items (≤ {lowStockThreshold})
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">
            {
              products.filter(
                (p) =>
                  Number(p.quantity || 0) <= lowStockThreshold &&
                  Number(p.quantity || 0) > 0
              ).length
            }
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow">
          <div className="text-slate-500 text-sm">Out of Stock</div>
          <div className="mt-2 text-3xl font-extrabold text-rose-700">
            {products.filter((p) => Number(p.quantity || 0) === 0).length}
          </div>
        </div>

        {/* Threshold Config */}
        <div className="bg-white p-5 rounded-2xl shadow flex flex-col justify-between">
          <div className="text-slate-500 text-sm">Set Low Stock Trigger</div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="w-20 border border-slate-300 px-2 py-1 rounded-lg text-center text-sm"
              min="1"
            />
            <button
              onClick={() =>
                alert(`Low stock threshold set to ${lowStockThreshold}`)
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </section>

      {/* Products Table */}
      <section className="bg-white shadow rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-3">
          <h2 className="text-lg font-semibold text-slate-700">All Products</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-300 px-3 py-2 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={() => openModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow text-sm font-medium"
            >
              ➕ Add Product
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th
                  className="p-3 text-left font-medium cursor-pointer"
                  onClick={() => toggleSort("name")}
                >
                  Product Name ⬍
                </th>
                <th
                  className="p-3 text-center font-medium cursor-pointer"
                  onClick={() => toggleSort("quantity")}
                >
                  Quantity ⬍
                </th>
                <th
                  className="p-3 text-right font-medium cursor-pointer"
                  onClick={() => toggleSort("price")}
                >
                  Price ⬍
                </th>
                <th className="p-3 text-center font-medium">GST %</th>
                <th className="p-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((p) => (
                <tr
                  key={p.id}
                  className={
                    Number(p.quantity) === 0
                      ? "bg-rose-50 text-rose-800"
                      : Number(p.quantity) <= lowStockThreshold
                      ? "bg-amber-50 text-amber-800"
                      : ""
                  }
                >
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-center font-semibold">
                    {p.quantity}
                  </td>
                  <td className="p-3 text-right">₹{p.price}</td>
                  <td className="p-3 text-center">{p.tax_rate}%</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => adjustQty(p, -1)}
                        className="bg-slate-200 h-7 w-7 rounded-md font-bold hover:bg-slate-300"
                        disabled={Number(p.quantity || 0) <= 0}
                      >
                        -
                      </button>
                      <button
                        onClick={() => adjustQty(p, 1)}
                        className="bg-slate-200 h-7 w-7 rounded-md font-bold hover:bg-slate-300"
                      >
                        +
                      </button>
                      <button
                        onClick={() => openModal(p)}
                        className="text-slate-500 hover:text-indigo-600 p-1.5 rounded-md"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-slate-500 hover:text-rose-600 p-1.5 rounded-md"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-slate-800">
                {editing ? "Edit Product" : "Add New Product"}
              </h3>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Product Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onKeyDown={handleEnter}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    onKeyDown={handleEnter}
                    className="mt-1 w-full border border-slate-300 px-3 py-2 rounded-lg text-sm"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    onKeyDown={handleEnter}
                    className="mt-1 w-full border border-slate-300 px-3 py-2 rounded-lg text-sm"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  GST %
                </label>
                <select
                  value={form.tax_rate}
                  onChange={(e) =>
                    setForm({ ...form, tax_rate: e.target.value })
                  }
                  onKeyDown={handleEnter}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 rounded-lg text-sm"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="18">18%</option>
                  <option value="40">40%</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Unit
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  onKeyDown={handleEnter}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 rounded-lg text-sm"
                >
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="ltr">ltr</option>
                </select>
              </div>
            </form>
            <div className="p-4 bg-slate-50 rounded-b-2xl flex justify-end items-center gap-3">
              <button
                onClick={closeModal}
                type="button"
                className="text-sm bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                type="submit"
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-lg flex items-center gap-4 w-72 animate-slideIn">
          <div className="flex-1">
            <div className="font-medium">{toast.msg}</div>
            <div className="text-xs text-slate-300">
              Undo available for {countdown}s
            </div>
          </div>
          <button
            onClick={async () => {
              await toast.action();
              setToast(null);
            }}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm"
          >
            Undo
          </button>
        </div>
      )}
    </main>
  );
}
