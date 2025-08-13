// services/DashboardService.ts
import axios from "axios";
import { apiUrl } from "./index";
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};
export interface RecordItem {
  date: string;
  value: number;
  parameter: string;
  unit: string;
  treatment: string;
  status: string;
}

// === ใหม่: โครงสร้างผลลัพธ์ประสิทธิภาพ ===
export interface EfficiencyItem {
  date: string;        // ISO string
  parameter: string;
  efficiency: number;  // ตามสูตร (before-after)/(before*100)
}

type DateType = "date" | "month" | "year";
type ViewType = "before" | "after" | "compare";

// ของเดิม
interface GetEnvParams {
  date?: string;
  type?: DateType;
  view: ViewType;
}

export const GetEnvironmentalRecords = async ({ date, type, view }: GetEnvParams) => {
  try {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (date && type) params.append("type", type);
    params.append("view", view);

    const res = await axios.get(`${apiUrl}/dashboard/environmental?${params.toString()}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return res.status === 200 ? res.data as RecordItem[] : null;
  } catch (e:any) {
    console.error("Error fetching dashboard data:", e?.response?.data || e.message);
    return null;
  }
};

// === ใหม่: ดึงประสิทธิภาพ ===
interface GetEfficiencyParams {
  date?: string;
  type?: DateType;
  param?: string; // optional เผื่อกรองที่ backend
}

export const GetEnvironmentalEfficiency = async ({ date, type, param }: GetEfficiencyParams) => {
  try {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (date && type) params.append("type", type);
    if (param) params.append("param", param);

    const res = await axios.get(`${apiUrl}/dashboard/environmental/efficiency?${params.toString()}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return res.status === 200 ? res.data as EfficiencyItem[] : null;
  } catch (e:any) {
    console.error("Error fetching efficiency:", e?.response?.data || e.message);
    return null;
  }
};
