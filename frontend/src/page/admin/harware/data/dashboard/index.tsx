// (เหมือนเดิมส่วน import ทั้งหมด)
import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import picture1 from "../../../../../assets/ESP32.png";
import Boxsdata from "../box/index";
import TableData from "../table/index";
import Avergare from "../footer/index";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
  ListHardwareParameterIDsByHardwareID,
} from "../../../../../services/hardware";
import LineChart from "../chart/line/index";
import Area from "../chart/area/index";
import Bar from "../chart/bar/index";
import Stacked from "../chart/stack/index";
import EditParameterModal from "./edit";
import EditStandardUnitModal from "../standard/index";
import { useStateContext } from "../../../../../contexts/ContextProvider";

interface ParameterWithColor {
  parameter: string;
  color: string;
}

interface HardwareParameterResponse {
  id: number;
  parameter: string;
  graph_id: number;
  graph: string;
  color: string;
  index: number;            // ✅ ลำดับแถว 1..n
  right: boolean;           // ✅ ใช้เฉพาะเมื่อ layout_display = true
  group_display: boolean;   // รวมกราฟ
  layout_display: boolean;  // true=แบ่งซ้าย/ขวา, false=เต็มแถว
}

// ====== ใช้ส่งให้ Boxsdata ======
type SensorParameter = {
  id: number;
  name: string;
  value: number;
};
type ParameterMeta = {
  color: string;
  unit?: string;
  standard?: number;
  icon?: string;
};
type ParameterColorMap = Record<string, ParameterMeta>;

// ====== ใช้ส่งให้ Average ======
type HardwareStat = {
  id: number;
  name: string;
  popularityPercent: number;
  average: number;
  standard?: number;      // ค่ามาตรฐานสูงสุด
  standardMin?: number;   // ค่ามาตรฐานต่ำสุด
  unit?: string;
};

// ====== ใช้ส่งให้ Charts (Line/Area/Mapping/Stacked) ======
type ChartPoint = {
  parameter: string;
  date: string;   // ISO string
  value: number;
};
type ChartMetaMap = Record<string, { unit?: string; standard?: number; standardMin?: number }>;
// ===============================================

type UniqueGraphItem = {
  ID: number;
  Graph: string;
  ParametersWithColor: ParameterWithColor[];
  fullSpan?: boolean;
};

type GraphBlock = UniqueGraphItem & {
  rowIndex: number;
  side?: "left" | "right";
};

type RowBlocks = {
  index: number;
  fullSpan?: GraphBlock;
  left?: GraphBlock;
  right?: GraphBlock;
};

const Index: React.FC = () => {
  const location = useLocation();
  const { hardwareID } = (location.state as { hardwareID?: number }) || {};

  const { activeMenu } = useStateContext();

  const [rows, setRows] = useState<RowBlocks[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showEditStandard, setShowEditStandard] = useState(false);

  // ตัวนับรีโหลดแยกตามส่วน
  const [reloadCharts, setReloadCharts] = useState(0);
  const [reloadAverage, setReloadAverage] = useState(0);
  const [reloadBoxes, setReloadBoxes] = useState(0);
  const [reloadTable, setReloadTable] = useState(0);

  // สถานะโหลดรวม + ธงย่อย
  const [loadingAll, setLoadingAll] = useState(true);
  const [boxLoaded, setBoxLoaded] = useState(false);
  const [tableLoaded, setTableLoaded] = useState(false);
  const [averageLoaded, setAverageLoaded] = useState(false);

  // ====== Boxsdata states ======
  const [boxLatestParams, setBoxLatestParams] = useState<SensorParameter[]>([]);
  const [boxParamMeta, setBoxParamMeta] = useState<ParameterColorMap>({});
  const [boxLoading, setBoxLoading] = useState(false);

  // ====== Average states ======
  const [avgStats, setAvgStats] = useState<HardwareStat[]>([]);
  const [avgParameterColors, setAvgParameterColors] = useState<Record<string, string>>({});
  const [avgLoading, setAvgLoading] = useState(false);

  // ====== Shared chart states (Line/Area/Mapping/Stacked) ======
  const [chartDataPoints, setChartDataPoints] = useState<ChartPoint[]>([]);
  const [chartMeta, setChartMeta] = useState<ChartMetaMap>({});
  const [chartLoading, setChartLoading] = useState(false);

  // ====== เตรียมข้อมูลให้ TableData (จะส่งให้ลูกภายหลัง) ======
  const [tablePreparedData, setTablePreparedData] = useState<any[]>([]);
  const [tableUniqueColumns, setTableUniqueColumns] = useState<string[]>(["วันที่", "เวลา", "หมายเหตุ"]);
  const [tableParamUnits, setTableParamUnits] = useState<Record<string, string>>({});
  const [tableAllSensorDataIDs, setTableAllSensorDataIDs] = useState<number[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  // default range (ให้ลูกเลือกเองได้ด้วย)
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 6); //@ts-ignore
  const defaultEnd = new Date();

  const fetchSensorDataAndParameters = useCallback(async () => {
    if (!hardwareID) {
      setRows([]);

      // reset ลูกๆ
      setBoxLatestParams([]);
      setBoxParamMeta({});
      setBoxLoading(false);

      setAvgStats([]);
      setAvgParameterColors({});
      setAvgLoading(false);

      setChartDataPoints([]);
      setChartMeta({});
      setChartLoading(false);

      // reset เตรียมข้อมูล Table
      setTablePreparedData([]);
      setTableUniqueColumns(["วันที่", "เวลา", "หมายเหตุ"]);
      setTableParamUnits({});
      setTableAllSensorDataIDs([]);
      setTableLoading(false);
      return;
    }

    setBoxLoading(true);
    setAvgLoading(true);
    setChartLoading(true);
    setTableLoading(true);

    // 1) เซนเซอร์ทั้งหมด
    const sensorDataList = await GetSensorDataByHardwareID(hardwareID);
    if (!sensorDataList || sensorDataList.length === 0) {
      setRows([]);

      setBoxLatestParams([]);
      setBoxParamMeta({});
      setBoxLoading(false);

      setAvgStats([]);
      setAvgParameterColors({});
      setAvgLoading(false);

      setChartDataPoints([]);
      setChartMeta({});
      setChartLoading(false);

      // reset เตรียมข้อมูล Table
      setTablePreparedData([]);
      setTableUniqueColumns(["วันที่", "เวลา", "หมายเหตุ"]);
      setTableParamUnits({});
      setTableAllSensorDataIDs([]);
      setTableLoading(false);
      return;
    }

    // 2) พารามิเตอร์ + meta
    const response = await ListHardwareParameterIDsByHardwareID(hardwareID);
    const allParams: HardwareParameterResponse[] = Array.isArray(response?.parameters)
      ? (response!.parameters as any as HardwareParameterResponse[])
      : [];

    const metaForBox: ParameterColorMap = {};
    const colorMapForAvg: Record<string, string> = {};
    const metaForAllCharts: ChartMetaMap = {};

    for (const p of allParams) {
      metaForBox[p.parameter.toLowerCase()] = {
        color: p.color || "#999999",
        unit: (p as any).unit || "",
        standard: (p as any).standard,
        icon: (p as any).icon || "",
      };
      colorMapForAvg[p.parameter] = p.color || "#999999";
      metaForAllCharts[p.parameter] = {
        unit: (p as any).unit,
        standard: typeof (p as any).standard === "number" ? (p as any).standard : undefined,
        standardMin: typeof (p as any).standard_min === "number" ? (p as any).standard_min : undefined,
      };
    }
    setBoxParamMeta(metaForBox);
    setAvgParameterColors(colorMapForAvg);
    setChartMeta(metaForAllCharts);

    // 3) วน sensorData → average + ดิบกราฟ + เตรียมข้อมูลตาราง
    const allParamIDsFromSensorData: number[] = [];
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    const maxValues: Record<string, number> = {};
    const points: ChartPoint[] = [];

    // เตรียมสำหรับ Table
    const allSensorDataIDs = Array.from(
      new Set((sensorDataList || []).map((s: any) => Number(s.ID)).filter(Boolean))
    );
    setTableAllSensorDataIDs(allSensorDataIDs);

    type ParamDetail = {
      ParameterName: string;
      วันที่: string;
      เวลา: string;
      rawDate: string;
      [k: string]: any;
    };
    const paramDetails: ParamDetail[] = [];

    for (const sensorData of sensorDataList) {
      const params = await GetSensorDataParametersBySensorDataID(sensorData.ID);
      if (!Array.isArray(params)) continue;

      for (const p of params) {
        const name = p?.HardwareParameter?.Parameter as string | undefined;
        const idByHardwareParam = p?.HardwareParameter?.ID as number | undefined;
        const value = Number(p?.Data);
        const dateObj = p?.Date ? new Date(p.Date) : undefined;
        const dateISO = dateObj ? dateObj.toISOString() : undefined;

        if (typeof idByHardwareParam === "number") allParamIDsFromSensorData.push(idByHardwareParam);
        if (!name || isNaN(value) || !dateISO) continue;

        // average
        if (!sums[name]) sums[name] = 0;
        if (!counts[name]) counts[name] = 0;
        sums[name] += value;
        counts[name] += 1;
        if (!maxValues[name] || value > maxValues[name]) maxValues[name] = value;

        // raw points for charts
        points.push({ parameter: name, date: dateISO, value });

        // ===== สร้างรายละเอียดสำหรับตาราง (เหมือนลูก) =====
        const standardMax = p?.HardwareParameter?.StandardHardware?.MaxValueStandard ?? null;
        const standardMin = p?.HardwareParameter?.StandardHardware?.MinValueStandard ?? null;
        const unit = p?.HardwareParameter?.UnitHardware?.Unit ?? "";
        const note: string = p?.Note ?? "";
        const sdpId: number | undefined = p?.ID;

        let sensorDate = "ไม่ทราบวันที่";
        let rawDate = "";
        let timeString = "";

        if (dateObj && !isNaN(dateObj.getTime())) {
          rawDate = dateObj.toISOString();
          // format DD/MM/YYYY & HH:mm:ss
          const dd = String(dateObj.getDate()).padStart(2, "0");
          const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
          const yyyy = String(dateObj.getFullYear());
          const HH = String(dateObj.getHours()).padStart(2, "0");
          const MM = String(dateObj.getMinutes()).padStart(2, "0");
          const SS = String(dateObj.getSeconds()).padStart(2, "0");

          sensorDate = `${dd}/${mm}/${yyyy}`;
          timeString = `${HH}:${MM}:${SS}`;
        }

        paramDetails.push({
          ParameterName: name,
          วันที่: sensorDate,
          เวลา: timeString,
          rawDate,
          [name]: value,
          [`${name}_standard`]: standardMax,
          [`${name}_min`]: standardMin,
          [`${name}_unit`]: unit,
          [`${name}_note`]: note,
          __id: sdpId,
          Note: note,
        });
      }
    }

    // 4) layout กราฟ
    const rawParams: HardwareParameterResponse[] = allParams.filter((p) =>
      allParamIDsFromSensorData.includes(p.id)
    );

    const sortedParamsByIndex = [...rawParams].sort((a, b) => {
      const ai = Number.isFinite(a.index) ? a.index : Number.MAX_SAFE_INTEGER;
      const bi = Number.isFinite(b.index) ? b.index : Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return a.id - b.id;
    });

    const byGraphId = new Map<number, HardwareParameterResponse[]>();
    for (const p of sortedParamsByIndex) {
      if (!byGraphId.has(p.graph_id)) byGraphId.set(p.graph_id, []);
      byGraphId.get(p.graph_id)!.push(p);
    }

    const blocks: GraphBlock[] = [];

    for (const [graphId, paramsOfGraphRaw] of byGraphId.entries()) {
      const graphName = paramsOfGraphRaw[0]?.graph || "Unknown";

      const paramsOfGraph = [...paramsOfGraphRaw].sort((a, b) => {
        const ai = Number.isFinite(a.index) ? a.index : Number.MAX_SAFE_INTEGER;
        const bi = Number.isFinite(b.index) ? b.index : Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return a.id - b.id;
      });

      const groupTrue  = paramsOfGraph.filter((p) => p.group_display === true);
      const groupFalse = paramsOfGraph.filter((p) => p.group_display === false);

      if (groupTrue.length >= 2) {
        const anyLayoutFalse = groupTrue.some((p) => p.layout_display === false);
        const orderedParamsInGroup = [...groupTrue].sort((a, b) => {
          const ai = Number.isFinite(a.index) ? a.index : Number.MAX_SAFE_INTEGER;
          const bi = Number.isFinite(b.index) ? b.index : Number.MAX_SAFE_INTEGER;
          if (ai !== bi) return ai - bi;
          return a.id - b.id;
        });
        const rowIndex = Math.min(...orderedParamsInGroup.map((p) => p.index ?? Number.MAX_SAFE_INTEGER));

        let side: "left" | "right" | undefined;
        if (!anyLayoutFalse) {
          const rightVotes = orderedParamsInGroup.filter((p) => p.right === true).length;
          const leftVotes  = orderedParamsInGroup.length - rightVotes;
          side = rightVotes > leftVotes ? "right" : "left";
        }

        blocks.push({
          ID: graphId,
          Graph: graphName,
          ParametersWithColor: orderedParamsInGroup.map((p) => ({
            parameter: p.parameter,
            color: p.color,
          })),
          fullSpan: anyLayoutFalse ? true : false,
          rowIndex,
          side,
        });
      }

      for (const p of groupFalse) {
        const rowIndex = Number.isFinite(p.index) ? p.index : Number.MAX_SAFE_INTEGER;
        const isFull = p.layout_display === false;
        const side: "left" | "right" | undefined = isFull ? undefined : (p.right ? "right" : "left");

        blocks.push({
          ID: p.id,
          Graph: p.graph || "Unknown",
          ParametersWithColor: [{ parameter: p.parameter, color: p.color }],
          fullSpan: isFull,
          rowIndex,
          side,
        });
      }

      if (groupTrue.length === 1) {
        const p = groupTrue[0];
        const rowIndex = Number.isFinite(p.index) ? p.index : Number.MAX_SAFE_INTEGER;
        const isFull = p.layout_display === false;
        const side: "left" | "right" | undefined = isFull ? undefined : (p.right ? "right" : "left");

        blocks.push({
          ID: p.id,
          Graph: p.graph || "Unknown",
          ParametersWithColor: [{ parameter: p.parameter, color: p.color }],
          fullSpan: isFull,
          rowIndex,
          side,
        });
      }
    }

    const rowsMap = new Map<number, RowBlocks>();
    const putToRow = (blk: GraphBlock) => {
      const idx = blk.rowIndex;
      const r = rowsMap.get(idx) || { index: idx };
      if (blk.fullSpan) {
        r.fullSpan = blk;
        r.left = undefined;
        r.right = undefined;
      } else {
        if (!r.fullSpan) {
          if (blk.side === "right") {
            if (!r.right) r.right = blk;
            else if (!r.left) r.left = blk;
          } else {
            if (!r.left) r.left = blk;
            else if (!r.right) r.right = blk;
          }
        }
      }
      rowsMap.set(idx, r);
    };
    blocks.forEach(putToRow);
    const rowsArray = Array.from(rowsMap.values()).sort((a, b) => a.index - b.index);
    setRows(rowsArray);
    setReloadCharts((prev) => prev + 1);

    // 5) ค่าล่าสุดสำหรับ Boxsdata
    const latestSensorDataID = sensorDataList[sensorDataList.length - 1].ID;
    const latestParamsRaw = await GetSensorDataParametersBySensorDataID(latestSensorDataID);
    const latestParamsMap = new Map<string, SensorParameter>();
    if (latestParamsRaw && latestParamsRaw.length > 0) {
      latestParamsRaw.forEach((param: any) => {
        const paramName = param?.HardwareParameter?.Parameter || "Unknown";
        latestParamsMap.set(paramName, {
          id: param.ParameterID,
          name: paramName,
          value: Number(param.Data),
        });
      });
    }
    setBoxLatestParams(Array.from(latestParamsMap.values()));
    setBoxLoading(false);

    // 6) Average  ✅ อ่าน meta จาก "metaForAllCharts"
    const avgData: HardwareStat[] = Object.keys(sums).map((key, idx) => {
      const avg = counts[key] > 0 ? sums[key] / counts[key] : 0;
      const maxValue = maxValues[key] || 100;
      const popularityPercent = maxValue > 0 ? Math.min((avg / maxValue) * 100, 100) : 0;
      const meta = metaForAllCharts[key] || {};
      return {
        id: idx + 1,
        name: key,
        popularityPercent,
        average: avg,
        standard: typeof meta.standard === "number" ? meta.standard : undefined,
        standardMin: typeof meta.standardMin === "number" ? meta.standardMin : undefined,
        unit: meta.unit,
      };
    });
    setAvgStats(avgData);
    setAvgLoading(false);

    // 7) ดิบกราฟ (ใช้ร่วมทุกกราฟ)
    setChartDataPoints(points);
    setChartLoading(false);

    // 8) ✅ เตรียมข้อมูล TableData (จัดกลุ่ม/รวมหมายเหตุ/เรียงเวลา)
    // unique params
    const uniqueParams = Array.from(
      new Set(paramDetails.map((p) => p.ParameterName).filter(Boolean))
    );

    setTableUniqueColumns(["วันที่", "เวลา", "หมายเหตุ", ...uniqueParams]);

    // หน่วย
    const unitMap: Record<string, string> = {};
    paramDetails.forEach((p) => {
      if (p.ParameterName && p[`${p.ParameterName}_unit`]) {
        unitMap[p.ParameterName] = p[`${p.ParameterName}_unit`];
      }
    });
    setTableParamUnits(unitMap);

    // จัดกลุ่มตาม วัน-เวลา (เหมือนลูก)
    const groupedRows: Record<string, any> = {};
    for (const p of paramDetails) {
      const key = `${p.วันที่}-${p.เวลา}`;
      if (!groupedRows[key]) {
        groupedRows[key] = {
          __key: key,
          วันที่: p.วันที่,
          เวลา: p.เวลา,
          rawDate: p.rawDate,
          หมายเหตุ: "",
          __ids: new Set<number>(),
        };
      }

      // คัดลอกฟิลด์พารามิเตอร์ลงในแถว
      Object.entries(p).forEach(([k, v]) => {
        if (!["ParameterName", "rawDate", "วันที่", "เวลา", "Note", "__id"].includes(k)) {
          groupedRows[key][k] = v;
        }
      });

      // รวมหมายเหตุ (unique, คั่นด้วย | )
      const noteText = typeof p.Note === "string" && p.Note.trim().length > 0 ? p.Note.trim() : "";
      if (noteText) {
        if (groupedRows[key]["หมายเหตุ"]) {
          if (!groupedRows[key]["หมายเหตุ"].includes(noteText)) {
            groupedRows[key]["หมายเหตุ"] = groupedRows[key]["หมายเหตุ"] + " | " + noteText;
          }
        } else {
          groupedRows[key]["หมายเหตุ"] = noteText;
        }
      }

      // เก็บ sdp id
      if (typeof p.__id === "number") {
        groupedRows[key].__ids.add(p.__id);
      }
    }

    const finalTableData = Object.values(groupedRows)
      .map((row: any, idx: number) => ({
        ...row,
        __ids: Array.from(row.__ids ?? []),
        __key: `${row.rawDate || row.__key}-${idx}`,
      }))
      .sort((a: any, b: any) => {
        const ta = new Date(a.rawDate).getTime();
        const tb = new Date(b.rawDate).getTime();
        // เรียงใหม่ล่าสุดอยู่บน (desc)
        if (isNaN(ta) && isNaN(tb)) return 0;
        if (isNaN(ta)) return 1;
        if (isNaN(tb)) return -1;
        return tb - ta;
      });

    setTablePreparedData(finalTableData);
    setTableLoading(false);
  }, [hardwareID]);

  useEffect(() => {
    setLoadingAll(true);
    setBoxLoaded(false);
    setTableLoaded(false);
    setAverageLoaded(false);
    fetchSensorDataAndParameters().finally(() => {});
  }, [hardwareID, fetchSensorDataAndParameters]);

  useEffect(() => {
    if (boxLoaded && tableLoaded && averageLoaded) setLoadingAll(false);
  }, [boxLoaded, tableLoaded, averageLoaded]);

  const handleEditSuccess = useCallback(async () => {
    setLoadingAll(true);
    setBoxLoaded(false);
    setTableLoaded(false);
    setAverageLoaded(false);

    await fetchSensorDataAndParameters();

    setReloadBoxes((prev) => prev + 1);
    setReloadTable((prev) => prev + 1);
    setReloadAverage((prev) => prev + 1);
  }, [fetchSensorDataAndParameters]);

  const onBoxLoaded = () => setBoxLoaded(true);
  const onTableLoaded = () => setTableLoaded(true);
  const onAverageLoaded = () => setAverageLoaded(true);

  // ===== Render helpers =====
  const renderChartBlock = (blk?: GraphBlock | UniqueGraphItem | null) => {
    if (!blk) return <div />;

    const parameters = blk.ParametersWithColor.map((p) => p.parameter);
    const colors = blk.ParametersWithColor.map((p) => p.color);

    // ลูกๆ จะควบคุมช่วงเวลาเอง + ใช้ดิบจากพ่อ
    const lineProps = {
      hardwareID: hardwareID as number,
      parameters,
      colors,
      reloadKey: reloadCharts,
      data: chartDataPoints,
      meta: chartMeta,
      loading: chartLoading,
    };

    switch (blk.Graph) {
      case "Line":
        return <LineChart {...lineProps} />;
      case "Area":
        return <Area {...lineProps} />;
      case "Bar":
        return <Bar {...lineProps} />;
      case "Stacked":
        return <Stacked {...lineProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 relative">
      {loadingAll && <div></div>}

      {/* Header */}
      <section className="w-full px-2 md:px-8 p-5 bg-white border border-gray-200 rounded-lg shadow-md mb-8 mt-16 md:mt-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight mb-4">
            สวัสดี<br />
            <span className="inline-flex items-center gap-2 text-teal-700 justify-center md:justify-start">
              บุคคลากรของโรงพยาบาล
            </span>
          </h1>

          <p className="text-xs md:text-base text-gray-700 mb-6 max-w-xl mx-auto md:mx-0">
            งานด้านสิ่งแวดล้อมมุ่งสร้างสภาพแวดล้อมที่ปลอดภัยและยั่งยืน
            ด้วยการออกแบบระบบติดตามและบริหารจัดการคุณภาพสิ่งแวดล้อมโดยรวม ทั้งการเก็บข้อมูลแบบเรียลไทม์
            การวิเคราะห์แนวโน้ม เพื่อสนับสนุนการตัดสินใจและยกระดับคุณภาพชีวิตของทุกคน
          </p>

          <div className="mb-6 flex flex-col md:flex-row justify-center md:justify-start gap-3">
            <button
              className="bg-teal-600 hover:bg-teal-800 text-white font-bold py-2 px-5 rounded-xl shadow transition"
              onClick={() => setShowEdit(true)}
            >
              แก้ไขข้อมูลการแสดงผลของกราฟ
            </button>
            <button
              className="bg-teal-600 hover:bg-teal-800 text-white font-bold py-2 px-5 rounded-xl shadow transition"
              onClick={() => setShowEditStandard(true)}
            >
              แก้ไขข้อมูลค่ามาตรฐานและอื่นๆ
            </button>
          </div>
        </div>
        <img
          src={picture1}
          alt="ESP32 Hardware"
          className="hidden md:block w-36 md:w-60 max-w-full object-contain mx-auto md:mx-0"
        />
      </section>

      {/* Box */}
      <section className="w-full px-2 md:px-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">ข้อมูลเซนเซอร์ล่าสุด</h2>
        <Boxsdata
          key={`box-${reloadBoxes}`}
          hardwareID={hardwareID as number}
          reloadKey={reloadBoxes}
          onLoaded={onBoxLoaded}
          latestParameters={boxLatestParams}
          parameterMeta={boxParamMeta}
          loading={boxLoading}
        />
      </section>

      {/* Table */}
      <section
        className={`px-2 md:px-8 bg-white p-4 rounded-lg shadow ${
          activeMenu ? "w-full w-mid-800 w-mid-1400 w-mid-1600 w-mid-max" : "w-full"
        }`}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-700">ตารางข้อมูล</h2>

        {/* ⬇️ ตอนนี้ยังคงใช้ TableData แบบเดิม (ลูกจะ fetch เอง)
             ถ้าคุณพร้อมแก้ฝั่งลูก ให้เสียบ props เหล่านี้:
             data={tablePreparedData}
             uniqueColumns={tableUniqueColumns}
             paramUnits={tableParamUnits}
             allSensorDataIDs={tableAllSensorDataIDs}
             loading={tableLoading}
        */}
        <TableData
          key={`table-${reloadTable}`}
          hardwareID={hardwareID as number}
          // @ts-ignore
          reloadKey={reloadTable}
          onLoaded={onTableLoaded}
          data={tablePreparedData}
          uniqueColumns={tableUniqueColumns}
          paramUnits={tableParamUnits}
          allSensorDataIDs={tableAllSensorDataIDs}
          loading={tableLoading}
        />
      </section>

      {/* Charts */}
      <section className="w-full px-2 md:px-8 bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">กราฟเเสดงค่าของเเต่ละพารามิเตอร์</h2>

        {rows.length === 0 ? (
          <div className="text-center text-gray-500 font-semibold">ไม่พบข้อมูล</div>
        ) : (
          <div className="flex flex-col gap-6">
            {rows.map((row, ri) => {
              if (row.fullSpan) {
                return (
                  <div key={`row-${row.index}-${ri}`} className="grid grid-cols-1 gap-6">
                    <div className="p-3 bg-gray-50 rounded shadow">
                      {renderChartBlock(row.fullSpan)}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`row-${row.index}-${ri}`}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 md:[grid-auto-flow:dense]"
                >
                  {/* left */}
                  <div className="p-3 bg-gray-50 rounded shadow min-h-[60px]">
                    {row.left ? renderChartBlock(row.left) : <div />}
                  </div>

                  {/* right */}
                  <div className="p-3 bg-gray-50 rounded shadow min-h-[60px]">
                    {row.right ? renderChartBlock(row.right) : <div />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Average */}
      <section className="w-full px-2 md:px-8 bg-white  p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">ข้อมูลเฉลี่ยของเซนเซอร์</h2>
        <Avergare
          key={`avg-${reloadAverage}`}
          hardwareID={hardwareID as number}
          reloadKey={reloadAverage}
          onLoaded={onAverageLoaded}
          stats={avgStats}
          parameterColors={avgParameterColors}
          loading={avgLoading}
        />
      </section>

      {/* Modals */}
      <EditParameterModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        hardwareID={hardwareID as number}
        onSuccess={handleEditSuccess}
      />

      <EditStandardUnitModal
        open={showEditStandard}
        onClose={() => setShowEditStandard(false)}
        onSuccess={handleEditSuccess}
        hardwareID={hardwareID as number}
      />

      {/* ✅ Media query เฉพาะไฟล์นี้ */}
      <style>{`
        @media (min-width: 768px) and (max-width: 1280px) {
          .w-mid-800 { width: 66vw; margin: 0 auto; }
        }

        @media (min-width: 1336px) and (max-width: 1920px) {
          .w-mid-1400 { width: 73vw; margin: 0 auto; }
        }

        @media (min-width: 1921px) and (max-width: 2400px) {
          .w-mid-1600 { width: 80vw; margin: 0 auto; }
        }

        @media (min-width: 2401px) {
          .w-mid-max { width: 84vw; margin: 0 auto; }
        }
      `}</style>
    </div>
  );
};

export default Index;
