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
  // types เดิม
  type RecordItem,
  type EfficiencyItem,
  // ====== service ใหม่สำหรับ “ขยะ” ======
  GetWasteMixByMonth,
  GetRecycledRevenue,
  GetWasteMix,
  type WasteMixItem,
  type RecycledRevenuePoint,
} from "../../services/DashboardService";

// ===== CSS =====
import "./dashboard.css";
import "./skydash-override.css";

// ===== dayjs thai =====
import "dayjs/locale/th";
dayjs.locale("th");

const { RangePicker } = DatePicker;

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

// แยกโหมดช่วงเวลาของกราฟ "รายได้รีไซเคิล"
type RevFilterMode = "dateRange" | "month" | "year";

/* =========================================================================
   HELPERS
   ========================================================================= */

// key สำหรับ group ตามโหมด filter
const keyFromDate = (iso: string, mode: FilterMode) => {
  const d = dayjs(iso);
  if (mode === "year") return d.startOf("month").format("YYYY-MM"); // รายเดือน
  return d.format("YYYY-MM-DD"); // รายวัน
};

// label ภาษาไทยจาก key
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

// สร้างช่วงคีย์
const createDateRangeKeys = (
  start: Dayjs,
  end: Dayjs,
  mode: FilterMode
): string[] => {
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

// fixed number
function dFix(n: any) {
  const f = Number(n);
  if (!Number.isFinite(f)) return 0;
  return +f.toFixed(3);
}

/* =========================================================================
   MAIN
   ========================================================================= */
const AdminDashboard: React.FC = () => {
  // meta
  const [metas, setMetas] = useState<EnvMeta[]>([]);
  const [metaLoading, setMetaLoading] = useState<boolean>(false);
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

  // filters (ฝั่งน้ำ) – ใช้คุมช่วงเวลาให้กราฟ "ขยะ" ด้วย
  const [filterMode, setFilterMode] = useState<FilterMode>("year");
  const [dateRange, setDateRange] = useState<Dayjs[] | null>([
    dayjs().startOf("year"),
    dayjs().endOf("year"),
  ]);

  // colors
  const [chartColor, setChartColor] = useState({
    before: "#00C2C7",
    after: "#33E944",
    compareBefore: "#00C2C7",
    compareAfter: "#7B61FF",
    efficiency: "#faad14",
  });

  // prediction box
  const [predictionData, setPredictionData] = useState<PredictionOutput | null>(
    null
  );
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // ====== ขยะ (ใหม่) ======
  const [wasteMix, setWasteMix] = useState<WasteMixItem[]>([]);
  const [wasteLoading, setWasteLoading] = useState<boolean>(false);
  const [wasteError, setWasteError] = useState<string | null>(null);

  // ===== รายได้รีไซเคิล =====
  const [revenue, setRevenue] = useState<RecycledRevenuePoint[]>([]);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // ช่วงเวลาของ "กราฟรายได้" แยกจากฝั่งน้ำ
  const [revFilterMode, setRevFilterMode] = useState<RevFilterMode>("year");
  const [revRange, setRevRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("year"),
    dayjs().endOf("year"),
  ]);

  // เลือกเดือนสำหรับกราฟวงกลมสัดส่วนขยะ
  const [wasteMonth, setWasteMonth] = useState<Dayjs | null>(
    dayjs().startOf("month")
  );

  // ---------- NEW: series สำหรับ "กราฟขยะรายประเภท" ----------
  const [garbageSeries, setGarbageSeries] = useState<Array<{ x: string; y: number }>>([]);
  const [garbageLoading, setGarbageLoading] = useState<boolean>(false);
  const [garbageError, setGarbageError] = useState<string | null>(null);

  /* ======================= LOAD META ======================= */
  useEffect(() => {
    let mounted = true;
    const run = async () => {
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
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  /* ======================= LOAD DATA (น้ำ) ======================= */
  const loadData = useCallback(async () => {
    try {
      setDataLoading(true);
      setDataError(null);

      const rec = await GetEnvironmentalRecords({
        date: undefined,
        type: undefined,
        view: "compare",
      });
      setRawData(rec ?? []);

      const eff = await GetEnvironmentalEfficiency({
        date: undefined,
        type: undefined,
        param: undefined,
      });
      setEfficiency(eff ?? null);
    } catch (err: any) {
      setDataError(err?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadData();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [loadData]);

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
    return () => {
      mounted = false;
    };
  }, []);

  /* ======================= LOAD WASTE & REVENUE ======================= */
  const reloadWasteAndRevenue = useCallback(async () => {
    // ===== WASTE MIX =====
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
      setWasteMix([]);
      setWasteError(e?.message || "โหลดสัดส่วนขยะไม่สำเร็จ");
    } finally {
      setWasteLoading(false);
    }

    // ===== RECYCLED REVENUE (ใช้ช่วงของตัวเอง) =====
    try {
      setRevenueLoading(true);
      setRevenueError(null);

      let startDay: string;
      let endDay: string;

      if (revFilterMode === "dateRange") {
        const s = revRange?.[0] ?? dayjs().startOf("year");
        const e = revRange?.[1] ?? dayjs().endOf("year");
        startDay = s.startOf("day").format("YYYY-MM-DD");
        endDay = e.endOf("day").format("YYYY-MM-DD");
      } else if (revFilterMode === "month") {
        const m = (revRange?.[0] ?? dayjs().startOf("month")).startOf("month");
        startDay = m.format("YYYY-MM-DD");
        endDay = m.endOf("month").format("YYYY-MM-DD");
      } else {
        const s = (revRange?.[0] ?? dayjs().startOf("year")).startOf("year");
        const e = (revRange?.[1] ?? dayjs().endOf("year")).endOf("year");
        startDay = s.format("YYYY-MM-DD");
        endDay = e.format("YYYY-MM-DD");
      }

      const rv = await GetRecycledRevenue({
        type: "range",
        start: startDay,
        end: endDay,
        group: "month",
      });
      setRevenue(Array.isArray(rv) ? rv : []);
    } catch (e: any) {
      setRevenue([]);
      setRevenueError(e?.message || "โหลดรายได้รีไซเคิลไม่สำเร็จ");
    } finally {
      setRevenueLoading(false);
    }
  }, [dateRange, wasteMonth, revRange, revFilterMode]);

  useEffect(() => {
    reloadWasteAndRevenue();
  }, [reloadWasteAndRevenue, wasteMonth]);

  /* ======================= DERIVED META ======================= */
  const selectedEnv = useMemo(
    () => metas.find((e) => e.id === selectedEnvId) || null,
    [metas, selectedEnvId]
  );

  // ดึง meta ของ param ที่เลือกจาก metas โดยตรง (ไม่พึ่ง list ที่ dedupe)
  const globalParamMeta = useMemo(() => {
    const env = metas.find((e) => e.id === selectedEnvId);
    return env?.params.find((p) => p.id === selectedParamId) || null;
  }, [metas, selectedEnvId, selectedParamId]);

  // dedupe param ชื่อซ้ำ
  const paramList = useMemo(() => {
    const list = selectedEnv?.params ?? [];
    const seen = new Set<string>();
    return list.filter((p) => {
      const key = (p.name || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedEnv]);

  const selectedParamMeta = useMemo(
    () => paramList.find((p) => p.id === selectedParamId) || null,
    [paramList, selectedParamId]
  );

  const isGarbage = selectedEnv?.name === "ขยะ";
  const selectedParamName =
    globalParamMeta?.name ?? selectedParamMeta?.name ?? "";
  const selectedParamUnit =
    globalParamMeta?.unit ?? selectedParamMeta?.unit ?? "";

  // มาตรฐานล่าสุดจาก META (ใช้กับ “น้ำ” เท่านั้น)
  const stdMin = globalParamMeta?.std_min ?? selectedParamMeta?.std_min ?? 0;
  const stdMiddle =
    globalParamMeta?.std_middle ?? selectedParamMeta?.std_middle ?? 0;
  const stdMax = globalParamMeta?.std_max ?? selectedParamMeta?.std_max ?? 0;

  // เลือกโหมดเส้นมาตรฐาน
  const { stdMode, stdLow, stdHigh, stdMid } = useMemo(() => {
    if (stdMiddle && Number(stdMiddle) !== 0) {
      return {
        stdMode: "middle" as StandardMode,
        stdLow: 0,
        stdHigh: 0,
        stdMid: Number(stdMiddle),
      };
    }
    const hasLow = stdMin && Number(stdMin) !== 0;
    const hasHigh = stdMax && Number(stdMax) !== 0;
    if (hasLow || hasHigh) {
      return {
        stdMode: "range" as StandardMode,
        stdLow: hasLow ? Number(stdMin) : 0,
        stdHigh: hasHigh ? Number(stdMax) : 0,
        stdMid: 0,
      };
    }
    return { stdMode: "none" as StandardMode, stdLow: 0, stdHigh: 0, stdMid: 0 };
  }, [stdMin, stdMiddle, stdMax]);

  /* ======================= FILTERED DATA (น้ำ) ======================= */
  const filteredData = useMemo(() => {
    // กรองตามช่วงวันก่อน
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

    // กรองตาม "สภาพแวดล้อม" (เทียบจากชื่อ)
    const envName = selectedEnv?.name?.trim().toLowerCase() || "";
    if (envName && envName !== "ขยะ") {
      base = base.filter(
        (d) => (d.environment || "").trim().toLowerCase() === envName
      );
    }

    // กรองตาม "พารามิเตอร์" ที่เลือก
    const paramName = (selectedParamName || "").trim().toLowerCase();
    if (paramName && envName !== "ขยะ") {
      base = base.filter(
        (d) => (d.parameter || "").trim().toLowerCase() === paramName
      );
    }

    return base;
  }, [rawData, dateRange, selectedEnv, selectedParamName]);

  // เดา view และขยายช่วงอัตโนมัติถ้ากรองแล้วว่าง
  useEffect(() => {
    if (isGarbage) {
      setView("after");
      return;
    }
    const hasBefore = (filteredData || []).some((d) => d.treatment === "ก่อน");
    const hasAfter = (filteredData || []).some((d) => d.treatment === "หลัง");
    if (hasBefore && hasAfter) setView("compare");
    else if (hasAfter) setView("after");
    else if (hasBefore) setView("before");
  }, [isGarbage, selectedEnvId, selectedParamId, filteredData]);

  useEffect(() => {
    if (isGarbage || (filteredData || []).length > 0) return;

    const envName = selectedEnv?.name?.trim().toLowerCase() || "";
    const paramName = (selectedParamName || "").trim().toLowerCase();
    const scope = (rawData || []).filter(
      (d) =>
        (d.environment || "").trim().toLowerCase() === envName &&
        (d.parameter || "").trim().toLowerCase() === paramName
    );
    if (scope.length === 0) return;

    const minD = dayjs(
      scope.reduce(
        (m, x) => (new Date(x.date) < m ? new Date(x.date) : m),
        new Date(scope[0].date)
      )
    );
    const maxD = dayjs(
      scope.reduce(
        (m, x) => (new Date(x.date) > m ? new Date(x.date) : m),
        new Date(scope[0].date)
      )
    );
    setDateRange([minD.startOf("day"), maxD.endOf("day")]);
  }, [filteredData, rawData, selectedEnv, selectedParamName, isGarbage]);

  /* ======================= LABELS/KEYS (สำหรับ “น้ำ”) ======================= */
  const { labelsKeys, labels } = useMemo(() => {
    if (isGarbage) return { labelsKeys: [], labels: [] };

    const filtered = (filteredData || []).filter(
      (d) => d.parameter === selectedParamName
    );

    const grouped: Record<string, true> = {};
    filtered.forEach((d) => {
      const k = keyFromDate(d.date, filterMode);
      grouped[k] = true;
    });

    let allDates: string[] = [];

    if (dateRange) {
      if (filterMode === "year") {
        const startYear = dateRange[0].year();
        const endYear = dateRange[1].year();
        allDates = Object.keys(grouped)
          .filter((m) => {
            const y = dayjs(m + "-01").year();
            return y >= startYear && y <= endYear;
          })
          .sort();
      } else if (filterMode === "month") {
        allDates = createDateRangeKeys(
          dateRange[0].startOf("month"),
          dateRange[1].endOf("month"),
          "dateRange"
        );
      } else {
        allDates = createDateRangeKeys(dateRange[0], dateRange[1], "dateRange");
      }
    }

    const niceLabels = allDates.map((k) => labelFromKey(k, filterMode));
    return { labelsKeys: allDates, labels: niceLabels };
  }, [filteredData, selectedParamName, filterMode, dateRange, isGarbage]);

  /* ======================= SERIES HELPERS (สำหรับ “น้ำ”) ======================= */
  const makeSeries = useCallback(
    (treatment: "ก่อน" | "หลัง") => {
      const tdata = filteredData.filter(
        (d) => d.parameter === selectedParamName && d.treatment === treatment
      );
      const buckets: Record<string, number[]> = {};
      tdata.forEach((d) => {
        const k = keyFromDate(d.date, filterMode);
        if (!buckets[k]) buckets[k] = [];
        buckets[k].push(Number(dFix(d.value)));
      });

      return labelsKeys.map((k, i) => {
        const vals = buckets[k];
        const avg =
          vals && vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return { x: labels[i], y: avg };
      });
    },
    [filteredData, selectedParamName, filterMode, labelsKeys, labels]
  );

  // points memo สำหรับใช้คำนวณเพดาน y
  const beforeSeriesPoints = useMemo(() => makeSeries("ก่อน"), [makeSeries]);
  const afterSeriesPoints = useMemo(() => makeSeries("หลัง"), [makeSeries]);

  const getMaxY = (pts: Array<{ x: any; y: number }>) =>
    pts.reduce((m, p) => Math.max(m, Number(p?.y || 0)), 0);

  /* ======================= NEW: เดือนทั้งหมดที่ต้องโหลดสำหรับกราฟขยะ ======================= */
  const monthKeysForGarbage = useMemo(() => {
    if (!dateRange || dateRange.length !== 2) return [];
    const start = dateRange[0].startOf("month");
    const end = dateRange[1].endOf("month");
    const arr: string[] = [];
    let cur = start.clone();
    while (cur.isSame(end) || cur.isBefore(end)) {
      arr.push(cur.format("YYYY-MM"));
      cur = cur.add(1, "month");
    }
    return arr;
  }, [dateRange]);

  /* ======================= NEW: โหลดซีรีส์ "ขยะรายประเภท" ======================= */
  useEffect(() => {
    const run = async () => {
      if (!isGarbage || !selectedParamName) {
        setGarbageSeries([]);
        setGarbageError(null);
        return;
      }
      if (monthKeysForGarbage.length === 0) {
        setGarbageSeries([]);
        setGarbageError(null);
        return;
      }
      try {
        setGarbageLoading(true);
        setGarbageError(null);

        // เรียก GetWasteMixByMonth ทุกเดือน แล้วหยิบ total ของ "พารามิเตอร์ขยะที่เลือก"
        const results = await Promise.all(
          monthKeysForGarbage.map((m) => GetWasteMixByMonth(m))
        );

        const points: Array<{ x: string; y: number }> = [];
        results.forEach((items, idx) => {
          const month = monthKeysForGarbage[idx]; // YYYY-MM
          const label = dayjs(month + "-01").format("MMM YYYY");
          const rec = (items || []).find(
            (it) => (it.parameter || "").trim() === selectedParamName
          );
          const y = rec ? Number(dFix(rec.total || 0)) : 0;
          points.push({ x: label, y });
        });

        setGarbageSeries(points);
      } catch (e: any) {
        setGarbageSeries([]);
        setGarbageError(e?.message || "โหลดข้อมูลขยะไม่สำเร็จ");
      } finally {
        setGarbageLoading(false);
      }
    };
    run();
  }, [isGarbage, selectedParamName, monthKeysForGarbage]);

  // hint เพดาน y-axis ของกราฟหลัก
  const mainYMaxHint = useMemo(() => {
    if (isGarbage) return getMaxY(garbageSeries);
    if (view === "before") return getMaxY(beforeSeriesPoints);
    if (view === "after") return getMaxY(afterSeriesPoints);
    return Math.max(getMaxY(beforeSeriesPoints), getMaxY(afterSeriesPoints));
  }, [isGarbage, view, garbageSeries, beforeSeriesPoints, afterSeriesPoints]);

  /* ======================= EFFICIENCY (น้ำ) ======================= */
  const effSeriesData = useMemo(() => {
    if (isGarbage) return [];

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
      const avgBefore =
        bArr.length ? bArr.reduce((s, x) => s + x, 0) / bArr.length : 0;
      const avgAfter =
        aArr.length ? aArr.reduce((s, x) => s + x, 0) / aArr.length : 0;
      const pct =
        avgBefore > 0 ? Math.max(0, ((avgBefore - avgAfter) / avgBefore) * 100) : 0;
      return +pct.toFixed(2);
    });

    return [{ name: "Efficiency", data: dataPoints, color: chartColor.efficiency }];
  }, [
    filteredData,
    selectedParamName,
    filterMode,
    labelsKeys,
    chartColor.efficiency,
    isGarbage,
  ]);

  /* ======================= ALERTS (เฉพาะน้ำ) ======================= */
  const alerts = useMemo(() => {
    if (isGarbage) return [];
    const byMonth: Record<
      string,
      { values: number[]; param: string; unit: string }
    > = {};
    filteredData.forEach((d) => {
      const key = new Date(d.date).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
      });
      if (!byMonth[key])
        byMonth[key] = { values: [], param: d.parameter, unit: d.unit };
      byMonth[key].values.push(Number(d.value));
    });
    const rows = Object.entries(byMonth).map(([month, v]) => {
      const avg =
        v.values.reduce((a, b) => a + b, 0) / Math.max(v.values.length, 1);
      const maxValue =
        stdMode === "middle"
          ? Number.POSITIVE_INFINITY
          : stdHigh || Number.POSITIVE_INFINITY;
      return {
        month_year: month,
        parameter: v.param,
        average: avg,
        max_value: maxValue,
        unit: v.unit,
      };
    });
    return rows.filter((r) => r.average > r.max_value);
  }, [filteredData, stdMode, stdHigh, isGarbage]);

  const latestAlerts = alerts.slice(0, 3);
  const historyAlerts = alerts.slice(3);

  /* ======================= OPTIONS: หลัก ======================= */
  const buildOpts = useCallback(
    (
      title: string,
      showStandard = true,
      yMaxHint?: number
    ): ApexOptions => {
      const isEfficiency =
        /efficiency/i.test(title) || title.includes("ประสิทธิภาพ");

    const baseAnnotations: NonNullable<ApexOptions["annotations"]> = {
      yaxis: [],
      xaxis: [],
      points: [],
      texts: [],
      images: [],
    };

      if (showStandard && !isEfficiency && !isGarbage && stdMode !== "none") {
        if (stdMode === "middle" && stdMid) {
          baseAnnotations.yaxis!.push({
            y: Number(stdMid),
            strokeDashArray: 6,
            borderColor: "#FF6F61",
            borderWidth: 1.5,
            label: {
              borderColor: "#FF6F61",
              style: { color: "#fff", background: "#FF6F61" },
              text: `มาตรฐาน ${Number(stdMid).toLocaleString("th-TH", {
                maximumFractionDigits: 2,
              })}${selectedParamUnit ? " " + selectedParamUnit : ""}`,
            },
          });
        } else {
          if (stdLow != null) {
            baseAnnotations.yaxis!.push({
              y: Number(stdLow),
              strokeDashArray: 6,
              borderColor: "rgba(255, 163, 24, 0.77)",
              borderWidth: 1.5,
              label: {
                borderColor: "rgba(255, 163, 24, 0.77)",
                style: {
                  color: "#fff",
                  background: "rgba(255, 163, 24, 0.77)",
                },
                text: `มาตรฐานต่ำสุด ${Number(stdLow).toLocaleString(
                  "th-TH",
                  { maximumFractionDigits: 2 }
                )}${selectedParamUnit ? " " + selectedParamUnit : ""}`,
              },
            });
          }
          if (stdHigh != null) {
            baseAnnotations.yaxis!.push({
              y: Number(stdHigh),
              strokeDashArray: 6,
              borderColor: "#035303ff",
              borderWidth: 1.5,
              label: {
                borderColor: "#035303ff",
                style: { color: "#fff", background: "rgba(3,83,3,0.6)" },
                text: `มาตรฐานสูงสุด ${Number(stdHigh).toLocaleString(
                  "th-TH",
                  { maximumFractionDigits: 2 }
                )}${selectedParamUnit ? " " + selectedParamUnit : ""}`,
              },
            });
          }
        }
      }

      const stdCeil =
        !isEfficiency && showStandard && !isGarbage
          ? stdMode === "middle"
            ? Number(stdMid || 0)
            : Math.max(Number(stdHigh || 0), Number(stdLow || 0))
          : 0;

      const suggestedMax =
        Math.max(Number(yMaxHint || 0), stdCeil) > 0
          ? Math.max(Number(yMaxHint || 0), stdCeil) * 1.1
          : undefined;

      return {
        chart: {
          zoom: { enabled: true, type: "x", autoScaleYaxis: true },
          foreColor: "#475467",
          fontFamily: "Prompt, 'Prompt', sans-serif",
          toolbar: { show: true },
        },
        grid: { borderColor: "#e5e7eb", strokeDashArray: 3 },
        plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
        dataLabels: { enabled: false },
        stroke: { width: 2, curve: "smooth" },
        markers: { size: 4.5, strokeWidth: 2, hover: { sizeOffset: 2 } },
        xaxis: {
          categories: isGarbage ? garbageSeries.map(p => p.x) : labels,
          tickPlacement: "on",
          tickAmount: Math.min((isGarbage ? garbageSeries.length : labels.length), 6),
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: {
            show: true,
            rotate: -45,
            trim: true,
            style: { fontSize: "12px", fontWeight: 500, colors: "#475467" },
          },
          tooltip: { enabled: false },
        },
        yaxis: {
          forceNiceScale: true,
          min: 0,
          max: isEfficiency ? 100 : suggestedMax,
          title: {
            text: isEfficiency
              ? "เปอร์เซ็น ( % )"
              : (isGarbage ? "หน่วย: kg" : (selectedParamUnit ? `หน่วย: ${selectedParamUnit}` : "")),
          },
          labels: {
            show: true,
            style: { fontSize: "12px", fontWeight: 500, colors: "#475467" },
            formatter: (v: number) =>
              isEfficiency
                ? `${v.toFixed(2)}%`
                : v.toLocaleString("th-TH", { maximumFractionDigits: 2 }),
          },
        },
        annotations: baseAnnotations,
        title: { text: title, align: "left" },
        tooltip: {
          x: {
            formatter: (_: any, opt: any) =>
              isGarbage
                ? (garbageSeries?.[opt?.dataPointIndex]?.x ?? "")
                : (opt?.w?.globals?.categoryLabels?.[opt?.dataPointIndex] ?? ""),
          },
          y: {
            formatter: (v: number) =>
              isEfficiency
                ? `${v.toFixed(2)}%`
                : `${Number(v).toLocaleString("th-TH", {
                    maximumFractionDigits: 2,
                  })}${isGarbage ? " kg" : (selectedParamUnit ? " " + selectedParamUnit : "")}`,
          },
        },
        legend: { position: "top" },
      };
    },
    [labels, isGarbage, stdMode, stdLow, stdHigh, stdMid, selectedParamUnit, garbageSeries]
  );

  /* ========= WASTE PIE OPTIONS ========= */
  const wastePieSeries = useMemo(
    () => (wasteMix || []).map((w) => Number(dFix(w.total || 0))),
    [wasteMix]
  );

  const wastePieOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: "pie" },
      labels: (wasteMix || []).map((w) => w.parameter),
      legend: { position: "bottom" },
      tooltip: {
        y: {
          formatter: (val: number, opts) => {
            const unit = wasteMix[opts.seriesIndex]?.unit || "kg";
            return `${val.toLocaleString("th-TH", { maximumFractionDigits: 2 })} ${unit}`;
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
      },
    }),
    [wasteMix]
  );

  /* ========= RECYCLED REVENUE OPTIONS ========= */
  const revenueSeries = useMemo(
    () => [
      {
        name: "รายได้รีไซเคิล",
        data: (revenue || []).map((r) => ({
          x: r.period,
          y: Number(dFix(r.total_sale)),
        })),
      },
    ],
    [revenue]
  );

  const revenueOpts: ApexOptions = useMemo(
    () => ({
      chart: { type: "line", zoom: { enabled: true } },
      stroke: { curve: "smooth", width: 2 },
      grid: { borderColor: "#e5e7eb", strokeDashArray: 3 },
      xaxis: {
        categories: (revenue || []).map((r) => r.period),
        labels: {
          rotate: -30,
          trim: true,
          style: { fontSize: "12px" },
        },
      },
      yaxis: {
        labels: {
          formatter: (v) =>
            `${v.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`,
        },
        title: { text: "บาท" },
      },
      tooltip: {
        y: {
          formatter: (v: number) =>
            `${v.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท`,
        },
      },
      legend: { position: "top" },
    }),
    [revenue]
  );

  /* ======================= GRAPH HEIGHT ======================= */
  const graphHeight = (!isGarbage && alerts.length > 0) ? 250 : 350;

  /* ======================= RENDER ======================= */
  return (
    <>
      {/* Header */}
<div className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-4 sm:px-6 lg:px-8 py-6 rounded-b-3xl mb-4 w-full">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    {/* Title + Desc */}
    <div>
      <h1 className="text-2xl font-semibold drop-shadow-md">
        การตรวจวัดคุณภาพสิ่งแวดล้อม
      </h1>
      <p className="text-sm drop-shadow-sm leading-snug">
        โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
      </p>
    </div>

    {/* Prediction Box */}
    <div className="bg-white/90 border border-cyan-200 px-5 py-4 rounded-xl text-center min-w-[300px] shadow-lg">
      <h3 className="text-base font-medium text-cyan-800 mb-2 leading-snug">
        ค่า TDS น้ำเสียหลังบำบัด (คาดการณ์เดือนถัดไป)
      </h3>
      {predictionLoading ? (
        <p className="text-gray-600 m-0">กำลังคำนวณ...</p>
      ) : predictionError ? (
        <p className="text-red-600 m-0">
          ไม่สามารถดึงค่าทำนายได้: {predictionError}
        </p>
      ) : (
        <div className="text-2xl font-bold text-cyan-900">
          {predictionData?.prediction.toFixed(3)}
        </div>
      )}
    </div>
  </div>
</div>


      {/* Body */}
      <div className="content-wrapper">
        <div className="container-xl">
          {/* Controls */}
          <Card className="dashboard-controls-card" bordered={false}>
            <Row gutter={[12, 12]} align="middle" className="dashboard-controls-row">
              {/* Environment */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label className="dashboard-label">สภาพแวดล้อม</label>
                <Select
                  value={selectedEnvId ?? undefined}
                  onChange={(v) => {
                    setSelectedEnvId(v);
                    const all = metas.find((e) => e.id === v)?.params ?? [];
                    const seen = new Set<string>();
                    const deduped = all.filter((p) => {
                      const k = (p.name || "")
                        .replace(/\s+/g, " ")
                        .trim()
                        .toLowerCase();
                      if (seen.has(k)) return false;
                      seen.add(k);
                      return true;
                    });
                    setSelectedParamId(deduped.length ? deduped[0].id : null);
                    if (v && metas.find((e) => e.id === v)?.name === "ขยะ") {
                      setView("after");
                    }
                  }}
                  className="dashboard-select"
                  placeholder="เลือกสภาพแวดล้อม"
                  allowClear={false}
                  loading={metaLoading}
                  options={metas.map((e) => ({ value: e.id, label: e.name }))}
                />
              </Col>

              {/* Parameter */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label className="dashboard-label">พารามิเตอร์</label>
                <Select
                  value={selectedParamId ?? undefined}
                  onChange={setSelectedParamId}
                  className="dashboard-select"
                  placeholder="เลือกพารามิเตอร์"
                  allowClear={false}
                  loading={metaLoading}
                  options={paramList.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                />
              </Col>

              {/* View */}
              {!isGarbage && (
                <Col xs={24} sm={12} md={8} lg={6}>
                  <label className="dashboard-label">มุมมอง</label>
                  <Select
                    value={view}
                    onChange={setView}
                    className="dashboard-select"
                    options={[
                      { label: "น้ำก่อนบำบัด", value: "before" },
                      { label: "น้ำหลังบำบัด", value: "after" },
                      { label: "เปรียบเทียบก่อน–หลัง", value: "compare" },
                    ]}
                  />
                </Col>
              )}

              {/* Filter mode */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <label className="dashboard-label">ช่วงเวลา</label>
                <Select
                  value={filterMode}
                  onChange={(val) => {
                    setFilterMode(val);
                    setDateRange(null);
                  }}
                  className="dashboard-select"
                  options={[
                    { label: "เลือกช่วงวัน", value: "dateRange" },
                    { label: "เลือกเดือน", value: "month" },
                    { label: "เลือกปี", value: "year" },
                  ]}
                />
              </Col>

              {/* Date pickers */}
              <Col xs={24} md={16} lg={12}>
                <label className="dashboard-label">เลือกวันที่</label>
                {filterMode === "dateRange" && (
                  <RangePicker
                    value={dateRange as [Dayjs, Dayjs] | undefined}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setDateRange([dates[0], dates[1]]);
                      } else {
                        setDateRange(null);
                      }
                    }}
                    locale={th_TH}
                    className="dashboard-picker"
                    placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                    allowClear
                  />
                )}
                {filterMode === "month" && (
                  <DatePicker
                    picker="month"
                    value={dateRange ? dateRange[0] : null}
                    onChange={(date) => {
                      if (date)
                        setDateRange([date.startOf("month"), date.endOf("month")]);
                      else setDateRange(null);
                    }}
                    locale={th_TH}
                    className="dashboard-picker"
                    placeholder="เลือกเดือน"
                    allowClear
                  />
                )}
                {filterMode === "year" && (
                  <DatePicker.RangePicker
                    picker="year"
                    value={dateRange as [Dayjs, Dayjs] | undefined}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1])
                        setDateRange([
                          dates[0].startOf("year"),
                          dates[1].endOf("year"),
                        ]);
                      else setDateRange(null);
                    }}
                    locale={th_TH}
                    className="dashboard-picker"
                    placeholder={["ปีเริ่มต้น", "ปีสิ้นสุด"]}
                    allowClear
                  />
                )}
              </Col>

              {/* Chart type */}
              <Col xs={24} md={8} lg={6}>
                <label className="dashboard-label">ประเภทกราฟ</label>
                <Segmented
                  className="dashboard-segmented"
                  options={[
                    { label: "เส้น", value: "line" },
                    { label: "แท่ง", value: "bar" },
                  ]}
                  value={chartType}
                  onChange={(v) => setChartType(v as "line" | "bar")}
                />
              </Col>
            </Row>
          </Card>

          {/* Graphs */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card">
                <div className="dashboard-head-graph-card">
                  <div className="dashboard-head-title">
                    {isGarbage
                      ? selectedParamName || "ปริมาณขยะ"
                      : view === "before"
                      ? "น้ำก่อนบำบัด"
                      : view === "after"
                      ? "น้ำหลังบำบัด"
                      : "เปรียบเทียบก่อน-หลัง"}
                  </div>
                  <div className="dashboard-head-controls">
                    {!isGarbage && (view === "before" || view === "after") && (
                      <ColorPicker
                        value={
                          view === "before" ? chartColor.before : chartColor.after
                        }
                        onChange={(c: Color) => {
                          const hex = c.toHexString();
                          if (view === "before")
                            setChartColor({ ...chartColor, before: hex });
                          else setChartColor({ ...chartColor, after: hex });
                        }}
                      />
                    )}
                    {!isGarbage && view === "compare" && (
                      <>
                        <ColorPicker
                          value={chartColor.compareBefore}
                          onChange={(c) =>
                            setChartColor({
                              ...chartColor,
                              compareBefore: c.toHexString(),
                            })
                          }
                        />
                        <ColorPicker
                          value={chartColor.compareAfter}
                          onChange={(c) =>
                            setChartColor({
                              ...chartColor,
                              compareAfter: c.toHexString(),
                            })
                          }
                        />
                      </>
                    )}
                    <Button
                      type="text"
                      icon={<Maximize2 size={18} />}
                      onClick={() => setShowModal(true)}
                    />
                  </div>
                </div>

                {isGarbage && garbageLoading ? (
                  <div style={{ padding: 16 }}>กำลังโหลด...</div>
                ) : isGarbage && garbageError ? (
                  <div style={{ padding: 16, color: "red" }}>{garbageError}</div>
                ) : (
                  <ApexChart
                    key={
                      String(selectedEnvId) +
                      String(selectedParamId) +
                      view +
                      chartType
                    }
                    options={buildOpts("", true, mainYMaxHint)}
                    series={
                      isGarbage
                        ? [
                            {
                              name: selectedParamName || "ปริมาณ",
                              data: garbageSeries,
                              color: chartColor.after,
                            },
                          ]
                        : view === "before"
                        ? [
                            {
                              name: "ก่อน",
                              data: beforeSeriesPoints,
                              color: chartColor.before,
                            },
                          ]
                        : view === "after"
                        ? [
                            {
                              name: "หลัง",
                              data: afterSeriesPoints,
                              color: chartColor.after,
                            },
                          ]
                        : [
                            {
                              name: "ก่อน",
                              data: beforeSeriesPoints,
                              color: chartColor.compareBefore,
                            },
                            {
                              name: "หลัง",
                              data: afterSeriesPoints,
                              color: chartColor.compareAfter,
                            },
                          ]
                    }
                    type={chartType}
                    height={graphHeight}
                  />
                )}
              </div>
            </Col>

            {!isGarbage && (
              <Col xs={24} lg={12}>
                <div className="dashboard-graph-card card">
                  <div className="dashboard-head-graph-card">
                    <div className="dashboard-head-title">ประสิทธิภาพ (%)</div>
                    <div className="dashboard-head-controls">
                      <ColorPicker
                        value={chartColor.efficiency}
                        onChange={(c) =>
                          setChartColor({
                            ...chartColor,
                            efficiency: c.toHexString(),
                          })
                        }
                      />
                    </div>
                  </div>
                  <ApexChart
                    options={buildOpts("Efficiency (%)", false)}
                    series={effSeriesData}
                    type="bar"
                    height={graphHeight}
                  />
                </div>
              </Col>
            )}
          </Row>

          {/* Alerts (ไม่แสดงเมื่อเป็นขยะ) */}
          {!isGarbage && (
            <Card className="dashboard-alerts-card" bordered={false}>
              {alerts.length > 0 ? (
                <>
                  <div className="dashboard-alerts-list">
                    {latestAlerts.map((a, i) => (
                      <div key={i} className="dashboard-alert-item">
                        <div>
                          <b>เดือน:</b> {a.month_year}
                        </div>
                        <div>
                          <b>พารามิเตอร์:</b> {a.parameter}
                        </div>
                        <div>
                          <b>ค่าเฉลี่ย:</b> {a.average.toFixed(2)} {a.unit}
                        </div>
                        <div>
                          <b>มาตรฐานสูงสุด:</b> {a.max_value.toFixed(2)} {a.unit}
                        </div>
                      </div>
                    ))}
                  </div>

                  {historyAlerts.length > 0 && (
                    <div style={{ marginTop: 12, textAlign: "right" }}>
                      <Button type="link" onClick={() => setShowAllAlerts(true)}>
                        ดูประวัติการแจ้งเตือนทั้งหมด
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: 12, color: "#666" }}>ไม่มีการแจ้งเตือน</div>
              )}
            </Card>
          )}

          {/* ====== SECTION: สัดส่วนขยะ + รายได้รีไซเคิล ====== */}
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            {/* ซ้าย: กราฟวงกลมสัดส่วนขยะ */}
            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card">
                <div
                  className="dashboard-head-graph-card"
                  style={{ alignItems: "center" }}
                >
                  <div className="dashboard-head-title">สัดส่วนขยะ (ต่อเดือน)</div>
                  <div>
                    <DatePicker
                      picker="month"
                      value={wasteMonth}
                      onChange={(d) =>
                        setWasteMonth(d ? d.startOf("month") : null)
                      }
                      locale={th_TH}
                      allowClear={false}
                      className="dashboard-picker"
                      placeholder="เลือกเดือน"
                    />
                  </div>
                </div>

                {wasteLoading ? (
                  <div style={{ padding: 16 }}>กำลังโหลด...</div>
                ) : wasteError ? (
                  <div style={{ padding: 16, color: "red" }}>{wasteError}</div>
                ) : wasteMix && wasteMix.length > 0 ? (
                  <ApexChart
                    options={wastePieOptions}
                    series={wastePieSeries}
                    type="pie"
                    height={360}
                  />
                ) : (
                  <div style={{ padding: 16 }}>
                    <Empty description="ไม่มีข้อมูลสัดส่วนขยะของเดือนนี้" />
                  </div>
                )}
              </div>
            </Col>

            {/* ขวา: กราฟรายได้รีไซเคิล (คุมช่วงเวลาของตัวเอง) */}
            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card">
                <div
                  className="dashboard-head-graph-card"
                  style={{ alignItems: "center" }}
                >
                  <div className="dashboard-head-title">
                    รายได้ขยะรีไซเคิล (บาท)
                  </div>

                  {/* Controls ของกราฟรายได้ */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Select
                      size="middle"
                      value={revFilterMode}
                      onChange={(v: RevFilterMode) => {
                        setRevFilterMode(v);
                        if (v === "dateRange") {
                          setRevRange([
                            dayjs().startOf("year"),
                            dayjs().endOf("year"),
                          ]);
                        } else if (v === "month") {
                          const m = dayjs().startOf("month");
                          setRevRange([m, m.endOf("month")]);
                        } else {
                          setRevRange([
                            dayjs().startOf("year"),
                            dayjs().endOf("year"),
                          ]);
                        }
                      }}
                      options={[
                        { label: "เลือกช่วงวัน", value: "dateRange" },
                        { label: "เลือกเดือน", value: "month" },
                        { label: "เลือกปี", value: "year" },
                      ]}
                      style={{ minWidth: 140 }}
                    />

                    {revFilterMode === "dateRange" && (
                      <DatePicker.RangePicker
                        value={revRange as [Dayjs, Dayjs]}
                        onChange={(d) => setRevRange([d?.[0] ?? null, d?.[1] ?? null])}
                        locale={th_TH}
                        allowClear={false}
                      />
                    )}

                    {revFilterMode === "month" && (
                      <DatePicker
                        picker="month"
                        value={revRange?.[0] as Dayjs | null}
                        onChange={(d) =>
                          setRevRange([
                            d ? d.startOf("month") : null,
                            d ? d.endOf("month") : null,
                          ])
                        }
                        locale={th_TH}
                        allowClear={false}
                      />
                    )}

                    {revFilterMode === "year" && (
                      <DatePicker.RangePicker
                        picker="year"
                        value={revRange as [Dayjs, Dayjs]}
                        onChange={(d) =>
                          setRevRange([
                            d?.[0] ? d[0].startOf("year") : null,
                            d?.[1] ? d[1].endOf("year") : null,
                          ])
                        }
                        locale={th_TH}
                        allowClear={false}
                      />
                    )}
                  </div>
                </div>

                {revenueLoading ? (
                  <div style={{ padding: 16 }}>กำลังโหลด...</div>
                ) : revenueError ? (
                  <div style={{ padding: 16, color: "red" }}>{revenueError}</div>
                ) : revenue && revenue.length > 0 ? (
                  <ApexChart
                    options={revenueOpts}
                    series={revenueSeries}
                    type="line"
                    height={360}
                  />
                ) : (
                  <div style={{ padding: 16 }}>
                    <Empty description="ไม่มีข้อมูลรายได้รีไซเคิลในช่วงที่เลือก" />
                  </div>
                )}
              </div>
            </Col>
          </Row>

          {/* History modal */}
          <Modal
            open={showAllAlerts}
            title="ประวัติการแจ้งเตือนทั้งหมด"
            footer={null}
            onCancel={() => setShowAllAlerts(false)}
            width={900}
          >
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
                {
                  title: "ค่าเฉลี่ย",
                  dataIndex: "average",
                  render: (v: number, r) =>
                    `${v.toFixed(2)} ${r.unit || ""}`.trim(),
                },
                {
                  title: "มาตรฐานสูงสุด",
                  dataIndex: "max_value",
                  render: (v: number, r) =>
                    `${v.toFixed(2)} ${r.unit || ""}`.trim(),
                },
                { title: "สถานะ", dataIndex: "exceed" },
              ]}
            />
          </Modal>

          {/* Zoom modal */}
          <Modal
            open={showModal}
            footer={null}
            onCancel={() => setShowModal(false)}
            width={1000}
          >
            <ApexChart
              key={"modal" + view + chartType}
              options={buildOpts("Zoom Chart", true, mainYMaxHint)}
              series={
                isGarbage
                  ? [
                      {
                        name: selectedParamName || "ปริมาณ",
                        data: garbageSeries,
                        color: chartColor.after,
                      },
                    ]
                  : view === "before"
                  ? [
                      {
                        name: "ก่อน",
                        data: beforeSeriesPoints,
                        color: chartColor.before,
                      },
                    ]
                  : view === "after"
                  ? [
                      {
                        name: "หลัง",
                        data: afterSeriesPoints,
                        color: chartColor.after,
                      },
                    ]
                  : [
                      {
                        name: "ก่อน",
                        data: beforeSeriesPoints,
                        color: chartColor.compareBefore,
                      },
                      {
                        name: "หลัง",
                        data: afterSeriesPoints,
                        color: chartColor.compareAfter,
                      },
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
 