// src/page/admin/AdminDashboard.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Row, Col, Select, DatePicker, Modal, ColorPicker, Button, Card, Segmented, Table, Empty } from "antd";
import type { Color } from "antd/es/color-picker";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import th_TH from "antd/es/date-picker/locale/th_TH";
import ApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Maximize2 } from "lucide-react";
import { fetchPrediction } from "../../services/predict";
import type { PredictionOutput } from "../../interface/IPredict";
import { GetEnvironmentalRecords, GetEnvironmentalEfficiency, GetEnvironmentalMeta, type RecordItem, type EfficiencyItem, GetWasteMixByMonth, GetWasteMix, type WasteMixItem } from "../../services/DashboardService";
import { GetAlertSoftware } from "../../services/index";
import { GetlistRecycled } from "../../services/garbageServices/recycledWaste";
import "./dashboard.css";
import "./skydash-override.css";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
dayjs.locale("th"); dayjs.extend(buddhistEra);

interface ParamMeta { id: number; name: string; unit: string; std_min?: number | null; std_middle?: number | null; std_max?: number | null; }
interface EnvMeta { id: number; name: string; params: ParamMeta[]; }
type ViewType = "before" | "after" | "compare";
type FilterMode = "dateRange" | "month" | "year";
type StandardMode = "none" | "middle" | "range";
type BellAlert = { type: "environmental" | "garbage"; data: any };

const _wmCache = new Map<string, Promise<any[]>>();
const fetchWasteMixMonthSafe = async (m: string) => {
  if (_wmCache.has(m)) return _wmCache.get(m)!;
  const p = (async () => {
    let data = await GetWasteMixByMonth(m);
    if (!Array.isArray(data) || data.length === 0) data = await GetWasteMixByMonth(`${m}-01`);
    if (!Array.isArray(data) || data.length === 0) {
      const start = dayjs(m + "-01").startOf("month").format("YYYY-MM-DD");
      const end = dayjs(m + "-01").endOf("month").format("YYYY-MM-DD");
      data = (await GetWasteMix({ type: "range", start, end })) ?? [];
    }
    return Array.isArray(data) ? data : [];
  })();
  _wmCache.set(m, p); return p;
};

const keyFromDate = (iso: string, mode: FilterMode) => (mode === "year" ? dayjs(iso).startOf("month").format("YYYY-MM") : dayjs(iso).format("YYYY-MM-DD"));
const labelFromKey = (key: string, mode: FilterMode) => (mode === "year" ? dayjs(key + "-01").toDate().toLocaleDateString("th-TH", { month: "short", year: "numeric" }) : dayjs(key).toDate().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }));
const dFix = (n: any) => { const f = Number(n); return Number.isFinite(f) ? +f.toFixed(3) : 0; };
const fmt2 = (n: any) => Number(n ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n: any) => Number(n ?? 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });
const norm = (s: string) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
const normalizeMinMax = (arr: number[]) => { if (!arr.length) return []; const min = Math.min(...arr), max = Math.max(...arr); return min === max ? arr.map(v => (min === 0 ? 0 : 0.5)) : arr.map(v => (v - min) / (max - min)); };

const AdminDashboard: React.FC = () => {
  const [metas, setMetas] = useState<EnvMeta[]>([]); const [, setMetaLoading] = useState(false); const [, setMetaError] = useState<string | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null); const [selectedParamId, setSelectedParamId] = useState<number | null>(null);
  const [rawData, setRawData] = useState<RecordItem[]>([]); const [, setEfficiency] = useState<EfficiencyItem[] | null>(null); const [, setDataLoading] = useState(false); const [, setDataError] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>("compare"); const [chartType, setChartType] = useState<"line" | "bar">("line"); const [showModal, setShowModal] = useState(false); const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("year");
  const [dateRange, setDateRange] = useState<Dayjs[] | null>([dayjs().startOf("year"), dayjs().endOf("year")]);
  const [autoRange, setAutoRange] = useState(true);
  const [latestGraphDate, setLatestGraphDate] = useState<Dayjs | null>(null);

  const [chartColor, setChartColor] = useState({ before: "#00C2C7", after: "#33E944", compareBefore: "#00C2C7", compareAfter: "#7B61FF", efficiency: "#faad14", garbage: "#3367e9ff", tapMin: "#2abdbf", tapMax: "#1a4b57", tapAvg: "#f39c12", garbageNormWaste: "#2abdbf", garbageNormPeople: "#1a4b57" });

  const [predictionData, setPredictionData] = useState<PredictionOutput | null>(null); const [predictionLoading, setPredictionLoading] = useState(false); const [predictionError, setPredictionError] = useState<string | null>(null);

  const [wasteMix, setWasteMix] = useState<WasteMixItem[]>([]); const [wasteLoading, setWasteLoading] = useState(false); const [wasteError, setWasteError] = useState<string | null>(null); const [wasteMonth, setWasteMonth] = useState<Dayjs | null>(null);
  const [garbageSeries, setGarbageSeries] = useState<Array<{ x: string; y: number }>>([]); const [garbageLoading, setGarbageLoading] = useState(false); const [garbageError, setGarbageError] = useState<string | null>(null);

  const [bellAlerts, setBellAlerts] = useState<BellAlert[]>([]); const [bellLoading, setBellLoading] = useState(false); const [bellError, setBellError] = useState<string | null>(null);

  const [donutMonths, setDonutMonths] = useState<string[]>([]); const [donutSeries, setDonutSeries] = useState<number[]>([]); const [donutYearThai, setDonutYearThai] = useState<number | null>(null); const [totalSaleYear, setTotalSaleYear] = useState(0); const [lastRecordDate, setLastRecordDate] = useState(""); const [qtyMonths, setQtyMonths] = useState<string[]>([]); const [qtySeries, setQtySeries] = useState<number[]>([]); const [totalQtyYear, setTotalQtyYear] = useState(0);
  const [recycledRowsAll, setRecycledRowsAll] = useState<any[]>([]);
  const [garbageNormChartType, setGarbageNormChartType] = useState<"line" | "bar">("line");
  const [compareMonthlyGarbageQuantity, setCompareMonthlyGarbageQuantity] = useState<{ label: string; monthKey: string; waste: number; people: number; unit: string; }[]>([]);
  
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setMetaLoading(true); setMetaError(null);
        const m = await GetEnvironmentalMeta(); if (cancelled) return;
        if (Array.isArray(m) && m.length > 0) {
          const envWithParams = m.find(e => (e.params ?? []).length > 0) ?? m[0];
          const dedupedParams = Array.from(new Map((envWithParams.params ?? []).map(p => [norm(p.name || ""), p])).values());
          setMetas(m); setSelectedEnvId(envWithParams.id); setSelectedParamId(dedupedParams[0]?.id ?? null); setAutoRange(true);
        } else { setMetas([]); setSelectedEnvId(null); setSelectedParamId(null); }
      } catch (e: any) { if (!cancelled) setMetaError(e?.message || "โหลดเมตาไม่สำเร็จ"); } finally { if (!cancelled) setMetaLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setBellLoading(true); setBellError(null);
        const raw = (await GetAlertSoftware()) ?? [];
        const filtered = raw.filter((r: BellAlert) => (r?.data?.Status?.StatusName ?? "-") === "ไม่ผ่านเกณฑ์มาตรฐาน" && (r.type === "garbage" || r?.data?.BeforeAfterTreatment?.TreatmentName === "หลัง"));
        const sorted = filtered.sort((a: any, b: any) => new Date(b?.data?.Date).getTime() - new Date(a?.data?.Date).getTime());
        if (!cancel) setBellAlerts(sorted.slice(0, 3));
      } catch (e: any) { if (!cancel) { setBellAlerts([]); setBellError(e?.message || "โหลดการแจ้งเตือนล้มเหลว"); } } finally { if (!cancel) setBellLoading(false); }
    })();
    return () => { cancel = true; };
  }, []);

  const loadData = useCallback(async () => {
    try {
      setDataLoading(true); setDataError(null);
      const rec = await GetEnvironmentalRecords({ date: undefined, type: undefined, view: "compare" }); setRawData(rec ?? []);
      const eff = await GetEnvironmentalEfficiency({ date: undefined, type: undefined, param: undefined }); setEfficiency(eff ?? null);
    } catch (err: any) { setDataError(err?.message || "โหลดข้อมูลไม่สำเร็จ"); } finally { setDataLoading(false); }
  }, []);
  useEffect(() => { (async () => { await loadData(); })(); }, [loadData]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try { setPredictionLoading(true); setPredictionError(null); const d = await fetchPrediction(); if (mounted) setPredictionData(d); }
      catch (err: any) { if (mounted) setPredictionError(err?.message || "คำนวณค่าทำนายไม่สำเร็จ"); }
      finally { if (mounted) setPredictionLoading(false); }
    })();
    return () => { mounted = true; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await GetlistRecycled(); const rows = resp?.data ?? []; if (!mounted) return;
        setRecycledRowsAll(rows);
        if (!rows.length) { setDonutMonths([]); setDonutSeries([]); setDonutYearThai(null); setTotalSaleYear(0); setLastRecordDate(""); setQtyMonths([]); setQtySeries([]); setTotalQtyYear(0); return; }
        const sorted = [...rows].sort((a: any, b: any) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        const last = sorted[sorted.length - 1]; const lastD = new Date(last.Date);
        const latestYear = sorted.reduce((y: number, r: any) => Math.max(y, new Date(r.Date).getFullYear()), 0);
        const inLatestYear = rows.filter((r: any) => new Date(r.Date).getFullYear() === latestYear);
        const totalSale = inLatestYear.reduce((s: number, r: any) => s + Number(r.TotalSale || 0), 0);
        const totalQty = inLatestYear.reduce((s: number, r: any) => s + Number(r.Quantity || 0), 0);
        const monthShortTH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
        const saleMonthMap: Record<string, number> = {}; inLatestYear.forEach((r: any) => { const d = new Date(r.Date); const k = monthShortTH[d.getMonth()]; saleMonthMap[k] = (saleMonthMap[k] || 0) + Number(r.TotalSale || 0); });
        const qtyMonthMap: Record<string, number> = {}; inLatestYear.forEach((r: any) => { const d = new Date(r.Date); const k = monthShortTH[d.getMonth()]; qtyMonthMap[k] = (qtyMonthMap[k] || 0) + Number(r.Quantity || 0); });
        const saleMonthsOrdered = monthShortTH.filter(m => m in saleMonthMap); const saleSeriesOrdered = saleMonthsOrdered.map(m => saleMonthMap[m]);
        const qtyMonthsOrdered = monthShortTH.filter(m => m in qtyMonthMap); const qtySeriesOrdered = qtyMonthsOrdered.map(m => qtyMonthMap[m]);
        setDonutMonths(saleMonthsOrdered); setDonutSeries(saleSeriesOrdered); setDonutYearThai(latestYear + 543); setTotalSaleYear(totalSale);
        setLastRecordDate(lastD.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
        setQtyMonths(qtyMonthsOrdered); setQtySeries(qtySeriesOrdered); setTotalQtyYear(totalQty);
      } catch { if (!mounted) return; setDonutMonths([]); setDonutSeries([]); setDonutYearThai(null); setTotalSaleYear(0); setLastRecordDate(""); setQtyMonths([]); setQtySeries([]); setTotalQtyYear(0); setRecycledRowsAll([]); }
    })();
    return () => { mounted = false; };
  }, []);

  const reloadWaste = useCallback(async () => {
    try {
      setWasteLoading(true); setWasteError(null);
      if (wasteMonth) {
        const m1 = wasteMonth.format("YYYY-MM");
        let wm = await GetWasteMixByMonth(m1); if (!Array.isArray(wm) || wm.length === 0) wm = await GetWasteMixByMonth(wasteMonth.format("YYYY-MM-01"));
        setWasteMix(Array.isArray(wm) ? wm : []);
      } else if (dateRange?.[0] && dateRange?.[1]) {
        const start = dateRange[0].startOf("day").format("YYYY-MM-DD"); const end = dateRange[1].endOf("day").format("YYYY-MM-DD");
        const wm = await GetWasteMix({ type: "range", start, end }); setWasteMix(Array.isArray(wm) ? wm : []);
      } else setWasteMix([]);
    } catch (e: any) { setWasteMix([]); setWasteError(e?.message || "โหลดสัดส่วนขยะไม่สำเร็จ"); } finally { setWasteLoading(false); }
  }, [dateRange, wasteMonth]);
  useEffect(() => { reloadWaste(); }, [reloadWaste, wasteMonth]);

  useEffect(() => {
    let cancelled = false;
    const ensureLatestWasteMonth = async () => {
      if (wasteMonth) return; const base = dayjs();
      for (let i = 0; i < 12; i++) {
        const probe = base.subtract(i, "month").startOf("month"); const mStr = probe.format("YYYY-MM");
        try {
          let wm = await GetWasteMixByMonth(mStr); if (!Array.isArray(wm) || wm.length === 0) wm = await GetWasteMixByMonth(probe.format("YYYY-MM-01"));
          if (!cancelled && Array.isArray(wm) && wm.length > 0) { setWasteMonth(probe); return; }
        } catch { /* ignore */ }
      }
      if (!cancelled) setWasteMonth(base.startOf("month"));
    };
    ensureLatestWasteMonth(); return () => { cancelled = true; };
  }, [wasteMonth]);

  const selectedEnv = useMemo(() => metas.find(e => e.id === selectedEnvId) || null, [metas, selectedEnvId]);
  const globalParamMeta = useMemo(() => { const env = metas.find(e => e.id === selectedEnvId); return env?.params.find(p => p.id === selectedParamId) || null; }, [metas, selectedEnvId, selectedParamId]);
  const paramList = useMemo(() => { const list = selectedEnv?.params ?? []; return Array.from(new Map(list.map(p => [(p.name || "").replace(/\s+/g, " ").trim().toLowerCase(), p])).values()); }, [selectedEnv]);
  const selectedParamMeta = useMemo(() => paramList.find(p => p.id === selectedParamId) || null, [paramList, selectedParamId]);

  const envName = (selectedEnv?.name || "").trim(); const isGarbage = envName === "ขยะ"; const SINGLE_ENV_NAMES = new Set(["น้ำดื่ม","น้ำประปา","น้ำปะปา","ประปา"]);
  const isSingleEnv = SINGLE_ENV_NAMES.has(envName); const isWastewater = !isGarbage && !isSingleEnv;

  const selectedParamName = globalParamMeta?.name ?? selectedParamMeta?.name ?? ""; const selectedParamUnit = globalParamMeta?.unit ?? selectedParamMeta?.unit ?? "";
  const stdMin = !isGarbage ? (globalParamMeta?.std_min ?? selectedParamMeta?.std_min ?? -1) : -1;
  const stdMiddle = !isGarbage ? (globalParamMeta?.std_middle ?? selectedParamMeta?.std_middle ?? -1) : -1;
  const stdMax = !isGarbage ? (globalParamMeta?.std_max ?? selectedParamMeta?.std_max ?? -1) : -1;
  const hasVal = (v: any) => { const n = Number(v); return v !== null && v !== undefined && !Number.isNaN(n) && n !== -1; };
  const { stdMode, stdLow, stdHigh, stdMid } = useMemo(() => {
    if (isGarbage) return { stdMode: "none" as StandardMode, stdLow: 0, stdHigh: 0, stdMid: 0 };
    if (hasVal(stdMiddle)) return { stdMode: "middle" as StandardMode, stdLow: 0, stdHigh: 0, stdMid: Number(stdMiddle) };
    const hasLow = hasVal(stdMin), hasHigh = hasVal(stdMax);
    if (hasLow || hasHigh) return { stdMode: "range" as StandardMode, stdLow: hasLow ? Number(stdMin) : 0, stdHigh: hasHigh ? Number(stdMax) : 0, stdMid: 0 };
    return { stdMode: "none" as StandardMode, stdLow: 0, stdHigh: 0, stdMid: 0 };
  }, [isGarbage, stdMin, stdMiddle, stdMax]);

  const filteredData = useMemo(() => {
    let base = rawData;
    if (dateRange?.length === 2) { const [start, end] = dateRange; const st = start?.toDate?.() ?? new Date(); const en = end?.toDate?.() ?? new Date(); base = (rawData || []).filter(d => { const dd = new Date(d.date); return dd >= st && dd <= en; }); }
    const envLower = envName.toLowerCase(); if (envLower && envLower !== "ขยะ") base = base.filter(d => (d.environment || "").trim().toLowerCase() === envLower);
    const paramLower = (selectedParamName || "").trim().toLowerCase(); if (paramLower && envLower !== "ขยะ") base = base.filter(d => (d.parameter || "").trim().toLowerCase() === paramLower);
    return base;
  }, [rawData, dateRange, envName, selectedParamName]);

  const scopeForLatest = useMemo(() => {
    const envLower = envName.toLowerCase(); const paramLower = (selectedParamName || "").trim().toLowerCase();
    if (envLower === "ขยะ") return (rawData || []).filter(d => (d.environment || "").trim().toLowerCase() === envLower);
    return (rawData || []).filter(d => (d.environment || "").trim().toLowerCase() === envLower && (d.parameter || "").trim().toLowerCase() === paramLower);
  }, [rawData, envName, selectedParamName]);

  useEffect(() => {
    const latest = (() => {
      const arr = scopeForLatest.map(r => dayjs(r?.date)).filter(d => d.isValid()).sort((a, b) => a.valueOf() - b.valueOf());
      return arr.length ? arr[arr.length - 1] : null;
    })();
    setLatestGraphDate(latest);
  }, [scopeForLatest]);

  useEffect(() => {
    if (!autoRange) return;
    const base = latestGraphDate && latestGraphDate.isValid() ? latestGraphDate : dayjs();
    const def = filterMode === "year" ? [base.subtract(11, "month").startOf("month"), base.endOf("month")] as [Dayjs, Dayjs]
      : filterMode === "month" ? [base.startOf("month"), base.endOf("month")] as [Dayjs, Dayjs]
      : [base.subtract(6, "day").startOf("day"), base.endOf("day")] as [Dayjs, Dayjs];
    setDateRange(def);
  }, [latestGraphDate, filterMode, autoRange]);

  const createDateRangeKeys = (start: Dayjs, end: Dayjs, mode: FilterMode): string[] => {
    const keys: string[] = [];
    if (mode === "dateRange") { let cur = start.startOf("day"); const last = end.endOf("day"); while (cur.isBefore(last) || cur.isSame(last)) { keys.push(cur.format("YYYY-MM-DD")); cur = cur.add(1, "day"); } }
    else { let cur = start.startOf("month"); const last = end.endOf("month"); while (cur.isBefore(last) || cur.isSame(last)) { keys.push(cur.format("YYYY-MM")); cur = cur.add(1, "month"); } }
    return keys;
  };

  const { labelsKeys, labels } = useMemo(() => {
    if (envName === "ขยะ") return { labelsKeys: [], labels: [] };
    const grouped: Record<string, true> = {}; (filteredData || []).filter(d => d.parameter === selectedParamName).forEach(d => { grouped[keyFromDate(d.date, filterMode)] = true; });
    let allDates: string[] = [];
    if (dateRange) {
      if (filterMode === "year") { const sy = dateRange[0].year(); const ey = dateRange[1].year(); allDates = Object.keys(grouped).filter(m => { const y = dayjs(m + "-01").year(); return y >= sy && y <= ey; }).sort(); }
      else if (filterMode === "month") allDates = createDateRangeKeys(dateRange[0].startOf("month"), dateRange[1].endOf("month"), "dateRange");
      else allDates = createDateRangeKeys(dateRange[0], dateRange[1], "dateRange");
    }
    return { labelsKeys: allDates, labels: allDates.map(k => labelFromKey(k, filterMode)) };
  }, [filteredData, selectedParamName, filterMode, dateRange, envName]);

  const makeSeries = useCallback((treatment: "ก่อน" | "หลัง") => {
    const tdata = filteredData.filter(d => d.parameter === selectedParamName && d.treatment === treatment);
    const buckets: Record<string, number[]> = {}; tdata.forEach(d => { const k = keyFromDate(d.date, filterMode); (buckets[k] ||= []).push(Number(dFix(d.value))); });
    return labelsKeys.map((k, i) => { const vals = buckets[k]; const avg = vals && vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; return { x: labels[i], y: avg }; });
  }, [filteredData, selectedParamName, filterMode, labelsKeys, labels]);

  const isGarbageEnv = envName === "ขยะ";
  const singleSeriesPoints = useMemo(() => {
    if (!SINGLE_ENV_NAMES.has(envName)) return [];
    const tdata = filteredData.filter(d => d.parameter === selectedParamName);
    const buckets: Record<string, number[]> = {}; tdata.forEach(d => { const k = keyFromDate(d.date, filterMode); (buckets[k] ||= []).push(Number(dFix(d.value))); });
    return labelsKeys.map((k, i) => { const vals = buckets[k]; const avg = vals && vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; return { x: labels[i], y: avg }; });
  }, [envName, filteredData, selectedParamName, filterMode, labelsKeys, labels]);

  // ⬅️ แทนที่ useMemo ของ tapMinMaxPoints เดิมทั้งหมดด้วยอันนี้
const { tapMinMaxPoints, tapAggLabels } = useMemo(() => {
  // ใช้เฉพาะ Single Env เท่านั้น
  if (!SINGLE_ENV_NAMES.has(envName)) {
    return { tapMinMaxPoints: [] as Array<{ x: string; min: number; max: number; avg: number }>, tapAggLabels: [] as string[] };
  }

  const tdata = filteredData.filter(d => d.parameter === selectedParamName);
  const buckets: Record<string, number[]> = {};

  // key สำหรับกราฟขวา: ถ้าเลือก "ปี" จะ bucket เป็น "ปี", นอกนั้นตาม filterMode ปกติ
  const bucketKey = (iso: string) => {
    if (filterMode === "year") return String(dayjs(iso).year()); // คีย์ปี ค.ศ.
    return keyFromDate(iso, filterMode);                         // วัน/เดือน ตามเดิม
  };

  tdata.forEach(d => {
    const k = bucketKey(d.date);
    (buckets[k] ||= []).push(Number(dFix(d.value)));
  });

  // ลำดับคีย์ + label
  let keys: string[] = [];
  let labelsLocal: string[] = [];

  if (filterMode === "year") {
    const y0 = dateRange?.[0]?.year() ?? dayjs().year();
    const y1 = dateRange?.[1]?.year() ?? dayjs().year();
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) keys.push(String(y));
    labelsLocal = keys.map(y => String(Number(y) + 543)); // แสดง พ.ศ.
  } else {
    // ใช้ labelsKeys/labels เดิมสำหรับเดือน/วัน
    keys = labelsKeys;
    labelsLocal = labels;
  }

  const points = keys.map((k, i) => {
    const arr = buckets[k] || [];
    const min = arr.length ? Math.min(...arr) : 0;
    const max = arr.length ? Math.max(...arr) : 0;
    const avg = arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    return { x: labelsLocal[i], min, max, avg };
  });

  return { tapMinMaxPoints: points, tapAggLabels: labelsLocal };
}, [envName, filteredData, selectedParamName, filterMode, labelsKeys, labels, dateRange]);

  const tapMinMaxSeries = useMemo(() => [
  { name: "ค่าสูงสุด", data: tapMinMaxPoints.map(p => ({ x: p.x, y: p.max })), color: chartColor.tapMax },
  { name: "ค่าต่ำสุด", data: tapMinMaxPoints.map(p => ({ x: p.x, y: p.min })), color: chartColor.tapMin },
  { name: "ค่าเฉลี่ย", data: tapMinMaxPoints.map(p => ({ x: p.x, y: +dFix(p.avg) })), color: chartColor.tapAvg }, // ⬅️ เพิ่ม
], [tapMinMaxPoints, chartColor.tapMax, chartColor.tapMin, chartColor.tapAvg]);

const tapMinMaxYMax = useMemo(
  () => tapMinMaxPoints.reduce((m, p) => Math.max(m, Number(p.max || 0), Number(p.avg || 0)), 0),
  [tapMinMaxPoints]
);
  const beforeSeriesPoints = useMemo(() => makeSeries("ก่อน"), [makeSeries]);
  const afterSeriesPoints = useMemo(() => makeSeries("หลัง"), [makeSeries]);
  const getMaxY = (pts: Array<{ x: any; y: number }>) => pts.reduce((m, p) => Math.max(m, Number(p?.y || 0)), 0);

  const monthKeysForGarbage = useMemo(() => {
    const [start, end] = dateRange?.length === 2 ? [dateRange[0].startOf("month"), dateRange[1].endOf("month")] : [dayjs().subtract(11, "month").startOf("month"), dayjs().endOf("month")];
    const arr: string[] = []; let cur = start.clone(); while (cur.isSame(end) || cur.isBefore(end)) { arr.push(cur.format("YYYY-MM")); cur = cur.add(1, "month"); } return arr;
  }, [dateRange, filterMode, latestGraphDate]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isGarbageEnv || !selectedParamName) return;
      if (!monthKeysForGarbage || monthKeysForGarbage.length === 0) return;
      try {
        setGarbageLoading(true); setGarbageError(null);
        const keys = monthKeysForGarbage;
        const results = await Promise.all(keys.map(m => fetchWasteMixMonthSafe(m)));
        if (cancelled) return;
        const pts: Array<{ x: string; y: number }> = [];
        results.forEach((items, idx) => {
          const month = keys[idx]; const label = dayjs(month + "-01").format("MMM YYYY");
          const rec = (items || []).find((it: any) => norm(it.parameter) === norm(selectedParamName));
          const y = rec ? Number(dFix(rec.total || 0)) : 0; pts.push({ x: label, y });
        });
        setGarbageSeries(pts);
      } catch (e: any) { if (!cancelled) { setGarbageSeries([]); setGarbageError(e?.message || "โหลดข้อมูลขยะไม่สำเร็จ"); } }
      finally { if (!cancelled) setGarbageLoading(false); }
    };
    run(); return () => { cancelled = true; };
  }, [isGarbageEnv, selectedParamName, monthKeysForGarbage]);

  const mainYMaxHint = useMemo(() => {
    if (isGarbageEnv) return getMaxY(garbageSeries);
    if (SINGLE_ENV_NAMES.has(envName)) return getMaxY(singleSeriesPoints);
    if (view === "before") return getMaxY(beforeSeriesPoints);
    if (view === "after") return getMaxY(afterSeriesPoints);
    return Math.max(getMaxY(beforeSeriesPoints), getMaxY(afterSeriesPoints));
  }, [isGarbageEnv, envName, view, garbageSeries, singleSeriesPoints, beforeSeriesPoints, afterSeriesPoints]);

  useEffect(() => {
    if (!isGarbageEnv || !selectedParamName) { setCompareMonthlyGarbageQuantity([]); return; }
    const peopleByMonth: Record<string, number> = {};
    recycledRowsAll.forEach(r => { const k = dayjs(r.Date).format("YYYY-MM"); peopleByMonth[k] = (peopleByMonth[k] || 0) + Number(r.Quantity || 0); });
    (async () => {
      const keys = monthKeysForGarbage; const results = await Promise.all(keys.map(m => fetchWasteMixMonthSafe(m)));
      const rows: { label: string; monthKey: string; waste: number; people: number; unit: string }[] = [];
      results.forEach((items, idx) => {
        const monthKey = keys[idx]; const label = dayjs(monthKey + "-01").format("MMM YYYY");
        const rec = (items || []).find((it: any) => norm(it.parameter) === norm(selectedParamName));
        rows.push({ label, monthKey, waste: rec ? Number(dFix(rec.total || 0)) : 0, people: peopleByMonth[monthKey] || 0, unit: rec?.unit || "kg" });
      });
      setCompareMonthlyGarbageQuantity(rows);
    })();
  }, [isGarbageEnv, selectedParamName, monthKeysForGarbage, recycledRowsAll]);

  const garbageNormSeries = useMemo(() => {
    const wasteArr = compareMonthlyGarbageQuantity.map(d => d.waste);
    const peopleArr = compareMonthlyGarbageQuantity.map(d => d.people);
    return [
      { name: `${selectedParamName || "ค่าขยะ"} (Normalize)`, data: normalizeMinMax(wasteArr), color: chartColor.garbageNormWaste },
      { name: "จำนวนคน (Normalize)", data: normalizeMinMax(peopleArr), color: chartColor.garbageNormPeople },
    ];
  }, [compareMonthlyGarbageQuantity, chartColor.garbageNormWaste, chartColor.garbageNormPeople, selectedParamName]);

  const garbageNormOptions: ApexOptions = useMemo(() => ({
    chart: { type: garbageNormChartType, fontFamily: "Prompt, 'Prompt', sans-serif", toolbar: { show: true } },
    xaxis: { categories: compareMonthlyGarbageQuantity.map(d => d.label), title: { text: "วัน/เดือน/ปี" }, labels: { rotate: -45 }, tooltip: { enabled: false } },
    yaxis: [{ min: 0, max: 1, title: { text: "Normalized" }, labels: { formatter: v => (+v).toFixed(2) } }],
    dataLabels: { enabled: false },
    stroke: garbageNormChartType === "line" ? { show: true, curve: "smooth", width: 3 } : { show: false },
    markers: garbageNormChartType === "line" ? { size: 4.5, shape: ["circle", "triangle"], hover: { sizeOffset: 3 } } : { size: 0 },
    legend: { position: "top", horizontalAlign: "center" },
    tooltip: {
      y: {
        formatter: (_n: number, opts) => {
          const i = opts.dataPointIndex; const sName = opts.w.config.series[opts.seriesIndex]?.name ?? ""; const row = compareMonthlyGarbageQuantity[i]; if (!row) return "-";
          if (sName.includes("ขยะ")) return `${row.waste.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.unit}`;
          if (sName.includes("จำนวนคน")) return `${row.people.toLocaleString()} คน`;
          return _n.toFixed(2);
        },
      },
    },
  }), [garbageNormChartType, compareMonthlyGarbageQuantity]);

  const effSeriesData = useMemo(() => {
    if (!isWastewater) return [];
    const beforeBuckets: Record<string, number[]> = {}; const afterBuckets: Record<string, number[]> = {};
    (filteredData || []).forEach(d => {
      if (d.parameter !== selectedParamName) return; const k = keyFromDate(d.date, filterMode); const v = Number(dFix(d.value));
      if (d.treatment === "ก่อน") (beforeBuckets[k] ||= []).push(v); if (d.treatment === "หลัง") (afterBuckets[k] ||= []).push(v);
    });
    const dataPoints = labelsKeys.map(k => {
      const bArr = beforeBuckets[k] || []; const aArr = afterBuckets[k] || [];
      const avgBefore = bArr.length ? bArr.reduce((s, x) => s + x, 0) / bArr.length : 0;
      const avgAfter = aArr.length ? aArr.reduce((s, x) => s + x, 0) / aArr.length : 0;
      const pct = avgBefore > 0 ? Math.max(0, ((avgBefore - avgAfter) / avgBefore) * 100) : 0;
      return +pct.toFixed(2);
    });
    return [{ name: "Efficiency", data: dataPoints, color: chartColor.efficiency }];
  }, [filteredData, selectedParamName, filterMode, labelsKeys, chartColor.efficiency, isWastewater]);

const buildOpts = useCallback((
  title: string,
  showStandard = true,
  yMaxHint?: number,
  categoriesOverride?: string[]            // เพิ่มพารามิเตอร์ตัวที่ 4
): ApexOptions => {
  const isEfficiency = /efficiency/i.test(title) || title.includes("ประสิทธิภาพ");
  const ann: NonNullable<ApexOptions["annotations"]> = { yaxis: [], xaxis: [], points: [], texts: [], images: [] };

  if (showStandard && !isEfficiency && !isGarbage && (stdMode !== "none")) {
    if (stdMode === "middle" && hasVal(stdMid)) {
      ann.yaxis!.push({
        y: Number(stdMid),
        strokeDashArray: 6,
        borderColor: "#FF6F61",
        borderWidth: 1.5,
        label: {
          borderColor: "#FF6F61",
          style: { color: "#fff", background: "#FF6F61" },
          offsetY: -8,
          text: `มาตรฐาน ${Number(stdMid).toLocaleString("th-TH", { maximumFractionDigits: 2 })}${selectedParamUnit ? " " + selectedParamUnit : ""}`
        }
      });
    } else {
      if (hasVal(stdLow)) ann.yaxis!.push({
        y: Number(stdLow),
        strokeDashArray: 6,
        borderColor: "rgba(255, 163, 24, 0.77)",
        borderWidth: 1.5,
        label: {
          borderColor: "rgba(255, 163, 24, 0.77)",
          style: { color: "#fff", background: "rgba(255, 163, 24, 0.77)" },
          offsetY: -8,
          text: `มาตรฐานต่ำสุด ${Number(stdLow).toLocaleString("th-TH", { maximumFractionDigits: 2 })}${selectedParamUnit ? " " + selectedParamUnit : ""}`
        }
      });
      if (hasVal(stdHigh)) ann.yaxis!.push({
        y: Number(stdHigh),
        strokeDashArray: 6,
        borderColor: "#035303ff",
        borderWidth: 1.5,
        label: {
          borderColor: "#035303ff",
          style: { color: "#fff", background: "rgba(3,83,3,0.6)" },
          offsetY: -8,
          text: `มาตรฐานสูงสุด ${Number(stdHigh).toLocaleString("th-TH", { maximumFractionDigits: 2 })}${selectedParamUnit ? " " + selectedParamUnit : ""}`
        }
      });
    }
  }

  const stdCeil = !isEfficiency && showStandard && !isGarbage
    ? (stdMode === "middle"
        ? (hasVal(stdMid) ? Number(stdMid) : 0)
        : Math.max(hasVal(stdHigh) ? Number(stdHigh) : 0, hasVal(stdLow) ? Number(stdLow) : 0))
    : 0;
  const suggestedMax = Math.max(Number(yMaxHint || 0), stdCeil) > 0
    ? Math.max(Number(yMaxHint || 0), stdCeil) * 1.1
    : undefined;

  return {
    chart: { zoom: { enabled: true, type: "x", autoScaleYaxis: true }, foreColor: "#475467", fontFamily: "Prompt, 'Prompt', sans-serif", toolbar: { show: true } },
    grid: { borderColor: "#e5e7eb", strokeDashArray: 3 },
    plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { width: 2, curve: "smooth" },
    markers: { size: 4.5, strokeWidth: 2, hover: { sizeOffset: 2 } },

    xaxis: {
      // ใช้ categoriesOverride ถ้ามี (กราฟขวาจะส่งมาจาก tapAggLabels)
      categories: categoriesOverride ??
        (isGarbage ? garbageSeries.map(p => p.x)
                   : isSingleEnv ? singleSeriesPoints.map(p => p.x)
                                 : labels),
      tickPlacement: "on",
      tickAmount: Math.min(
        (categoriesOverride?.length ??
          (isGarbage ? garbageSeries.length : isSingleEnv ? singleSeriesPoints.length : labels.length)),
        6
      ),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { show: true, rotate: -45, trim: false, style: { fontSize: "12px", fontWeight: 500, colors: "#475467" }, offsetX: -4 },
      tooltip: { enabled: false },
    },

    yaxis: {
      forceNiceScale: true, min: 0, max: isEfficiency ? 100 : suggestedMax,
      title: { text: isEfficiency ? "เปอร์เซ็น ( % )" : isGarbage ? "หน่วย: kg" : selectedParamUnit ? `หน่วย: ${selectedParamUnit}` : "" },
      labels: { show: true, style: { fontSize: "12px", fontWeight: 500, colors: "#475467" }, formatter: (v: number) => (isEfficiency ? `${v.toFixed(2)}%` : fmt2(v)) },
    },

    annotations: ann,
    title: { text: title, align: "left" },
    tooltip: {
      x: {
        formatter: (_: any, opt: any) =>
          (isGarbage ? garbageSeries?.[opt?.dataPointIndex]?.x ?? ""
                     : isSingleEnv ? singleSeriesPoints?.[opt?.dataPointIndex]?.x ?? ""
                                   : opt?.w?.globals?.categoryLabels?.[opt?.dataPointIndex] ?? "")
      },
      y: { formatter: (v: number) => (isEfficiency ? `${v.toFixed(2)}%` : `${fmt2(v)}${isGarbage ? " kg" : selectedParamUnit ? " " + selectedParamUnit : ""}`) },
    },
    legend: { position: "top" },
  };
}, [labels, isGarbage, isSingleEnv, stdMode, stdLow, stdHigh, stdMid, selectedParamUnit, garbageSeries, singleSeriesPoints]);
  
  const wastePieSeries = useMemo(
  () => (wasteMix || []).map(w => Number(dFix(w.total || 0))),
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
      formatter: (seriesName, opts) => {
        const pct =
          (opts?.w?.globals?.seriesPercent?.[opts.seriesIndex]?.[0] as number) || 0;
        return `${seriesName} — ${pct.toFixed(2)}%`;
      },
    },

    // ✅ เปิด dataLabels + บังคับให้โชว์ทุกชิ้น
    dataLabels: {
      enabled: true,
      formatter: (val: number | string) =>
        `${(typeof val === "number" ? val : Number(val)).toFixed(2)}%`,
      style: { fontSize: "12px", fontWeight: 700, colors: ["#FFFFFF"] },
      dropShadow: { enabled: false },
    },

    stroke: { width: 0 },

    tooltip: {
      theme: "dark",
      y: {
        formatter: (val: number, opts) =>
          `${fmt2(val)} ${(wasteMix[opts.seriesIndex] as any)?.unit || "kg"}`,
      },
    },

    plotOptions: {
      pie: {
        dataLabels: {
          offset: -6,
          minAngleToShowLabel: 0,   // 👈 สำคัญ: ไม่ซ่อนแม้ชิ้นเล็กมาก
        },
        donut: {
          size: "64%",
          labels: {
            show: true,
            name: { show: true, fontSize: "14px", fontWeight: 600 },
            value: {
              show: true,
              fontSize: "22px",
              fontWeight: 800,
              formatter: (v: string) => fmt2(v),
            },
            total: {
              show: true,
              label: "รวม",
              fontSize: "13px",
              color: "##000000",
              formatter: (w) => {
                const s =
                  (w?.globals?.seriesTotals as number[] | undefined)?.reduce(
                    (a, b) => a + b,
                    0
                  ) || 0;
                return fmt2(s);
              },
            },
          },
        },
      },
    },

    colors: [
      "#8a6c12ff",
      "#ff2121ff",
      "#4452efff",
      "#22C55E",
      "#35cdd5ff",
      "#06B6D4",
      "#D946EF",
      "#E11D48",
    ],
    states: {
      hover: { filter: { type: "lighten", value: 0.02 } },
      active: { filter: { type: "darken", value: 0.04 } },
    },

    // (ทางเลือก) ย่อฟอนต์บนจอเล็ก กันชนกัน
    responsive: [
      {
        breakpoint: 640,
        options: {
          dataLabels: { style: { fontSize: "10px" } },
          plotOptions: { pie: { dataLabels: { offset: -4 } } },
          legend: { fontSize: "10px" },
        },
      },
    ],
  }),
  [wasteMix]
);

  const donutOptions: ApexOptions = useMemo(() => ({
    chart: { type: "donut", fontFamily: "Prompt, 'Prompt', sans-serif" }, labels: donutMonths,
    legend: { position: "right", horizontalAlign: "left", offsetY: -10, markers: { size: 6 }, fontSize: "11px" },
    dataLabels: { enabled: false }, stroke: { show: false }, tooltip: { y: { formatter: (val: number) => `${fmt2(val)} บาท` } },
    colors: ["#99d4fdff","#fcf080ff","#8ae98dff","#fd8591ff","#f8ae89ff","#b497ecff","#80CBC4","#CE93D8","#FFCC80","#A5D6A7","#EF9A9A","#90CAF9"],
  }), [donutMonths]);

  const qtyDonutOptions: ApexOptions = useMemo(() => ({
    chart: { type: "donut", fontFamily: "Prompt, 'Prompt', sans-serif" }, labels: qtyMonths,
    legend: { position: "right", horizontalAlign: "left", offsetY: -10, markers: { size: 6 }, fontSize: "11px" },
    dataLabels: { enabled: false }, stroke: { show: false }, tooltip: { y: { formatter: (val: number) => `${fmt0(val)} คน` } },
    colors: ["#A3F7BF","#A3E0FF","#FFE29A","#FFADB0","#D5B8FF","#9AD1B9","#FFCC80","#90CAF9","#CE93D8","#A5D6A7","#EF9A9A","#80CBC4"],
  }), [qtyMonths]);

  const graphHeight = !isGarbage && bellAlerts.length > 0 ? 350 : 400;

  return (
    <>
      <div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-4 sm:px-6 lg:px-8 py-6 rounded-b-3xl w-full mt-16 md:mt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold drop-shadow-md">การตรวจวัดคุณภาพสิ่งแวดล้อม</h1>
            <p className="text-sm drop-shadow-sm leading-snug">โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
          </div>
          <div className="bg-white/90 border border-cyan-200 px-5 py-4 rounded-xl text-center min-w-[300px] shadow-lg">
            <h3 className="text-base font-medium text-cyan-800 mb-2 leading-snug">ค่า TDS น้ำเสียหลังบำบัด (คาดการณ์เดือนถัดไป)</h3>
            {predictionLoading ? <p className="text-gray-600 m-0">กำลังคำนวณ...</p> : predictionError ? <p className="text-red-600 m-0">ไม่สามารถดึงค่าทำนายได้: {predictionError}</p> : <div className="text-2xl font-bold text-cyan-900">{predictionData ? Number(predictionData.prediction).toFixed(2) : "-"}</div>}
          </div>
        </div>
      </div>

      <div className="content-wrapper">
        <div className="container-xl">
          <Card className="dashboard-controls-card card-bleed" bordered={false}>
            <div className="controls-teal compact">
              <div className="controls-row">
                <div className="controls-field">
                  <label>สภาพแวดล้อม</label>
                  <Select size="small" style={{ width: 120 }} value={selectedEnvId ?? undefined} onChange={(v) => {
                    setSelectedEnvId(v);
                    const all = metas.find(e => e.id === v)?.params ?? [];
                    const deduped = Array.from(new Map(all.map(p => [norm(p.name || ""), p])).values());
                    setSelectedParamId(deduped.length ? deduped[0].id : null); setAutoRange(true);
                  }} options={metas.map(e => ({ value: e.id, label: e.name }))} dropdownMatchSelectWidth={false} />
                </div>

                <div className="controls-field">
                  <label>พารามิเตอร์</label>
                  <Select size="small" style={{ width: 180, marginRight: 4 }} value={selectedParamId ?? undefined} onChange={(v) => { setSelectedParamId(v); setAutoRange(true); }} options={paramList.map(p => ({ value: p.id, label: p.name }))} dropdownMatchSelectWidth={false} />
                </div>

                {!isGarbage && !isSingleEnv && (
                  <div className="controls-field">
                    <label>มุมมอง</label>
                    <Select size="small" style={{ width: 150, marginLeft: 4 }} value={view} onChange={setView} options={[{ label: "น้ำก่อนบำบัด", value: "before" }, { label: "น้ำหลังบำบัด", value: "after" }, { label: "เปรียบเทียบก่อน–หลัง", value: "compare" }]} dropdownMatchSelectWidth={false} />
                  </div>
                )}

                <div className="controls-field">
                  <label>ช่วงเวลา</label>
                  <Select size="small" style={{ width: 100 }} value={filterMode} onChange={(val) => {
                    setFilterMode(val as FilterMode); setAutoRange(true);
                    const base = latestGraphDate && latestGraphDate.isValid() ? latestGraphDate : dayjs();
                    const def = val === "year" ? [base.subtract(11, "month").startOf("month"), base.endOf("month")] as [Dayjs, Dayjs]
                      : val === "month" ? [base.startOf("month"), base.endOf("month")] as [Dayjs, Dayjs]
                      : [base.subtract(6, "day").startOf("day"), base.endOf("day")] as [Dayjs, Dayjs];
                    setDateRange(def);
                  }} options={[{ label: "ช่วงวัน", value: "dateRange" }, { label: "เดือน", value: "month" }, { label: "ปี", value: "year" }]} dropdownMatchSelectWidth={false} />
                </div>

                <div className="controls-field">
                  <label>เลือกวันที่</label>
                  {filterMode === "dateRange" && (
                    <DatePicker.RangePicker size="small" style={{ width: 200, marginLeft: -15 }} value={dateRange as [Dayjs, Dayjs] | undefined} onChange={(dates) => { setAutoRange(false); setDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null); }} locale={th_TH} placeholder={["เริ่ม", "สิ้นสุด"]} allowClear />
                  )}
                  {filterMode === "month" && (
                    <DatePicker size="small" style={{ width: 100 }} picker="month" value={dateRange ? dateRange[0] : null} onChange={(d) => { setAutoRange(false); setDateRange(d ? [d.startOf("month"), d.endOf("month")] : null); }} locale={th_TH} placeholder="เดือน" allowClear />
                  )}
                  {filterMode === "year" && (
                    <DatePicker.RangePicker size="small" style={{ width: 170 }} picker="year" value={dateRange as [Dayjs, Dayjs] | undefined} onChange={(dates) => { setAutoRange(false); setDateRange(dates && dates[0] && dates[1] ? [dates[0].startOf("year"), dates[1].endOf("year")] : null); }} locale={th_TH} placeholder={["ปีต้น", "ปีท้าย"]} allowClear format="BBBB" inputReadOnly />
                  )}
                </div>

                <div className="controls-field">
                  <label>ประเภทกราฟ</label>
                  <Segmented size="small" style={{ width: 85 }} value={chartType} onChange={(v) => setChartType(v as "line" | "bar")} options={[{ label: "เส้น", value: "line" }, { label: "แท่ง", value: "bar" }]} />
                </div>
              </div>
            </div>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card">
                <div className="dashboard-head-graph-card">
                  <div className="dashboard-head-title">
                    {isGarbage ? selectedParamName || "ปริมาณขยะ" : isSingleEnv ? selectedParamName || envName : view === "before" ? "น้ำก่อนบำบัด" : view === "after" ? "น้ำหลังบำบัด" : "เปรียบเทียบก่อน-หลัง"}
                  </div>
                  <div className="dashboard-head-controls">
                    {isGarbage && <ColorPicker value={chartColor.garbage} onChange={(c: Color) => setChartColor({ ...chartColor, garbage: c.toHexString() })} />}
                    {!isGarbage && (isSingleEnv || view === "before" || view === "after") && (
                      <ColorPicker value={isSingleEnv || view === "after" ? chartColor.after : chartColor.before} onChange={(c: Color) => { const hex = c.toHexString(); if (isSingleEnv || view === "after") setChartColor({ ...chartColor, after: hex }); else setChartColor({ ...chartColor, before: hex }); }} />
                    )}
                    {!isGarbage && !isSingleEnv && view === "compare" && (
                      <>
                        <ColorPicker value={chartColor.compareBefore} onChange={(c) => setChartColor({ ...chartColor, compareBefore: c.toHexString() })} />
                        <ColorPicker value={chartColor.compareAfter} onChange={(c) => setChartColor({ ...chartColor, compareAfter: c.toHexString() })} />
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

            {isGarbage && (
              <Col xs={24} lg={12}>
                <div className="dashboard-graph-card card">
                  <div className="dashboard-head-graph-card">
                    <div className="dashboard-head-title">ขยะต่อคนที่เข้าใช้บริการ (Normalize)</div>
                    <div className="dashboard-head-controls" style={{ gap: 8, display: "flex" }}>
                      <ColorPicker value={chartColor.garbageNormWaste} onChange={(c) => setChartColor(s => ({ ...s, garbageNormWaste: c.toHexString() }))} />
                      <ColorPicker value={chartColor.garbageNormPeople} onChange={(c) => setChartColor(s => ({ ...s, garbageNormPeople: c.toHexString() }))} />
                      <Segmented size="small" style={{ width: 85 }} value={garbageNormChartType} onChange={(v) => setGarbageNormChartType(v as "line" | "bar")} options={[{ label: "เส้น", value: "line" }, { label: "แท่ง", value: "bar" }]} />
                    </div>
                  </div>
                  <ApexChart key={`norm-${selectedParamName}-${garbageNormChartType}`} options={garbageNormOptions} series={garbageNormSeries} type={garbageNormChartType} height={graphHeight} />
                </div>
              </Col>
            )}

            {!isGarbage && isWastewater && (
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

            {isSingleEnv && (
              <Col xs={24} lg={12}>
                <div className="dashboard-graph-card card">
                  <div className="dashboard-head-graph-card">
                    <div className="dashboard-head-title">ค่าสูงสุด / ต่ำสุด</div>
                    <div className="dashboard-head-controls">
                      <ColorPicker value={chartColor.tapMax} onChange={(c) => setChartColor(s => ({ ...s, tapMax: c.toHexString() }))} />
                      <ColorPicker value={chartColor.tapMin} onChange={(c) => setChartColor(s => ({ ...s, tapMin: c.toHexString() }))} />
                      <ColorPicker value={chartColor.tapAvg} onChange={(c) => setChartColor(s => ({ ...s, tapAvg: c.toHexString() }))} />
                    </div>
                  </div>
                  <ApexChart
                    options={buildOpts("ค่าสูงสุด/ต่ำสุด/เฉลี่ย", true, tapMinMaxYMax, tapAggLabels)}  // ⬅️ ส่ง tapAggLabels เข้าไป
                    series={tapMinMaxSeries}
                    type={chartType}
                    height={graphHeight}
                  />
                </div>
              </Col>
            )}
          </Row>

          <Card className="dashboard-alerts-card card-bleed" bordered={false}>
            <div className="teal-surface">
              <div className="teal-title">การแจ้งเตือนล่าสุด</div>
              {bellLoading ? (
                <div>กำลังโหลด...</div>
              ) : bellError ? (
                <div style={{ color: "#ffe2e2", fontWeight: 600 }}>{bellError}</div>
              ) : bellAlerts.length === 0 ? (
                <div style={{ opacity: 0.95 }}>ไม่มีการแจ้งเตือน</div>
              ) : (
                <div className="alert-chip-row">
                  {bellAlerts.map((item, idx) => {
                    const dt = new Date(item?.data?.Date);
                    const date = dt.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
                    const time = dt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                    const title = item.type === "garbage"
                      ? `${item?.data?.Parameter?.ParameterName ?? "-"} ${item?.data?.Status?.StatusName ?? "-"}`
                      : `${item?.data?.Parameter?.ParameterName ?? "-"} ของ${item?.data?.Environment?.EnvironmentName ?? "-"} ${item?.data?.Status?.StatusName ?? "-"}`;
                    const desc = `ค่าที่ตรวจพบ: ${fmt2(item?.data?.Data ?? item?.data?.Quantity ?? 0)} ${item?.data?.Unit?.UnitName ?? "-"}\nวันที่บันทึก: ${date} เวลา: ${time} น.`;
                    return (<div key={idx} className="alert-chip"><div className="title">{title}</div><div className="desc">{desc}</div></div>);
                  })}
                </div>
              )}
            </div>
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card pie-clean-card">
                <div className="pie-header">
                  <div className="teal-title-chip">สัดส่วนขยะ (ต่อเดือน)</div>
                  <DatePicker picker="month" value={wasteMonth} onChange={(d) => setWasteMonth(d ? d.startOf("month") : null)} locale={th_TH} allowClear={false} className="dashboard-picker month-picker-compact" placeholder="เลือกเดือน" />
                </div>
                {wasteLoading ? <div>กำลังโหลด...</div> : wasteError ? <div style={{ color: "red", fontWeight: 600 }}>{wasteError}</div> : wasteMix && wasteMix.length > 0 ? <ApexChart options={wastePieOptions} series={wastePieSeries} type="donut" height={287} /> : <div style={{ background: "#fafafa", borderRadius: 12, padding: 16 }}><Empty description="ไม่มีข้อมูลสัดส่วนขยะของเดือนนี้" /></div>}
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card card-bleed" style={{ overflow: "hidden" }}>
                <div style={{ position: "relative", width: "100%", borderRadius: 12, color: "#fff", overflow: "hidden", background: "linear-gradient(180deg, #2abdbf 0%, #1f9a9c 70%, #138486 100%)", padding: 16, minHeight: 180, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ zIndex: 1 }}>
                    <div style={{ fontSize: 18, opacity: 0.95, marginBottom: 8 }}>จำนวนยอดขายรวมขยะรีไซเคิลปี {donutYearThai ?? "-"}</div>
                    <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{fmt2(totalSaleYear)} บาท</div>
                    <div style={{ fontSize: 12, marginTop: 6, opacity: 0.95 }}>{lastRecordDate ? `Date per ${lastRecordDate}` : ""}</div>
                  </div>
                  <div style={{ zIndex: 1 }}><ApexChart options={donutOptions} series={donutSeries} type="donut" width={180} height={180} /></div>
                  <div style={{ position: "absolute", right: 0, top: 0, width: "60%", height: "60%", borderBottomLeftRadius: "100% 100%", background: "linear-gradient(135deg, rgba(219,218,218,0.45) 0%, rgba(255,255,255,0.25) 40%, rgba(255,255,255,0) 100%)", pointerEvents: "none" }} />
                </div>
              </div>

              <div className="dashboard-graph-card card card-bleed" style={{ overflow: "hidden", marginTop: 16 }}>
                <div style={{ position: "relative", width: "100%", borderRadius: 12, color: "#fff", overflow: "hidden", background: "linear-gradient(180deg, #2abdbf 0%, #1f9a9c 70%, #138486 100%)", padding: 16, minHeight: 180, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ zIndex: 1 }}>
                    <div style={{ fontSize: 18, opacity: 0.95, marginBottom: 8 }}>จำนวนคนที่เข้าใช้บริการรวมปี {donutYearThai ?? "-"}</div>
                    <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{fmt0(totalQtyYear)} คน</div>
                    <div style={{ fontSize: 12, marginTop: 6, opacity: 0.95 }}>{lastRecordDate ? `Date per ${lastRecordDate}` : ""}</div>
                  </div>
                  <div style={{ zIndex: 1 }}><ApexChart options={qtyDonutOptions} series={qtySeries} type="donut" width={180} height={180} /></div>
                  <div style={{ position: "absolute", right: 0, top: 0, width: "60%", height: "60%", borderBottomLeftRadius: "100% 100%", background: "linear-gradient(135deg, rgba(219,218,218,0.45) 0%, rgba(255,255,255,0.25) 40%, rgba(255,255,255,0) 100%)", pointerEvents: "none" }} />
                </div>
              </div>
            </Col>
          </Row>

          <Modal open={showAllAlerts} title="ประวัติการแจ้งเตือนทั้งหมด" footer={null} onCancel={() => setShowAllAlerts(false)} width={900}>
            <Table rowKey={(_, i) => String(i)} dataSource={[]} pagination={{ pageSize: 10 }} columns={[
              { title: "เดือน", dataIndex: "month_year" },
              { title: "พารามิเตอร์", dataIndex: "parameter" },
              { title: "ค่าเฉลี่ย", dataIndex: "average", render: (v: number, r) => `${fmt2(v)} ${r.unit || ""}`.trim() },
              { title: "มาตรฐานสูงสุด", dataIndex: "max_value", render: (v: number, r) => `${fmt2(v)} ${r.unit || ""}`.trim() },
              { title: "สถานะ", dataIndex: "exceed" },
            ]} />
          </Modal>

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
                  : [{ name: "ก่อน", data: beforeSeriesPoints, color: chartColor.compareBefore }, { name: "หลัง", data: afterSeriesPoints, color: chartColor.compareAfter }]
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
