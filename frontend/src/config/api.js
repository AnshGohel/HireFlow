const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://hireflow-coral.vercel.app/api/v1"
    : "http://localhost:4000/api/v1");

export const API_URL = rawApiUrl.replace(/\/+$/, "");
