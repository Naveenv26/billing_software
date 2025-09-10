import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        try {
          const res = await axios.post("http://localhost:8000/api/auth/token/refresh/", {
            refresh,
          });
          localStorage.setItem("token", res.data.access);
          error.config.headers["Authorization"] = `Bearer ${res.data.access}`;
          return api(error.config); // retry
        } catch (err) {
          alert("Session expired, please login again.");
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        alert("Unauthorized! Please login again.");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
