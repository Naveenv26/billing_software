import { useState } from "react"
import api from "../api/client"

export default function Settings({ user }) {
  const [shop, setShop] = useState(user.shop)

  const handleSave = async () => {
    await api.patch(`/shops/${shop.id}/`, shop)
    alert("Settings updated")
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Shop Settings</h1>
      <label>Shop Name</label>
      <input
        value={shop.name}
        onChange={(e) => setShop({ ...shop, name: e.target.value })}
        className="border p-2 block mb-3 w-96"
      />
      <label>Address</label>
      <textarea
        value={shop.address}
        onChange={(e) => setShop({ ...shop, address: e.target.value })}
        className="border p-2 block mb-3 w-96"
      />
      <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
        Save
      </button>
    </div>
  )
}
