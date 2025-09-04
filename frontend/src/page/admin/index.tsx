// src/page/admin/AdminDashboard.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Row,
  Col,
  Select,
  DatePicker,
  Modal,
  ColorPicker,
  Button,
  Card,
  Segmented,
  Table,
  Empty,
} from "antd";
import type { Color } from "antd/es/color-picker";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import th_TH from "antd/es/date-picker/locale/th_TH";
import ApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Maximize2 } from "lucide-react";
import { fetchPrediction } from "../../services/predict";
import type { PredictionOutput } from "../../interface/IPredict";

// ===== services =====
import {
  GetEnvironmentalRecords,
  GetEnvironmentalEfficiency,
  GetEnvironmentalMeta,
  type RecordItem,
  type EfficiencyItem,
  GetWasteMixByMonth,
  GetWasteMix,
  type WasteMixItem,
} from "../../services/DashboardService";

// ✅ แจ้งเตือนกระดิ่ง
import { GetAlertSoftware } from "../../services/index";

// ✅ ใช้สรุปโดนัทรีไซเคิลทั้งปีล่าสุด
import { GetlistRecycled } from "../../services/garbageServices/recycledWaste";

// ===== CSS =====
import "./dashboard.css";
import "./skydash-override.css";

// ===== dayjs thai =====
import "dayjs/locale/th";
dayjs.locale("th");


/* =========================================================================
   TYPES
   ========================================================================= */
interface ParamMeta {
  id: number;
  name: string;
  unit: string;
  std_min?: number | null;
  std_middle?: number | null;
  std_max?: number | null;
}
interface EnvMeta {
  id: number;
  name: string;
  params: ParamMeta[];
}

type ViewType = "before" | "after" | "compare";
type FilterMode = "dateRange" | "month" | "year";
type StandardMode = "none" | "middle" | "range";

// แจ้งเตือนจากกระดิ่ง
type BellAlert = { type: "environmental" | "garbage"; data: any };

/* =========================================================================
   HELPERS
   ========================================================================= */

const keyFromDate = (iso: string, mode: FilterMode) => {
  const d = dayjs(iso);
  if (mode === "year") return d.startOf("month").format("YYYY-MM");
  return d.format("YYYY-MM-DD");
};

const labelFromKey = (key: string, mode: FilterMode) => {
  if (mode === "year") {
    return dayjs(key + "-01").toDate().toLocaleDateString("th-TH", {
      month: "short",
      year: "numeric",
    });
  }
  return dayjs(key).toDate().toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const createDateRangeKeys = (start: Dayjs, end: Dayjs, mode: FilterMode): string[] => {
  const keys: string[] = [];
  if (mode === "dateRange") {
    let cur = start.startOf("day");
    const last = end.endOf("day");
    while (cur.isBefore(last) || cur.isSame(last)) {
      keys.push(cur.format("YYYY-MM-DD"));
      cur = cur.add(1, "day");
    }
  } else {
    let cur = start.startOf("month");
    const last = end.endOf("month");
    while (cur.isBefore(last) || cur.isSame(last)) {
      keys.push(cur.format("YYYY-MM"));
      cur = cur.add(1, "month");
    }
  }
  return keys;
};

function dFix(n: any) {
  const f = Number(n);
  if (!Number.isFinite(f)) return 0;
  return +f.toFixed(3);
}

const norm = (s: string) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();

const getDefaultRangeFromLatest = (mode: FilterMode, latest: Dayjs | null): [Dayjs, Dayjs] => {
  // ใช้วันที่ล่าสุดที่ "มีข้อมูลจริง" เป็นฐาน (ถ้าไม่มีให้ใช้วันนี้)
  const base = latest && latest.isValid() ? latest : dayjs();

  if (mode === "year") {
    // ✅ rolling 12 months จากข้อมูลล่าสุด
    // เช่น latest = 2024-11-15  => 2023-12-01 ... 2024-11-30
    const start = base.subtract(11, "month").startOf("month");
    const end   = base.endOf("month");
    return [start, end];
  }

  if (mode === "month") {
    return [base.startOf("month"), base.endOf("month")];
  }

  // dateRange: ย้อนหลัง 7 วัน
  return [base.subtract(6, "day").startOf("day"), base.endOf("day")];
};

const getLatestDayjsFromRecords = (records: any[], field: string): Dayjs | null => {
  if (!records?.length) return null;
  const valid = records
    .map((r) => dayjs(r?.[field]))
    .filter((d) => d.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf());
  return valid.length ? valid[valid.length - 1] : null;
};

// helper แจ้งเตือน
const getEnvName = (a: BellAlert) => a?.data?.Environment?.EnvironmentName ?? "-";
const getParamName = (a: BellAlert) => a?.data?.Parameter?.ParameterName ?? "-";
const getStatusName = (a: BellAlert) => a?.data?.Status?.StatusName ?? "-";
const getUnitName = (a: BellAlert) => a?.data?.Unit?.UnitName ?? "-";
const getValue     = (a: BellAlert) => a?.data?.Data ?? a?.data?.Quantity ?? 0;

/* =========================================================================
   MAIN
   ========================================================================= */
const AdminDashboard: React.FC = () => {
  // meta
  const [metas, setMetas] = useState<EnvMeta[]>([]);
  const [, setMetaLoading] = useState<boolean>(false);
  const [, setMetaError] = useState<string | null>(null);

  // selected
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [selectedParamId, setSelectedParamId] = useState<number | null>(null);

  // data (น้ำ)
  const [rawData, setRawData] = useState<RecordItem[]>([]);
  const [, setEfficiency] = useState<EfficiencyItem[] | null>(null);
  const [, setDataLoading] = useState<boolean>(false);
  const [, setDataError] = useState<string | null>(null);

  // UI
  const [view, setView] = useState<ViewType>("compare");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [showModal, setShowModal] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // filters
  const [filterMode, setFilterMode] = useState<FilterMode>("year");
  const [dateRange, setDateRange] = useState<Dayjs[] | null>([
    dayjs().startOf("year"),
    dayjs().endOf("year"),
  ]);
  const [autoRange, setAutoRange] = useState<boolean>(true); // ⭐ changed: โหมดช่วงเวลาอัตโนมัติ

  // ล่าสุดของกราฟหลัก
  const [latestGraphDate, setLatestGraphDate] = useState<Dayjs | null>(null);

  // colors
  const [chartColor, setChartColor] = useState({
    before: "#00C2C7",
    after: "#33E944", // single-series (น้ำดื่ม/ประปา)
    compareBefore: "#00C2C7",
    compareAfter: "#7B61FF",
    efficiency: "#faad14",
    garbage: "#3367e9ff",
    tapMin: "#2abdbf",   // ✅ เพิ่มสำหรับกราฟต่ำสุด/สูงสุด (น้ำประปา)
    tapMax: "#1a4b57",   // ✅ เพิ่มสำหรับกราฟต่ำสุด/สูงสุด (น้ำประปา)
  });

  // prediction
  const [predictionData, setPredictionData] = useState<PredictionOutput | null>(null);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // ขยะ
  const [wasteMix, setWasteMix] = useState<WasteMixItem[]>([]);
  const [wasteLoading, setWasteLoading] = useState<boolean>(false);
  const [wasteError, setWasteError] = useState<string | null>(null);
  const [wasteMonth, setWasteMonth] = useState<Dayjs | null>(null);

  // ซีรีส์ขยะรายประเภท
  const [garbageSeries, setGarbageSeries] = useState<Array<{ x: string; y: number }>>([]);
  const [garbageLoading, setGarbageLoading] = useState<boolean>(false);
  const [garbageError, setGarbageError] = useState<string | null>(null);

  // แจ้งเตือน
  const [bellAlerts, setBellAlerts] = useState<BellAlert[]>([]);
  const [bellLoading, setBellLoading] = useState<boolean>(false);
  const [bellError, setBellError] = useState<string | null>(null);

  // การ์ดโดนัทรีไซเคิล (ยอดขาย)
  const [donutMonths, setDonutMonths] = useState<string[]>([]);
  const [donutSeries, setDonutSeries] = useState<number[]>([]);
  const [donutYearThai, setDonutYearThai] = useState<number | null>(null);
  const [totalSaleYear, setTotalSaleYear] = useState<number>(0);
  const [lastRecordDate, setLastRecordDate] = useState<string>("");

  // ⭐️ การ์ดโดนัทใหม่: "จำนวนคนเข้าใช้บริการรวมปี"
  const [qtyMonths, setQtyMonths] = useState<string[]>([]);
  const [qtySeries, setQtySeries] = useState<number[]>([]);
  const [totalQtyYear, setTotalQtyYear] = useState<number>(0);

  /* ======================= LOAD META ======================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setMetaLoading(true);
        setMetaError(null);
        const m = await GetEnvironmentalMeta();
        if (!mounted) return;
        if (Array.isArray(m) && m.length > 0) {
          setMetas(m);
          setSelectedEnvId((prev) => prev ?? m[0]?.id ?? null);
          const firstParams = m[0]?.params ?? [];
          if (firstParams.length > 0) {
            setSelectedParamId((prev) => prev ?? firstParams[0].id ?? null);
          }
        } else {
          setMetas([]);
        }
      } catch (e: any) {
        if (!mounted) return;
        setMetaError(e?.message || "โหลดเมตาไม่สำเร็จ");
      } finally {
        if (!mounted) return;
        setMetaLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* ======================= โหลดแจ้งเตือน (4 ล่าสุด) ======================= */
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setBellLoading(true);
        setBellError(null);
        const raw = (await GetAlertSoftware()) ?? [];
        const filtered = raw.filter((r: BellAlert) =>
          getStatusName(r) === "ไม่ผ่านเกณฑ์มาตรฐาน" &&
          (r.type === "garbage" || r?.data?.BeforeAfterTreatment?.TreatmentName === "หลัง")
        );
        const sorted = filtered.sort(
          (a: BellAlert, b: BellAlert) =>
            new Date(b?.data?.Date).getTime() - new Date(a?.data?.Date).getTime()
        );
        if (!cancel) setBellAlerts(sorted.slice(0, 4));
      } catch (e: any) {
        if (!cancel) {
          setBellAlerts([]);
          setBellError(e?.message || "โหลดการแจ้งเตือนล้มเหลว");
        }
      } finally {
        if (!cancel) setBellLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  /* ======================= LOAD DATA (น้ำ) ======================= */
  const loadData = useCallback(async () => {
    try {
      setDataLoading(true);
      setDataError(null);
      const rec = await GetEnvironmentalRecords({ date: undefined, type: undefined, view: "compare" });
      setRawData(rec ?? []);
      const eff = await GetEnvironmentalEfficiency({ date: undefined, type: undefined, param: undefined });
      setEfficiency(eff ?? null);
    } catch (err: any) {
      setDataError(err?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setDataLoading(false);
    }
  }, []);
  useEffect(() => { (async () => { await loadData(); })(); }, [loadData]);

  /* ======================= PREDICTION ======================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPredictionLoading(true);
        setPredictionError(null);
        const d = await fetchPrediction();
        if (!mounted) return;
        setPredictionData(d);
      } catch (err: any) {
        if (!mounted) return;
        setPredictionError(err?.message || "คำนวณค่าทำนายไม่สำเร็จ");
      } finally {
        if (!mounted) return;
        setPredictionLoading(false);
      }
    })();
    return () => { mounted = true; };
  }, []);

  /* ======================= DONUT รีไซเคิล ปีล่าสุด ======================= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await GetlistRecycled();
        const rows = resp?.data ?? [];
        if (!rows.length) {
          if (mounted) {
            setDonutMonths([]); setDonutSeries([]);
            setDonutYearThai(null); setTotalSaleYear(0); setLastRecordDate("");

            // reset การ์ด "จำนวนคน"
            setQtyMonths([]); setQtySeries([]); setTotalQtyYear(0);
          }
          return;
        }
        const sorted = [...rows].sort((a: any, b: any) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        const last = sorted[sorted.length - 1];
        const lastD = new Date(last.Date);

        const latestYear = sorted.reduce((y: number, r: any) => Math.max(y, new Date(r.Date).getFullYear()), 0);
        const inLatestYear = rows.filter((r: any) => new Date(r.Date).getFullYear() === latestYear);

        // ยอดขายรวมของปีล่าสุด
        const totalSale = inLatestYear.reduce((s: number, r: any) => s + Number(r.TotalSale || 0), 0);

        // จำนวนคนรวมของปีล่าสุด
        const totalQty = inLatestYear.reduce((s: number, r: any) => s + Number(r.Quantity || 0), 0);

        const monthShortTH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

        // map เดือน -> totalSale
        const saleMonthMap: Record<string, number> = {};
        inLatestYear.forEach((r: any) => {
          const d = new Date(r.Date);
          const key = monthShortTH[d.getMonth()];
          saleMonthMap[key] = (saleMonthMap[key] || 0) + Number(r.TotalSale || 0);
        });
        const saleMonthsOrdered = monthShortTH.filter(m => m in saleMonthMap);
        const saleSeriesOrdered = saleMonthsOrdered.map(m => saleMonthMap[m]);

        // map เดือน -> Quantity
        const qtyMonthMap: Record<string, number> = {};
        inLatestYear.forEach((r: any) => {
          const d = new Date(r.Date);
          const key = monthShortTH[d.getMonth()];
          qtyMonthMap[key] = (qtyMonthMap[key] || 0) + Number(r.Quantity || 0);
        });
        const qtyMonthsOrdered = monthShortTH.filter(m => m in qtyMonthMap);
        const qtySeriesOrdered = qtyMonthsOrdered.map(m => qtyMonthMap[m]);

        if (!mounted) return;
        // set ยอดขาย
        setDonutMonths(saleMonthsOrdered);
        setDonutSeries(saleSeriesOrdered);
        setDonutYearThai(latestYear + 543);
        setTotalSaleYear(totalSale);
        setLastRecordDate(lastD.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));

        // set จำนวนคน
        setQtyMonths(qtyMonthsOrdered);
        setQtySeries(qtySeriesOrdered);
        setTotalQtyYear(totalQty);
      } catch {
        if (!mounted) return;
        setDonutMonths([]); setDonutSeries([]); setDonutYearThai(null); setTotalSaleYear(0); setLastRecordDate("");
        setQtyMonths([]); setQtySeries([]); setTotalQtyYear(0);
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* ======================= WASTE MIX ======================= */
  const reloadWaste = useCallback(async () => {
    try {
      setWasteLoading(true);
      setWasteError(null);
      if (wasteMonth) {
        const m1 = wasteMonth.format("YYYY-MM");
        let wm = await GetWasteMixByMonth(m1);
        if (!Array.isArray(wm) || wm.length === 0) {
          const m2 = wasteMonth.format("YYYY-MM-01");
          wm = await GetWasteMixByMonth(m2);
        }
        setWasteMix(Array.isArray(wm) ? wm : []);
      } else if (dateRange?.[0] && dateRange?.[1]) {
        const start = dateRange[0].startOf("day").format("YYYY-MM-DD");
        const end = dateRange[1].endOf("day").format("YYYY-MM-DD");
        const wm = await GetWasteMix({ type: "range", start, end });
        setWasteMix(Array.isArray(wm) ? wm : []);
      } else {
        setWasteMix([]);
      }
    } catch (e: any) {
      setWasteMix([]); setWasteError(e?.message || "โหลดสัดส่วนขยะไม่สำเร็จ");
    } finally {
      setWasteLoading(false);
    }
  }, [dateRange, wasteMonth]);
  useEffect(() => { reloadWaste(); }, [reloadWaste, wasteMonth]);

  // ✅ ตั้ง wasteMonth เป็น “เดือนล่าสุดที่มีข้อมูล” อัตโนมัติ
  useEffect(() => {
    let cancelled = false;
    const ensureLatestWasteMonth = async () => {
      if (wasteMonth) return;
      const base = dayjs(); // ไล่ย้อนหลังไม่เกิน 12 เดือน
      for (let i = 0; i < 12; i++) {
        const probe = base.subtract(i, "month").startOf("month");
        const mStr = probe.format("YYYY-MM");
        try {
          let wm = await GetWasteMixByMonth(mStr);
          if (!Array.isArray(wm) || wm.length === 0) {
            wm = await GetWasteMixByMonth(probe.format("YYYY-MM-01"));
          }
          if (!cancelled && Array.isArray(wm) && wm.length > 0) {
            setWasteMonth(probe);
            return;
          }
        } catch { /* ข้ามเดือนที่ error */ }
      }
      if (!cancelled) setWasteMonth(base.startOf("month")); // fallback
    };
    ensureLatestWasteMonth();
    return () => { cancelled = true; };
  }, [wasteMonth]);

  /* ======================= DERIVED META ======================= */
  const selectedEnv = useMemo(() => metas.find((e) => e.id === selectedEnvId) || null, [metas, selectedEnvId]);

  const globalParamMeta = useMemo(() => {
    const env = metas.find((e) => e.id === selectedEnvId);
    return env?.params.find((p) => p.id === selectedParamId) || null;
  }, [metas, selectedEnvId, selectedParamId]);

  const paramList = useMemo(() => {
    const list = selectedEnv?.params ?? [];
    return Array.from(
      new Map(list.map((p) => [ (p.name || "").replace(/\s+/g, " ").trim().toLowerCase(), p ])).values()
    );
  }, [selectedEnv]);

  const selectedParamMeta = useMemo(() => paramList.find((p) => p.id === selectedParamId) || null, [paramList, selectedParamId]);

  const envName = (selectedEnv?.name || "").trim();
  const isGarbage = envName === "ขยะ";
  const SINGLE_ENV_NAMES = new Set(["น้ำดื่ม", "น้ำประปา", "น้ำปะปา", "ประปา"]);
  const isSingleEnv = SINGLE_ENV_NAMES.has(envName);
  const isWastewater = !isGarbage && !isSingleEnv;

  const selectedParamName = globalParamMeta?.name ?? selectedParamMeta?.name ?? "";
  const selectedParamUnit = globalParamMeta?.unit ?? selectedParamMeta?.unit ?? "";

  // ✅ มาตรฐาน: แสดงสำหรับ "ทุกน้ำ" (ยกเว้นขยะ)
  const stdMin    = !isGarbage ? (globalParamMeta?.std_min ?? selectedParamMeta?.std_min ?? -1) : -1;
  const stdMiddle = !isGarbage ? (globalParamMeta?.std_middle ?? selectedParamMeta?.std_middle ?? -1) : -1;
  const stdMax    = !isGarbage ? (globalParamMeta?.std_max ?? selectedParamMeta?.std_max ?? -1) : -1;
  const hasVal = (v: any) => {
    const n = Number(v);
    return v !== null && v !== undefined && !Number.isNaN(n) && n !== -1;
  };
  const { stdMode, stdLow, stdHigh, stdMid } = useMemo(() => {
    if (isGarbage) return { stdMode: "none" as StandardMode, stdLow: 0, stdHigh: 0, stdMid: 0 };
    if (hasVal(stdMiddle)) {
      return { stdMode: "middle" as StandardMode, stdLow: 0, stdHigh: 0, stdMid: Number(stdMiddle) };
    }
    const hasLow  = hasVal(stdMin);
    const hasHigh = hasVal(stdMax);
    if (hasLow || hasHigh) {
      return {
        stdMode: "range" as StandardMode,
        stdLow: hasLow ? Number(stdMin) : 0,
        stdHigh: hasHigh ? Number(stdMax) : 0,
        stdMid: 0,
      };
    }
    return { stdMode: "none" as StandardMode, stdLow: 0, stdHigh: 0, stdMid: 0 };
  }, [isGarbage, stdMin, stdMiddle, stdMax]);

  /* ======================= FILTERED DATA (น้ำ) ======================= */
  const filteredData = useMemo(() => {
    let base = rawData;
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      const st = start?.toDate?.() ?? new Date();
      const en = end?.toDate?.() ?? new Date();
      base = (rawData || []).filter((d) => {
        const dd = new Date(d.date);
        return dd >= st && dd <= en;
      });
    }
    const envNameLower = envName.toLowerCase();
    if (envNameLower && envNameLower !== "ขยะ") {
      base = base.filter((d) => (d.environment || "").trim().toLowerCase() === envNameLower);
    }
    const paramName = (selectedParamName || "").trim().toLowerCase();
    if (paramName && envNameLower !== "ขยะ") {
      base = base.filter((d) => (d.parameter || "").trim().toLowerCase() === paramName);
    }
    return base;
  }, [rawData, dateRange, envName, selectedParamName]);

  const scopeForLatest = useMemo(() => {
    const envLower = envName.toLowerCase();
    const paramLower = (selectedParamName || "").trim().toLowerCase();
    if (envLower === "ขยะ") {
      return (rawData || []).filter((d) => (d.environment || "").trim().toLowerCase() === envLower);
    }
    return (rawData || []).filter(
      (d) =>
        (d.environment || "").trim().toLowerCase() === envLower &&
        (d.parameter || "").trim().toLowerCase() === paramLower
    );
  }, [rawData, envName, selectedParamName]);

  useEffect(() => {
    const latest = getLatestDayjsFromRecords(scopeForLatest, "date");
    setLatestGraphDate(latest);
  }, [scopeForLatest]);

  useEffect(() => {
    if (isGarbage) { setView("after"); return; }
    if (isSingleEnv) { setView("after"); return; }
    const hasBefore = (filteredData || []).some((d) => d.treatment === "ก่อน");
    const hasAfter = (filteredData || []).some((d) => d.treatment === "หลัง");
    if (hasBefore && hasAfter) setView("compare");
    else if (hasAfter) setView("after");
    else if (hasBefore) setView("before");
  }, [isGarbage, isSingleEnv, selectedEnvId, selectedParamId, filteredData]);

  // ⭐ changed: ซิงก์ช่วงเวลาใหม่ทุกครั้งที่ latestGraphDate หรือโหมดเปลี่ยน (ถ้ายังอยู่โหมดอัตโนมัติ)
  useEffect(() => {
    if (!autoRange) return;
    const def = getDefaultRangeFromLatest(filterMode, latestGraphDate);
    setDateRange(def);
  }, [latestGraphDate, filterMode, autoRange]);

  /* ======================= LABELS/KEYS (น้ำ) ======================= */
  const { labelsKeys, labels } = useMemo(() => {
    if (isGarbage) return { labelsKeys: [], labels: [] };
    const filtered = (filteredData || []).filter((d) => d.parameter === selectedParamName);
    const grouped: Record<string, true> = {};
    filtered.forEach((d) => { grouped[keyFromDate(d.date, filterMode)] = true; });
    let allDates: string[] = [];
    if (dateRange) {
      if (filterMode === "year") {
        const startYear = dateRange[0].year();
        const endYear = dateRange[1].year();
        allDates = Object.keys(grouped).filter((m) => {
          const y = dayjs(m + "-01").year();
          return y >= startYear && y <= endYear;
        }).sort();
      } else if (filterMode === "month") {
        allDates = createDateRangeKeys(dateRange[0].startOf("month"), dateRange[1].endOf("month"), "dateRange");
      } else {
        allDates = createDateRangeKeys(dateRange[0], dateRange[1], "dateRange");
      }
    }
    const niceLabels = allDates.map((k) => labelFromKey(k, filterMode));
    return { labelsKeys: allDates, labels: niceLabels };
  }, [filteredData, selectedParamName, filterMode, dateRange, isGarbage]);

  /* ======================= SERIES ======================= */
  const makeSeries = useCallback(
    (treatment: "ก่อน" | "หลัง") => {
      const tdata = filteredData.filter((d) => d.parameter === selectedParamName && d.treatment === treatment);
      const buckets: Record<string, number[]> = {};
      tdata.forEach((d) => {
        const k = keyFromDate(d.date, filterMode);
        if (!buckets[k]) buckets[k] = [];
        buckets[k].push(Number(dFix(d.value)));
      });
      return labelsKeys.map((k, i) => {
        const vals = buckets[k];
        const avg = vals && vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return { x: labels[i], y: avg };
      });
    },
    [filteredData, selectedParamName, filterMode, labelsKeys, labels]
  );

  // single-series (น้ำดื่ม/ประปา)
  const singleSeriesPoints = useMemo(() => {
    if (!isSingleEnv) return [];
    const tdata = filteredData.filter((d) => d.parameter === selectedParamName);
    const buckets: Record<string, number[]> = {};
    tdata.forEach((d) => {
      const k = keyFromDate(d.date, filterMode);
      if (!buckets[k]) buckets[k] = [];
      buckets[k].push(Number(dFix(d.value)));
    });
    return labelsKeys.map((k, i) => {
      const vals = buckets[k];
      const avg = vals && vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { x: labels[i], y: avg };
    });
  }, [isSingleEnv, filteredData, selectedParamName, filterMode, labelsKeys, labels]);

  // ✅ น้ำประปา/น้ำดื่ม: ค่าสูงสุด/ต่ำสุด (ต่อช่วง)
  const tapMinMaxPoints = useMemo(() => {
    if (!isSingleEnv) return [] as Array<{ x: string; min: number; max: number }>;

    const tdata = filteredData.filter((d) => d.parameter === selectedParamName);
    const buckets: Record<string, number[]> = {};

    tdata.forEach((d) => {
      const k = keyFromDate(d.date, filterMode);
      (buckets[k] ||= []).push(Number(dFix(d.value)));
    });

    return labelsKeys.map((k, i) => {
      const arr = buckets[k] || [];
      const min = arr.length ? Math.min(...arr) : 0;
      const max = arr.length ? Math.max(...arr) : 0;
      return { x: labels[i], min, max };
    });
  }, [isSingleEnv, filteredData, selectedParamName, filterMode, labelsKeys, labels]);

  const tapMinMaxSeries = useMemo(
    () => ([
      { name: "ค่าสูงสุด", data: tapMinMaxPoints.map(p => ({ x: p.x, y: p.max })), color: chartColor.tapMax },
      { name: "ค่าต่ำสุด", data: tapMinMaxPoints.map(p => ({ x: p.x, y: p.min })), color: chartColor.tapMin },
    ]),
    [tapMinMaxPoints, chartColor.tapMax, chartColor.tapMin]
  );

  const tapMinMaxYMax = useMemo(
    () => tapMinMaxPoints.reduce((m, p) => Math.max(m, Number(p.max || 0)), 0),
    [tapMinMaxPoints]
  );

  const beforeSeriesPoints = useMemo(() => makeSeries("ก่อน"), [makeSeries]);
  const afterSeriesPoints = useMemo(() => makeSeries("หลัง"), [makeSeries]);

  const getMaxY = (pts: Array<{ x: any; y: number }>) =>
    pts.reduce((m, p) => Math.max(m, Number(p?.y || 0)), 0);

  /* ======================= ขยะรายประเภท ======================= */
  const monthKeysForGarbage = useMemo(() => {
    const [start, end] = (dateRange && dateRange.length === 2)
      ? [dateRange[0].startOf("month"), dateRange[1].endOf("month")]
      : getDefaultRangeFromLatest(filterMode, latestGraphDate);
    const s = (Array.isArray(start) ? start[0] : start).startOf("month");
    const e = (Array.isArray(end) ? end[1] : end).endOf("month");
    const arr: string[] = [];
    let cur = s.clone();
    while (cur.isSame(e) || cur.isBefore(e)) { arr.push(cur.format("YYYY-MM")); cur = cur.add(1, "month"); }
    return arr;
  }, [dateRange, filterMode, latestGraphDate]);

  useEffect(() => {
    const run = async () => {
      if (!isGarbage || !selectedParamName) { setGarbageSeries([]); setGarbageError(null); return; }
      const keys = monthKeysForGarbage.length > 0 ? monthKeysForGarbage : [dayjs().format("YYYY-MM")];
      try {
        setGarbageLoading(true); setGarbageError(null);
        const results = await Promise.all(keys.map((m) => GetWasteMixByMonth(m)));
        const points: Array<{ x: string; y: number }> = [];
        results.forEach((items, idx) => {
          const month = keys[idx];
          const label = dayjs(month + "-01").format("MMM YYYY");
          const rec = (items || []).find((it) => norm(it.parameter) === norm(selectedParamName));
          const y = rec ? Number(dFix(rec.total || 0)) : 0;
          points.push({ x: label, y });
        });
        setGarbageSeries(points);
      } catch (e: any) {
        setGarbageSeries([]); setGarbageError(e?.message || "โหลดข้อมูลขยะไม่สำเร็จ");
      } finally {
        setGarbageLoading(false);
      }
    };
    run();
  }, [isGarbage, selectedParamName, monthKeysForGarbage]);

  const mainYMaxHint = useMemo(() => {
    if (isGarbage) return getMaxY(garbageSeries);
    if (isSingleEnv) return getMaxY(singleSeriesPoints);
    if (view === "before") return getMaxY(beforeSeriesPoints);
    if (view === "after") return getMaxY(afterSeriesPoints);
    return Math.max(getMaxY(beforeSeriesPoints), getMaxY(afterSeriesPoints));
  }, [isGarbage, isSingleEnv, view, garbageSeries, singleSeriesPoints, beforeSeriesPoints, afterSeriesPoints]);

  /* ======================= EFFICIENCY (เฉพาะน้ำเสีย) ======================= */
  const effSeriesData = useMemo(() => {
    if (!isWastewater) return [];
    const beforeBuckets: Record<string, number[]> = {};
    const afterBuckets: Record<string, number[]> = {};
    (filteredData || []).forEach((d) => {
      if (d.parameter !== selectedParamName) return;
      const k = keyFromDate(d.date, filterMode);
      const v = Number(dFix(d.value));
      if (d.treatment === "ก่อน") {
        if (!beforeBuckets[k]) beforeBuckets[k] = [];
        beforeBuckets[k].push(v);
      } else if (d.treatment === "หลัง") {
        if (!afterBuckets[k]) afterBuckets[k] = [];
        afterBuckets[k].push(v);
      }
    });
    const dataPoints = labelsKeys.map((k) => {
      const bArr = beforeBuckets[k] || [];
      const aArr = afterBuckets[k] || [];
      const avgBefore = bArr.length ? bArr.reduce((s, x) => s + x, 0) / bArr.length : 0;
      const avgAfter  = aArr.length ? aArr.reduce((s, x) => s + x, 0) / aArr.length : 0;
      const pct = avgBefore > 0 ? Math.max(0, ((avgBefore - avgAfter) / avgBefore) * 100) : 0;
      return +pct.toFixed(2);
    });
    return [{ name: "Efficiency", data: dataPoints, color: chartColor.efficiency }];
  }, [filteredData, selectedParamName, filterMode, labelsKeys, chartColor.efficiency, isWastewater]);

  /* ======================= ALERTS (จากกราฟเดิม) ======================= */
  const alerts = useMemo(() => {
    if (isGarbage) return [];
    const byMonth: Record<string, { values: number[]; param: string; unit: string }> = {};
    filteredData.forEach((d) => {
      const key = new Date(d.date).toLocaleDateString("th-TH", { year: "numeric", month: "2-digit" });
      if (!byMonth[key]) byMonth[key] = { values: [], param: d.parameter, unit: d.unit };
      byMonth[key].values.push(Number(d.value));
    });
    const rows = Object.entries(byMonth).map(([month, v]) => {
      const avg = v.values.reduce((a, b) => a + b, 0) / Math.max(v.values.length, 1);
      const maxValue = stdMode === "middle" ? Number.POSITIVE_INFINITY : (stdHigh || Number.POSITIVE_INFINITY);
      return { month_year: month, parameter: v.param, average: avg, max_value: maxValue, unit: v.unit };
    });
    return rows.filter((r) => r.average > r.max_value);
  }, [filteredData, stdMode, stdHigh, isGarbage]);

  /* ======================= OPTIONS: หลัก ======================= */
  const buildOpts = useCallback(
    (title: string, showStandard = true, yMaxHint?: number): ApexOptions => {
      const isEfficiency = /efficiency/i.test(title) || title.includes("ประสิทธิภาพ");
      const baseAnnotations: NonNullable<ApexOptions["annotations"]> = { yaxis: [], xaxis: [], points: [], texts: [], images: [] };

      // ✅ แสดงเส้นมาตรฐานสำหรับ "ทุกน้ำ" (ยกเว้นขยะ)
      if (showStandard && !isEfficiency && !isGarbage && stdMode !== "none") {
        if (stdMode === "middle" && hasVal(stdMid)) {
          baseAnnotations.yaxis!.push({
            y: Number(stdMid),
            strokeDashArray: 6,
            borderColor: "#FF6F61",
            borderWidth: 1.5,
            label: {
              borderColor: "#FF6F61",
              style: { color: "#fff", background: "#FF6F61" },
              offsetY: -8,
              text: `มาตรฐาน ${Number(stdMid).toLocaleString("th-TH", { maximumFractionDigits: 2 })}${selectedParamUnit ? " " + selectedParamUnit : ""}`,
            },
          });
        } else {
          if (hasVal(stdLow)) {
            baseAnnotations.yaxis!.push({
              y: Number(stdLow),
              strokeDashArray: 6,
              borderColor: "rgba(255, 163, 24, 0.77)",
              borderWidth: 1.5,
              label: {
                borderColor: "rgba(255, 163, 24, 0.77)",
                style: { color: "#fff", background: "rgba(255, 163, 24, 0.77)" },
                offsetY: -8,
                text: `มาตรฐานต่ำสุด ${Number(stdLow).toLocaleString("th-TH", { maximumFractionDigits: 2 })}${selectedParamUnit ? " " + selectedParamUnit : ""}`,
              },
            });
          }
          if (hasVal(stdHigh)) {
            baseAnnotations.yaxis!.push({
              y: Number(stdHigh),
              strokeDashArray: 6,
              borderColor: "#035303ff",
              borderWidth: 1.5,
              label: {
                borderColor: "#035303ff",
                style: { color: "#fff", background: "rgba(3,83,3,0.6)" },
                offsetY: -8,
                text: `มาตรฐานสูงสุด ${Number(stdHigh).toLocaleString("th-TH", { maximumFractionDigits: 2 })}${selectedParamUnit ? " " + selectedParamUnit : ""}`,
              },
            });
          }
        }
      }

      const stdCeil =
        !isEfficiency && showStandard && !isGarbage
          ? (stdMode === "middle"
              ? (hasVal(stdMid) ? Number(stdMid) : 0)
              : Math.max(hasVal(stdHigh) ? Number(stdHigh) : 0, hasVal(stdLow) ? Number(stdLow) : 0))
          : 0;

      const suggestedMax =
        Math.max(Number(yMaxHint || 0), stdCeil) > 0 ? Math.max(Number(yMaxHint || 0), stdCeil) * 1.1 : undefined;

      return {
        chart: { zoom: { enabled: true, type: "x", autoScaleYaxis: true }, foreColor: "#475467", fontFamily: "Prompt, 'Prompt', sans-serif", toolbar: { show: true } },
        grid: { borderColor: "#e5e7eb", strokeDashArray: 3 },
        plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
        dataLabels: { enabled: false },
        stroke: { width: 2, curve: "smooth" },
        markers: { size: 4.5, strokeWidth: 2, hover: { sizeOffset: 2 } },
        xaxis: {
          categories: isGarbage ? garbageSeries.map(p => p.x) : (isSingleEnv ? singleSeriesPoints.map(p => p.x) : labels),
          tickPlacement: "on",
          tickAmount: Math.min((isGarbage ? garbageSeries.length : (isSingleEnv ? singleSeriesPoints.length : labels.length)), 6),
          axisBorder: { show: false }, axisTicks: { show: false },
          labels: { show: true, rotate: -45, trim: false, style: { fontSize: "12px", fontWeight: 500, colors: "#475467" },offsetX: -4 },
          tooltip: { enabled: false },
        },
        yaxis: {
          forceNiceScale: true, min: 0, max: isEfficiency ? 100 : suggestedMax,
          title: { text: isEfficiency ? "เปอร์เซ็น ( % )" : (isGarbage ? "หน่วย: kg" : (selectedParamUnit ? `หน่วย: ${selectedParamUnit}` : "")) },
          labels: { show: true, style: { fontSize: "12px", fontWeight: 500, colors: "#475467" },
            formatter: (v: number) => isEfficiency ? `${v.toFixed(2)}%` : v.toLocaleString("th-TH", { maximumFractionDigits: 2 }),
          },
        },
        annotations: baseAnnotations,
        title: { text: title, align: "left" },
        tooltip: {
          x: {
            formatter: (_: any, opt: any) =>
              isGarbage
                ? (garbageSeries?.[opt?.dataPointIndex]?.x ?? "")
                : (isSingleEnv
                    ? (singleSeriesPoints?.[opt?.dataPointIndex]?.x ?? "")
                    : (opt?.w?.globals?.categoryLabels?.[opt?.dataPointIndex] ?? "")),
          },
          y: {
            formatter: (v: number) => {
              if (isSingleEnv && Number(v) === 0) return "ไม่มีการตรวจวัด";
              return isEfficiency
                ? `${v.toFixed(2)}%`
                : `${Number(v).toLocaleString("th-TH", { maximumFractionDigits: 2 })}${isGarbage ? " kg" : (selectedParamUnit ? " " + selectedParamUnit : "")}`;
            },
          },
        },
        legend: { position: "top" },
      };
    },
    [labels, isGarbage, isSingleEnv, stdMode, stdLow, stdHigh, stdMid, selectedParamUnit, garbageSeries, singleSeriesPoints]
  );

  /* ========= WASTE PIE ========= */
  const wastePieSeries = useMemo(
    () => (wasteMix || []).map((w) => Number(dFix(w.total || 0))),
    [wasteMix]
  );

  const wastePieOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        fontFamily: "Prompt, 'Prompt', sans-serif",
        foreColor: "#000000",
        background: "transparent",
      },
      labels: (wasteMix || []).map((w) => w.parameter),
      legend: {
        position: "right",
        horizontalAlign: "left",
        offsetY: 0,
        markers: { size: 10, strokeWidth: 0 },
        fontSize: "11px",
        labels: { colors: "#000000" },
        itemMargin: { vertical: 2, horizontal: 10 },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(0)}%`,
        style: { fontSize: "12px", fontWeight: 700, colors: ["#FFFFFF"] },
        dropShadow: { enabled: false },
      },
      stroke: { width: 0 },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (val: number, opts) =>
            `${val.toLocaleString("th-TH", { maximumFractionDigits: 2 })} ${
              (wasteMix[opts.seriesIndex] as any)?.unit || "kg"
            }`,
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "64%",
            labels: {
              show: true,
              name: { show: true, fontSize: "14px", fontWeight: 600 },
              value: {
                show: true,
                fontSize: "22px",
                fontWeight: 800,
                formatter: (v: string) =>
                  Number(v || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 }),
              },
              total: {
                show: true,
                label: "รวม",
                fontSize: "13px",
                color: "##000000",
                formatter: (w) => {
                  const s =
                    (w?.globals?.seriesTotals as number[] | undefined)?.reduce((a, b) => a + b, 0) || 0;
                  return s.toLocaleString("th-TH", { maximumFractionDigits: 0 });
                },
              },
            },
          },
        },
      },
      colors: [
        "#0d9484ff",
        "#F59E0B",
        "#EF4444",
        "#22C55E",
        "#7C3AED",
        "#06B6D4",
        "#D946EF",
        "#E11D48",
      ],
      states: {
        hover: { filter: { type: "lighten", value: 0.02 } },
        active: { filter: { type: "darken", value: 0.04 } },
      },
    }),
    [wasteMix]
  );

  /* ========= DONUT (ปีล่าสุด): ยอดขาย ========= */
  const donutOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: "donut", fontFamily: "Prompt, 'Prompt', sans-serif" },
      labels: donutMonths,
      legend: { position: "right", horizontalAlign: "left", offsetY: -10, markers: { size: 6 }, fontSize: "11px" },
      dataLabels: { enabled: false },
      stroke: { show: false },
      tooltip: { y: { formatter: (val: number) => `${val.toLocaleString("th-TH", { maximumFractionDigits: 1 })} บาท` } },
      colors: ["#99d4fdff","#fcf080ff","#8ae98dff","#fd8591ff","#f8ae89ff","#b497ecff","#80CBC4","#CE93D8","#FFCC80","#A5D6A7","#EF9A9A","#90CAF9"],
    }),
    [donutMonths]
  );

  /* ========= DONUT (ปีล่าสุด): จำนวนคน ========= */
  const qtyDonutOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: "donut", fontFamily: "Prompt, 'Prompt', sans-serif" },
      labels: qtyMonths,
      legend: { position: "right", horizontalAlign: "left", offsetY: -10, markers: { size: 6 }, fontSize: "11px" },
      dataLabels: { enabled: false },
      stroke: { show: false },
      tooltip: { y: { formatter: (val: number) => `${val.toLocaleString("th-TH")} คน` } },
      colors: ["#A3F7BF","#A3E0FF","#FFE29A","#FFADB0","#D5B8FF","#9AD1B9","#FFCC80","#90CAF9","#CE93D8","#A5D6A7","#EF9A9A","#80CBC4"],
    }),
    [qtyMonths]
  );

  /* ======================= GRAPH HEIGHT ======================= */
  const graphHeight = (!isGarbage && alerts.length > 0) ? 250 : 350;

  /* ======================= RENDER ======================= */
  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-4 sm:px-6 lg:px-8 py-6 rounded-b-3xl mb-4 w-full mt-16 md:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold drop-shadow-md">การตรวจวัดคุณภาพสิ่งแวดล้อม</h1>
            <p className="text-sm drop-shadow-sm leading-snug">โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
          </div>

          <div className="bg-white/90 border border-cyan-200 px-5 py-4 rounded-xl text-center min-w-[300px] shadow-lg">
            <h3 className="text-base font-medium text-cyan-800 mb-2 leading-snug">ค่า TDS น้ำเสียหลังบำบัด (คาดการณ์เดือนถัดไป)</h3>
            {predictionLoading ? <p className="text-gray-600 m-0">กำลังคำนวณ...</p>
              : predictionError ? <p className="text-red-600 m-0">ไม่สามารถดึงค่าทำนายได้: {predictionError}</p>
              : <div className="text-2xl font-bold text-cyan-900">{predictionData?.prediction.toFixed(3)}</div>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="content-wrapper">
        <div className="container-xl">
          {/* Controls (Teal, Compact, Single-line) */}
          <Card className="dashboard-controls-card card-bleed controls-teal controls-grid" bordered={false}>
            <div className="controls-teal">
              <div className="controls-row">
                <div className="controls-field">
                  <label>สภาพแวดล้อม</label>
                  <Select
                    size="small"
                    style={{ width: 160 }}
                    value={selectedEnvId ?? undefined}
                    onChange={(v) => {
                      setSelectedEnvId(v);
                      const all = metas.find((e) => e.id === v)?.params ?? [];
                      const seen = new Set<string>();
                      const deduped = all.filter((p) => {
                        const k = (p.name || "").replace(/\s+/g, " ").trim().toLowerCase();
                        if (seen.has(k)) return false;
                        seen.add(k);
                        return true;
                      });
                      setSelectedParamId(deduped.length ? deduped[0].id : null);
                      setAutoRange(true); // ⭐ changed: รีเซ็ตให้ auto เมื่อเปลี่ยน environment
                    }}
                    options={metas.map((e) => ({ value: e.id, label: e.name }))}
                    dropdownMatchSelectWidth={false}
                  />
                </div>

                <div className="controls-field">
                  <label>พารามิเตอร์</label>
                  <Select
                    size="small"
                    style={{ width: 200 }}
                    value={selectedParamId ?? undefined}
                    onChange={(v) => { setSelectedParamId(v); setAutoRange(true); }} // ⭐ changed
                    options={paramList.map((p) => ({ value: p.id, label: p.name }))}
                    dropdownMatchSelectWidth={false}
                  />
                </div>

                {!isGarbage && !isSingleEnv && (
                  <div className="controls-field">
                    <label>มุมมอง</label>
                    <Select
                      size="small"
                      style={{ width: 150 }}
                      value={view}
                      onChange={setView}
                      options={[
                        { label: "น้ำก่อนบำบัด", value: "before" },
                        { label: "น้ำหลังบำบัด", value: "after" },
                        { label: "เปรียบเทียบก่อน–หลัง", value: "compare" },
                      ]}
                      dropdownMatchSelectWidth={false}
                    />
                  </div>
                )}

                <div className="controls-field">
                  <label>ช่วงเวลา</label>
                  <Select
                    size="small"
                    style={{ width: 120 }}
                    value={filterMode}
                    onChange={(val) => {
                      setFilterMode(val as FilterMode);
                      setAutoRange(true); // ⭐ changed: เปิดโหมด auto ทุกครั้งที่เปลี่ยนโหมดช่วงเวลา
                      const def = getDefaultRangeFromLatest(val as FilterMode, latestGraphDate);
                      setDateRange(def);
                    }}
                    options={[
                      { label: "ช่วงวัน", value: "dateRange" },
                      { label: "เดือน", value: "month" },
                      { label: "ปี", value: "year" },
                    ]}
                    dropdownMatchSelectWidth={false}
                  />
                </div>

                <div className="controls-field">
                  <label>เลือกวันที่</label>
                  {filterMode === "dateRange" && (
                    <DatePicker.RangePicker
                      size="small"
                      style={{ width: 210 }}
                      value={dateRange as [Dayjs, Dayjs] | undefined}
                      onChange={(dates) => {
                        setAutoRange(false); // ⭐ changed: ผู้ใช้เลือกเอง => ปิด auto
                        setDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null);
                      }}
                      locale={th_TH}
                      placeholder={["เริ่ม", "สิ้นสุด"]}
                      allowClear
                    />
                  )}
                  {filterMode === "month" && (
                    <DatePicker
                      size="small"
                      style={{ width: 130 }}
                      picker="month"
                      value={dateRange ? dateRange[0] : null}
                      onChange={(d) => { setAutoRange(false); setDateRange(d ? [d.startOf("month"), d.endOf("month")] : null); }} // ⭐ changed
                      locale={th_TH}
                      placeholder="เดือน"
                      allowClear
                    />
                  )}
                  {filterMode === "year" && (
                    <DatePicker.RangePicker
                      size="small"
                      style={{ width: 170 }}
                      picker="year"
                      value={dateRange as [Dayjs, Dayjs] | undefined}
                      onChange={(dates) => {
                        setAutoRange(false); // ⭐ changed
                        setDateRange(
                          dates && dates[0] && dates[1]
                            ? [dates[0].startOf("year"), dates[1].endOf("year")]
                            : null
                        );
                      }}
                      locale={th_TH}
                      placeholder={["ปีต้น", "ปีท้าย"]}
                      allowClear
                    />
                  )}
                </div>

                <div className="controls-field">
                  <label>ประเภทกราฟ</label>
                  <Segmented
                    size="small"
                    value={chartType}
                    onChange={(v) => setChartType(v as "line" | "bar")}
                    options={[{ label: "เส้น", value: "line" }, { label: "แท่ง", value: "bar" }]}
                  />
                </div>
              </div>
            </div>
          </Card>
          {/* Graphs */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card">
                <div className="dashboard-head-graph-card">
                  <div className="dashboard-head-title">
                    {isGarbage
                      ? selectedParamName || "ปริมาณขยะ"
                      : isSingleEnv
                      ? selectedParamName || envName
                      : view === "before"
                      ? "น้ำก่อนบำบัด"
                      : view === "after"
                      ? "น้ำหลังบำบัด"
                      : "เปรียบเทียบก่อน-หลัง"}
                  </div>
                  <div className="dashboard-head-controls">
                    {/* ✅ ขยะ: ให้เลือกสีได้ */}
                    {isGarbage && (
                      <ColorPicker
                        value={chartColor.garbage}
                        onChange={(c: Color) =>
                          setChartColor({ ...chartColor, garbage: c.toHexString() })
                        }
                      />
                    )}

                    {/* เดิม: single / before / after */}
                    {!isGarbage && (isSingleEnv || view === "before" || view === "after") && (
                      <ColorPicker
                        value={isSingleEnv || view === "after" ? chartColor.after : chartColor.before}
                        onChange={(c: Color) => {
                          const hex = c.toHexString();
                          if (isSingleEnv || view === "after")
                            setChartColor({ ...chartColor, after: hex });
                          else
                            setChartColor({ ...chartColor, before: hex });
                        }}
                      />
                    )}

                    {/* เดิม: compare */}
                    {!isGarbage && !isSingleEnv && view === "compare" && (
                      <>
                        <ColorPicker value={chartColor.compareBefore}
                          onChange={(c) => setChartColor({ ...chartColor, compareBefore: c.toHexString() })}/>
                        <ColorPicker value={chartColor.compareAfter}
                          onChange={(c) => setChartColor({ ...chartColor, compareAfter: c.toHexString() })}/>
                      </>
                    )}
                    <Button type="text" icon={<Maximize2 size={18} />} onClick={() => setShowModal(true)} />
                  </div>

                </div>

                {isGarbage && garbageLoading ? (
                  <div style={{ padding: 16 }}>กำลังโหลด...</div>
                ) : isGarbage && garbageError ? (
                  <div style={{ padding: 16, color: "red" }}>{garbageError}</div>
                ) : (
                  <ApexChart
                    key={String(selectedEnvId) + String(selectedParamId) + view + chartType}
                    options={buildOpts("", true, mainYMaxHint)}
                    series={
                      isGarbage
                        ? [{ name: selectedParamName || "ปริมาณ", data: garbageSeries, color: chartColor.garbage }]
                        : isSingleEnv
                        ? [{ name: selectedParamName || envName, data: singleSeriesPoints, color: chartColor.after }]
                        : view === "before"
                        ? [{ name: "ก่อน", data: beforeSeriesPoints, color: chartColor.before }]
                        : view === "after"
                        ? [{ name: "หลัง", data: afterSeriesPoints, color: chartColor.after }]
                        : [
                            { name: "ก่อน", data: beforeSeriesPoints, color: chartColor.compareBefore },
                            { name: "หลัง", data: afterSeriesPoints, color: chartColor.compareAfter },
                          ]
                    }
                    type={chartType}
                    height={graphHeight}
                  />
                )}
              </div>
            </Col>

            {/* Efficiency เฉพาะน้ำเสีย */}
            {isWastewater && (
              <Col xs={24} lg={12}>
                <div className="dashboard-graph-card card">
                  <div className="dashboard-head-graph-card">
                    <div className="dashboard-head-title">ประสิทธิภาพ (%)</div>
                    <div className="dashboard-head-controls">
                      <ColorPicker value={chartColor.efficiency} onChange={(c) => setChartColor({ ...chartColor, efficiency: c.toHexString() })} />
                    </div>
                  </div>
                  <ApexChart options={buildOpts("Efficiency (%)", false)} series={effSeriesData} type="bar" height={graphHeight} />
                </div>
              </Col>
            )}

            {/* ✅ น้ำประปา/น้ำดื่ม: กราฟค่าสูงสุด/ต่ำสุด */}
            {isSingleEnv && (
              <Col xs={24} lg={12}>
                <div className="dashboard-graph-card card">
                  <div className="dashboard-head-graph-card">
                    <div className="dashboard-head-title">ค่าสูงสุด / ต่ำสุด</div>
                    <div className="dashboard-head-controls">
                      <ColorPicker
                        value={chartColor.tapMax}
                        onChange={(c) => setChartColor((s) => ({ ...s, tapMax: c.toHexString() }))}
                      />
                      <ColorPicker
                        value={chartColor.tapMin}
                        onChange={(c) => setChartColor((s) => ({ ...s, tapMin: c.toHexString() }))}
                      />
                    </div>
                  </div>
                  <ApexChart
                    options={buildOpts("ค่าสูงสุด/ต่ำสุด", true, tapMinMaxYMax)}
                    series={tapMinMaxSeries}
                    type={chartType}
                    height={graphHeight}
                  />
                </div>
              </Col>
            )}
          </Row>

          {/* Alerts – 4 ล่าสุด */}
          <Card className="dashboard-alerts-card card-bleed" bordered={false}>
            <div className="teal-surface">
              <div className="teal-title">การแจ้งเตือนล่าสุด</div>

              {bellLoading ? (
                <div>กำลังโหลด...</div>
              ) : bellError ? (
                <div style={{ color: "#ffe2e2", fontWeight: 600 }}>{bellError}</div>
              ) : bellAlerts.length === 0 ? (
                <div style={{ opacity: .95 }}>ไม่มีการแจ้งเตือน</div>
              ) : (
                <div className="alert-chip-row">
                  {bellAlerts.map((item, idx) => {
                    const dt = new Date(item?.data?.Date);
                    const date = dt.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
                    const time = dt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                    const title =
                      item.type === "garbage"
                        ? `${getParamName(item)} ${getStatusName(item)}`
                        : `${getParamName(item)} ของ${getEnvName(item)} ${getStatusName(item)}`;
                    const desc = `ค่าที่ตรวจพบ: ${getValue(item)} ${getUnitName(item)}\nวันที่บันทึก: ${date} เวลา: ${time}`;

                    return (
                      <div key={idx} className="alert-chip">
                        <div className="title">{title}</div>
                        <div className="desc">{desc}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* ====== สัดส่วนขยะ + การ์ดโดนัทรีไซเคิล ====== */}
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            {/* ซ้าย: สัดส่วนขยะรายเดือน */}
            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card pie-clean-card">
                <div className="pie-header">
                  <div className="teal-title-chip">สัดส่วนขยะ (ต่อเดือน)</div>
                  <DatePicker
                    picker="month"
                    value={wasteMonth}
                    onChange={(d) => setWasteMonth(d ? d.startOf("month") : null)}
                    locale={th_TH}
                    allowClear={false}
                    className="dashboard-picker month-picker-compact"
                    placeholder="เลือกเดือน"
                  />
                </div>
                {wasteLoading ? (
                  <div>กำลังโหลด...</div>
                ) : wasteError ? (
                  <div style={{ color: "red", fontWeight: 600 }}>{wasteError}</div>
                ) : wasteMix && wasteMix.length > 0 ? (
                  <ApexChart
                    options={wastePieOptions}
                    series={wastePieSeries}
                    type="donut"
                    height={287}
                  />
                ) : (
                  <div style={{ background: "#fafafa", borderRadius: 12, padding: 16 }}>
                    <Empty description="ไม่มีข้อมูลสัดส่วนขยะของเดือนนี้" />
                  </div>
                )}
              </div>
            </Col>

            {/* ขวา: การ์ดโดนัทสรุปยอดขายรีไซเคิลปีล่าสุด */}
            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card card-bleed" style={{ overflow: "hidden" }}>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    borderRadius: 12,
                    color: "#fff",
                    overflow: "hidden",
                    background: "linear-gradient(180deg, #2abdbf 0%, #1f9a9c 70%, #138486 100%)",
                    padding: 16,
                    minHeight: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ zIndex: 1 }}>
                    <div style={{ fontSize: 18, opacity: .95, marginBottom: 8 }}>จำนวนยอดขายรวมปี {donutYearThai ?? "-"}</div>
                    <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>
                      {totalSaleYear.toLocaleString("th-TH", { maximumFractionDigits: 1 })} บาท
                    </div>
                    <div style={{ fontSize: 12, marginTop: 6, opacity: .95 }}>{lastRecordDate ? `Date per ${lastRecordDate}` : ""}</div>
                  </div>

                  <div style={{ zIndex: 1 }}>
                    <ApexChart options={donutOptions} series={donutSeries} type="donut" width={180} height={180} />
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      right: 0, top: 0, width: "60%", height: "60%",
                      borderBottomLeftRadius: "100% 100%",
                      background: "linear-gradient(135deg, rgba(219,218,218,0.45) 0%, rgba(255,255,255,0.25) 40%, rgba(255,255,255,0) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>

              {/* ⭐️ ใต้การ์ดยอดขาย: การ์ดจำนวนคนรวมปีล่าสุด */}
              <div className="dashboard-graph-card card card-bleed" style={{ overflow: "hidden", marginTop: 16 }}>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    borderRadius: 12,
                    color: "#fff",
                    overflow: "hidden",
                    background: "linear-gradient(180deg, #2abdbf 0%, #1f9a9c 70%, #138486 100%)",
                    padding: 16,
                    minHeight: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ zIndex: 1 }}>
                    <div style={{ fontSize: 18, opacity: .95, marginBottom: 8 }}>
                      จำนวนคนที่เข้าใช้บริการรวมปี {donutYearThai ?? "-"}
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>
                      {totalQtyYear.toLocaleString("th-TH")} คน
                    </div>
                    <div style={{ fontSize: 12, marginTop: 6, opacity: .95 }}>
                      {lastRecordDate ? `Date per ${lastRecordDate}` : ""}
                    </div>
                  </div>

                  <div style={{ zIndex: 1 }}>
                    <ApexChart options={qtyDonutOptions} series={qtySeries} type="donut" width={180} height={180} />
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      right: 0, top: 0, width: "60%", height: "60%",
                      borderBottomLeftRadius: "100% 100%",
                      background: "linear-gradient(135deg, rgba(219,218,218,0.45) 0%, rgba(255,255,255,0.25) 40%, rgba(255,255,255,0) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </Col>
          </Row>

          {/* History modal */}
          <Modal open={showAllAlerts} title="ประวัติการแจ้งเตือนทั้งหมด" footer={null} onCancel={() => setShowAllAlerts(false)} width={900}>
            <Table
              rowKey={(_, i) => String(i)}
              dataSource={alerts.map((a) => ({
                month_year: a.month_year,
                parameter: a.parameter,
                average: a.average,
                max_value: a.max_value,
                unit: a.unit,
                exceed: a.average > a.max_value ? "เกินมาตรฐาน" : "ปกติ",
              }))}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: "เดือน", dataIndex: "month_year" },
                { title: "พารามิเตอร์", dataIndex: "parameter" },
                { title: "ค่าเฉลี่ย", dataIndex: "average", render: (v: number, r) => `${v.toFixed(2)} ${r.unit || ""}`.trim() },
                { title: "มาตรฐานสูงสุด", dataIndex: "max_value", render: (v: number, r) => `${v.toFixed(2)} ${r.unit || ""}`.trim() },
                { title: "สถานะ", dataIndex: "exceed" },
              ]}
            />
          </Modal>

          {/* Zoom modal */}
          <Modal open={showModal} footer={null} onCancel={() => setShowModal(false)} width={1000}>
            <ApexChart
              key={"modal" + view + chartType}
              options={buildOpts("Zoom Chart", true, mainYMaxHint)}
              series={
                isGarbage
                  ? [{ name: selectedParamName || "ปริมาณ", data: garbageSeries, color: chartColor.garbage }]
                  : isSingleEnv
                  ? [{ name: selectedParamName || envName, data: singleSeriesPoints, color: chartColor.after }]
                  : view === "before"
                  ? [{ name: "ก่อน", data: beforeSeriesPoints, color: chartColor.before }]
                  : view === "after"
                  ? [{ name: "หลัง", data: afterSeriesPoints, color: chartColor.after }]
                  : [
                      { name: "ก่อน", data: beforeSeriesPoints, color: chartColor.compareBefore },
                      { name: "หลัง", data: afterSeriesPoints, color: chartColor.compareAfter },
                    ]
              }
              type={chartType}
              height={600}
            />
          </Modal>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
