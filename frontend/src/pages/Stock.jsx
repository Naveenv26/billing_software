import React, { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api/products";

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    unit: "pcs",
    price: "",
    quantity: "",
    tax_rate: "",
  });
  const [globalThreshold, setGlobalThreshold] = useState(5);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getProducts();
    setProducts(res.data);
  };

  const save = async () => {
    try {
      if (editing) {
        await updateProduct(editing.id, form);
      } else {
        await createProduct(form);
      }
      setEditing(null);
      setForm({ name: "", unit: "pcs", price: "", quantity: "", tax_rate: "" });
      load();
    } catch (err) {
      console.error("Product save failed:", err.response?.data || err);
      alert("Failed to save product");
    }
  };

  const remove = async (p) => {
    try {
      if (!p.id) {
        console.error("Product has no ID:", p);
        return;
      }
      await deleteProduct(p.id);
      load();
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err);
      alert("Failed to delete product");
    }
  };

  const adjustQty = async (p, change) => {
    const newQty = Number(p.quantity) + change;
    if (newQty < 0) {
      alert("❌ Quantity cannot go below 0!");
      return;
    }
    try {
      await updateProduct(p.id, { quantity: newQty });
      load();
    } catch (err) {
      console.error("Quantity update failed:", err.response?.data || err);
    }
  };

  return (
    <div className="p-6">
      {/* Global low stock threshold */}
      <div className="flex justify-end mb-4">
        <input
          type="number"
          value={globalThreshold}
          onChange={(e) => setGlobalThreshold(e.target.value)}
          className="border p-2 rounded w-40"
          placeholder="Low Stock Limit"
        />
      </div>

      <h2 className="text-xl font-bold mb-4">Stock Management</h2>

      {/* Product Form */}
      <div className="flex gap-2 mb-4">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="pcs">pcs</option>
          <option value="kg">kg</option>
        </select>
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="GST %"
          value={form.tax_rate}
          onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
          className="border p-2 rounded"
        />
        <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">
          {editing ? "Update" : "Add Product"}
        </button>
      </div>

      {/* Product Table */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Unit</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Quantity</th>
            <th className="p-2 border">GST %</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr
              key={p.id}
              className={Number(p.quantity) <= globalThreshold ? "bg-red-100" : ""}
            >
              <td className="p-2 border">{p.name}</td>
              <td className="p-2 border">{p.unit}</td>
              <td className="p-2 border">₹{p.price}</td>
              <td className="p-2 border">{p.quantity}</td>
              <td className="p-2 border">{p.tax_rate}%</td>
              <td className="p-2 border flex gap-2">
                <button onClick={() => adjustQty(p, -1)} className="bg-gray-300 px-2 rounded">-</button>
                <button onClick={() => adjustQty(p, 1)} className="bg-gray-300 px-2 rounded">+</button>
                <button onClick={() => setEditing(p) || setForm(p)} className="bg-yellow-500 px-2 rounded">Edit</button>
                <button onClick={() => remove(p)} className="bg-red-500 text-white px-2 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
