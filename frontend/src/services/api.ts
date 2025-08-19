// src/services/api.ts
import axios, { AxiosError } from "axios";
import { apiUrl } from "./index";

// ===== Auth Helpers =====
export const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("token")?.trim();
  // บังคับใช้ Bearer เสมอ ป้องกันเคส 'bearer' ตัวเล็ก
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ===== Axios Instance =====
export const api = axios.create({ baseURL: apiUrl });

// แนบ header อัตโนมัติในทุก request (แต่ไม่เขียนทับถ้ามีมาแล้ว)
api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {};

  // อย่าไปทับ Authorization ถ้าผู้เรียกใส่มาเองแล้ว
  const hasAuth = !!(config.headers as any).Authorization;

  // ใส่ Content-Type อัตโนมัติ (ยกเว้น FormData)
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;
  if (!isFormData && !(config.headers as any)["Content-Type"]) {
    (config.headers as any)["Content-Type"] = "application/json";
  }

  if (!hasAuth && !(config as any).skipAuth) {
    const auth = getAuthHeader();
    if (auth.Authorization) {
      (config.headers as any).Authorization = auth.Authorization;
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    if (err.response?.status === 401) {
      // จะรีไดเร็กต์ไป login หรือเคลียร์ token ก็เพิ่มตรงนี้ได้
    }
    return Promise.reject(err);
  }
);

export { apiUrl } from "./index";
export default api;
