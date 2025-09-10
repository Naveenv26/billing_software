import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col justify-between">
        <div>
          <div className="px-6 py-4 border-b flex items-center space-x-2">
            <span className="text-red-600 font-bold text-lg">Billing App</span>
            <span className="text-sm text-gray-500">— Customer</span>
          </div>
          <nav className="mt-4 space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100 ${
                  isActive ? "bg-purple-100 text-purple-600 font-medium" : ""
                }`
              }
            >
              🏠 Dashboard
            </NavLink>
            <NavLink
              to="/billing"
              className={({ isActive }) =>
                `flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100 ${
                  isActive ? "bg-purple-100 text-purple-600 font-medium" : ""
                }`
              }
            >
              🧾 Billing
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100 ${
                  isActive ? "bg-purple-100 text-purple-600 font-medium" : ""
                }`
              }
            >
              📊 Reports
            </NavLink>
            <NavLink
              to="/stock"
              className={({ isActive }) =>
                `flex items-center px-6 py-2 text-gray-700 hover:bg-gray-100 ${
                  isActive ? "bg-purple-100 text-purple-600 font-medium" : ""
                }`
              }
            >
              📦 Stock
            </NavLink>
          </nav>
        </div>
        <div className="px-6 py-4 border-t text-xs text-gray-400">
          © 2025 Sparkzen Billing
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow px-6 py-3 flex justify-end items-center">
          <button
            onClick={logout}
            className="text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
