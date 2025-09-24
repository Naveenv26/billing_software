import axios from "axios";

const API_BASE = "http://localhost:8000/api";

// Login user
export async function login(username, password) {
  const res = await axios.post(`${API_BASE}/token/`, { username, password });
  if (res.data.access) {
    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);
  }
  return res.data;
}

// Logout user
export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
}

// Refresh access token
export async function refreshToken() {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  try {
    const res = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
    localStorage.setItem("access_token", res.data.access);
    return res.data.access;
  } catch (err) {
    logout();
    return null;
  }
}
