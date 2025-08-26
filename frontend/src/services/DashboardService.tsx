// services/DashboardService.ts
import axios from "axios";
import { apiUrl } from "./index";

/* ============================================================
   Auth header
   ============================================================ */
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type");
  return { Authorization: `${tokenType} ${token}` };
};

/* ============================================================
   Shared types
   ============================================================ */
export type DateType = "date" | "month" | "year" | "range";
export type ViewType = "before" | "after" | "compare";
export type Treatment = "ก่อน" | "หลัง";

/* --------- Main record types --------- */
export interface RecordItem {
  date: string;
  value: number;
  parameter: string;
  unit: string;
  treatment: Treatment | string;
  status: string;
  environment?: string;
  standard?: { min?: number | null; mid?: number | null; max?: number | null };
}

export interface EfficiencyItem {
  date: string;       // ISO
  parameter: string;
  efficiency: number; // % 0-100
}

export interface AlertItem {
  month_year: string;
  parameter: string;
  average: number;
  unit: string;
  rule: string; // "เกิน Max" | "ต่ำกว่า Min" | "เกิน Middle"
}

/* --------- Meta for dropdowns --------- */
export interface MetaResp {
  environments: string[];
  parameters: Record<string, { id: number; name: string; unit: string }[]>;
}

/* --------- Common Query --------- */
export interface CommonQuery {
  env?: string;       // "น้ำเสีย" | "น้ำประปา" | "น้ำดื่ม" | "ขยะ"
  param_id?: number;  // parameters.id
  type?: DateType;    // date|month|year|range
  date?: string;      // เมื่อ type != range
  start?: string;     // เมื่อ type = range
  end?: string;       // เมื่อ type = range
}

/* ============================================================
   Environmental APIs
   ============================================================ */
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

export const GetEnvironmentalEfficiency = async (
  q: CommonQuery & { param?: string }
) => {
  try {
    const params = new URLSearchParams();
    if (q.env) params.append("env", q.env);
    if (q.param_id != null) params.append("param_id", String(q.param_id));
    if (q.type) params.append("type", q.type);
    if (q.date) params.append("date", q.date);
    if (q.start) params.append("start", q.start);
    if (q.end) params.append("end", q.end);
    if ((q as any).param) params.append("param", (q as any).param);

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

/* ============================================================
   WASTE (ใหม่)
   ============================================================ */

/** สัดส่วนขยะ 5 ประเภท (ใช้ในกราฟวงกลม) */
export interface WasteMixItem {
  parameter: string; // ชื่อประเภทขยะ
  total: number;     // ปริมาณรวม
  unit: string;      // หน่วย (เช่น kg)
  percent?: number;  // ถ้ามี
}

export interface WasteMixQuery {
  type?: DateType;  // date|month|year|range
  date?: string;    // เมื่อ type !== 'range'
  start?: string;   // เมื่อ type = 'range'
  end?: string;     // เมื่อ type = 'range'
}

// ใหม่: ใช้กับโหมด month (เลือกเดือนเดียว)
export async function GetWasteMixByMonth(month: string): Promise<WasteMixItem[]> {
  try {
    const res = await axios.get(`${apiUrl}/waste-mix/month?month=${month}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Error fetching waste mix by month:", err);
    return [];
  }
}

/** จุดข้อมูลรายได้รีไซเคิล (ใช้ในกราฟเส้น/แท่ง) */
export interface RecycledRevenuePoint {
  period: string;     // label เวลา (เช่น "2025-01" หรือ "ม.ค. 2568")
  total_sale: number; // บาท
}

export const GetRecycledRevenue = async (q?: {
  type?: "range" | "month" | "year" | "date";
  start?: string;  // YYYY-MM-DD (เมื่อ type=range)
  end?: string;    // YYYY-MM-DD (เมื่อ type=range)
  date?: string;   // เมื่อ type !== range
  group?: "day" | "month" | "year";
}) => {
  try {
    const params = new URLSearchParams();
    if (q?.type) params.append("type", q.type);
    if (q?.start) params.append("start", q.start);
    if (q?.end) params.append("end", q.end);
    if (q?.date) params.append("date", q.date);
    if (q?.group) params.append("group", q.group);

    // ⬇️ หาก backend คุณใช้ path อื่น ให้แก้ตรงนี้ให้ตรง
    const res = await axios.get(`${apiUrl}/recycled/revenue?${params.toString()}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });

    // รองรับหลายทรงผลลัพธ์
    const payload = res.data;
    let rows: any[] = [];

    if (Array.isArray(payload)) {
      rows = payload;
    } else if (Array.isArray(payload?.data)) {
      rows = payload.data;
    } else if (Array.isArray(payload?.points)) {
      // บาง backend ส่ง { points:[{month,total}], grand_total, ... }
      rows = payload.points.map((p: any) => ({
        period: p.period ?? p.month ?? p.label,
        total_sale: p.total_sale ?? p.total,
      }));
    }

    return (rows || []).map((r: any) => ({
      period: String(r.period ?? r.month ?? r.label ?? ""),
      total_sale: Number(r.total_sale ?? r.total ?? 0),
    })) as RecycledRevenuePoint[];
  } catch (e: any) {
    console.error("Error fetching recycled revenue:", e?.response?.data || e.message);
    return [] as RecycledRevenuePoint[];
  }
};
export async function GetWasteMix(q: WasteMixQuery): Promise<WasteMixItem[]> {
  try {
    const params = new URLSearchParams();
    if (q.type)  params.append("type", q.type);
    if (q.date)  params.append("date", q.date);
    if (q.start) params.append("start", q.start);
    if (q.end)   params.append("end", q.end);

    // ปรับ path ให้ตรงกับ backend ของคุณถ้าใช้คนละเส้นทาง
    const res = await axios.get(`${apiUrl}/waste-mix?${params.toString()}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });

    const payload = res.data;
    if (Array.isArray(payload)) return payload as WasteMixItem[];
    if (Array.isArray(payload?.data)) return payload.data as WasteMixItem[];
    return [];
  } catch (e: any) {
    console.error("Error fetching waste mix:", e?.response?.data || e.message);
    return [];
  }
}
