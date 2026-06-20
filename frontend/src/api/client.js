import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Normalizes FastAPI error bodies ({"detail": "..."} or validation arrays)
// into a single readable string for the UI to display.
export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || "Something went wrong. Please try again.";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.errors)) {
    return data.errors
      .map((e) => `${(e.loc || []).slice(-1)[0]}: ${e.msg}`)
      .join(" · ");
  }
  return "Something went wrong. Please try again.";
}

export const ProductsAPI = {
  list: () => api.get("/products").then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (payload) => api.post("/products", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const CustomersAPI = {
  list: () => api.get("/customers").then((r) => r.data),
  get: (id) => api.get(`/customers/${id}`).then((r) => r.data),
  create: (payload) => api.post("/customers", payload).then((r) => r.data),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const OrdersAPI = {
  list: () => api.get("/orders").then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (payload) => api.post("/orders", payload).then((r) => r.data),
  remove: (id) => api.delete(`/orders/${id}`),
};

export const DashboardAPI = {
  summary: (threshold = 10) =>
    api.get(`/dashboard/summary?low_stock_threshold=${threshold}`).then((r) => r.data),
};
