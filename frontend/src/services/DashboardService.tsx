// services/DashboardService.ts
import axios from "axios";
import { apiUrl } from "./index";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

export type DateType = "date" | "month" | "year" | "range";
export type ViewType = "before" | "after" | "compare";
export type Treatment = "ก่อน" | "หลัง";

// --------- ชนิดข้อมูล ---------
export interface RecordItem {
  date: string;
  value: number;
  parameter: string;
  unit: string;
  treatment: Treatment | string;
  status: string;
  // optionals จาก backend ใหม่ (ถ้ามี)
  environment?: string;
  standard?: { min?: number | null; mid?: number | null; max?: number | null };
}

export interface EfficiencyItem {
  date: string;       // ISO
  parameter: string;
  efficiency: number; // เป็น % (0-100)
}

export interface AlertItem {
  month_year: string;
  parameter: string;
  average: number;
  unit: string;
  rule: string;       // "เกิน Max" | "ต่ำกว่า Min" | "เกิน Middle"
}

// meta สำหรับ dropdown
export interface MetaResp {
  environments: string[];
  parameters: Record<string, { id: number; name: string; unit: string }[]>;
}

// --------- Query params ที่ใช้ร่วมกัน ---------
export interface CommonQuery {
  env?: string;       // "น้ำเสีย" | "น้ำประปา" | "น้ำดื่ม" | "ขยะ"
  param_id?: number;  // id ในตาราง parameters
  type?: DateType;    // date|month|year|range
  date?: string;      // เมื่อ type != range (YYYY | YYYY-MM | YYYY-MM-DD)
  start?: string;     // เมื่อ type = range  (YYYY-MM-DD)
  end?: string;       // เมื่อ type = range  (YYYY-MM-DD)
}

// --------- API calls ---------

// เดิม: ดึงกราฟ (ปรับให้รองรับ env/param_id/range แต่ยังรับ view ไว้ได้)
export const GetEnvironmentalRecords = async (
  q: CommonQuery & { view?: ViewType }
) => {
  try {
    const params = new URLSearchParams();
    if (q.env) params.append("env", q.env);
    if (q.param_id != null) params.append("param_id", String(q.param_id));
    if (q.type) params.append("type", q.type);
    if (q.date) params.append("date", q.date);
    if (q.start) params.append("start", q.start);
    if (q.end) params.append("end", q.end);
    if (q.view) params.append("view", q.view);

    const res = await axios.get(
      `${apiUrl}/dashboard/environmental?${params.toString()}`,
      { headers: { "Content-Type": "application/json", ...getAuthHeader() } }
    );
    return res.status === 200 ? (res.data as RecordItem[]) : null;
  } catch (e: any) {
    console.error("Error fetching dashboard data:", e?.response?.data || e.message);
    return null;
  }
};

// เดิม: ดึงประสิทธิภาพ (เพิ่ม env/param_id/range)
export const GetEnvironmentalEfficiency = async (q: CommonQuery & { param?: string }) => {
  try {
    const params = new URLSearchParams();
    if (q.env) params.append("env", q.env);
    if (q.param_id != null) params.append("param_id", String(q.param_id));
    if (q.type) params.append("type", q.type);
    if (q.date) params.append("date", q.date);
    if (q.start) params.append("start", q.start);
    if (q.end) params.append("end", q.end);
    if ((q as any).param) params.append("param", (q as any).param); // เผื่อ backend เดิมยังรองรับชื่อ

    const res = await axios.get(
      `${apiUrl}/dashboard/environmental/efficiency?${params.toString()}`,
      { headers: { "Content-Type": "application/json", ...getAuthHeader() } }
    );
    return res.status === 200 ? (res.data as EfficiencyItem[]) : null;
  } catch (e: any) {
    console.error("Error fetching efficiency:", e?.response?.data || e.message);
    return null;
  }
};

// ✅ ใหม่: metadata (environment + parameters)
export const GetEnvironmentalMeta = async () => {
  try {
    const res = await axios.get(`${apiUrl}/dashboard/environmental/meta`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return res.status === 200 ? (res.data as MetaResp) : null;
  } catch (e: any) {
    console.error("Error fetching dashboard meta:", e?.response?.data || e.message);
    return null;
  }
};

// ✅ ใหม่: Alerts (ใช้เกณฑ์ในตารางมาตรฐาน)
export const GetEnvironmentalAlerts = async (q: CommonQuery) => {
  try {
    const params = new URLSearchParams();
    if (q.env) params.append("env", q.env);
    if (q.param_id != null) params.append("param_id", String(q.param_id));
    if (q.type) params.append("type", q.type);
    if (q.date) params.append("date", q.date);
    if (q.start) params.append("start", q.start);
    if (q.end) params.append("end", q.end);

    const res = await axios.get(
      `${apiUrl}/dashboard/environmental/alerts?${params.toString()}`,
      { headers: { "Content-Type": "application/json", ...getAuthHeader() } }
    );
    return res.status === 200 ? (res.data as AlertItem[]) : [];
  } catch (e: any) {
    console.error("Error fetching alerts:", e?.response?.data || e.message);
    return [];
  }
};
