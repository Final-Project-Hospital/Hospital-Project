// (เหมือนเดิมส่วน import ทั้งหมด)
import { useState, useEffect, useCallback } from "react";
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
import ColorMapping from "../chart/mapping/index";
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

type UniqueGraphItem = {
  ID: number; // ใช้ graph_id หรือ id ตามเคส
  Graph: string;
  ParametersWithColor: ParameterWithColor[];
  fullSpan?: boolean; // true = เต็มแถว
};

// ✅ บล็อกกราฟหลังคำนวณซ้าย/ขวาแล้ว
type GraphBlock = UniqueGraphItem & {
  rowIndex: number;                 // มาจาก index
  side?: "left" | "right";          // มีเมื่อ layout_display = true
};

// ✅ โครงสร้างแถว
type RowBlocks = {
  index: number;
  fullSpan?: GraphBlock;            // ถ้ามีจะใช้เต็มแถว
  left?: GraphBlock;                // บล็อกฝั่งซ้าย
  right?: GraphBlock;               // บล็อกฝั่งขวา
};

const Index = () => {
  const location = useLocation();
  const { hardwareID } = location.state || {};

  const { activeMenu } = useStateContext();

  // เปลี่ยนจาก uniqueGraphs เป็น "rows" เพื่อจัดวางตามแถว + ซ้าย/ขวา
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

  // default range for charts: 7 days (today - 6 → today)
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 6);
  const defaultEnd = new Date();

  const fetchSensorDataAndParameters = useCallback(async () => {
    if (!hardwareID) {
      setRows([]);
      return;
    }

    // 1) รวบรวม param IDs ที่ "มีข้อมูลจริง" จาก SensorData
    const allParamIDsFromSensorData: number[] = [];
    const sensorDataList = await GetSensorDataByHardwareID(hardwareID);
    if (!sensorDataList || sensorDataList.length === 0) {
      setRows([]);
      return;
    }

    for (const sensorData of sensorDataList) {
      const parameters = await GetSensorDataParametersBySensorDataID(sensorData.ID);
      if (parameters) {
        const paramIDs = parameters
          .map((p: any) => p.HardwareParameter?.ID)
          .filter((id: any): id is number => typeof id === "number");
        allParamIDsFromSensorData.push(...paramIDs);
      }
    }

    // 2) ดึงรายการ HardwareParameter ทั้งหมดของ hardware นี้
    const response = await ListHardwareParameterIDsByHardwareID(hardwareID);
    if (!response?.parameters || !Array.isArray(response.parameters)) {
      setRows([]);
      return;
    }

    // 3) คัดเฉพาะพารามิเตอร์ที่ "มีข้อมูลจริง"
    const rawParams: HardwareParameterResponse[] = (response.parameters as HardwareParameterResponse[]).filter(
      (p) => allParamIDsFromSensorData.includes(p.id)
    );

    // ✅ 3.1) เรียงลำดับพารามิเตอร์ตาม index (1..n) ก่อนเสมอ
    const sortedParamsByIndex = [...rawParams].sort((a, b) => {
      const ai = Number.isFinite(a.index) ? a.index : Number.MAX_SAFE_INTEGER;
      const bi = Number.isFinite(b.index) ? b.index : Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return a.id - b.id; // กันชน
    });

    // 4) จัดกลุ่มตาม graph_id แล้วแตกเป็น "บล็อกกราฟ" ที่รู้ตำแหน่งแถว (index) และซ้าย/ขวา (จาก right)
    //    - กราฟรวม (group_display=true >=2): 1 block ต่อกราฟ → rowIndex = min(index) ในกลุ่ม
    //      * ถ้ามีใคร layout_display=false => fullSpan=true
    //      * ถ้า fullSpan=false => side ตัดสินด้วย "เสียงข้างมาก" ของ right (เท่ากันให้เป็น left)
    //    - เดี่ยว: 1 block ต่อพารามิเตอร์ → rowIndex = index, fullSpan = !layout_display, side = right? "right":"left"
    const byGraphId = new Map<number, HardwareParameterResponse[]>();
    for (const p of sortedParamsByIndex) {
      if (!byGraphId.has(p.graph_id)) byGraphId.set(p.graph_id, []);
      byGraphId.get(p.graph_id)!.push(p);
    }

    const blocks: GraphBlock[] = [];

    for (const [graphId, paramsOfGraphRaw] of byGraphId.entries()) {
      const graphName = paramsOfGraphRaw[0]?.graph || "Unknown";

      // เรียงภายในกราฟตาม index ด้วย
      const paramsOfGraph = [...paramsOfGraphRaw].sort((a, b) => {
        const ai = Number.isFinite(a.index) ? a.index : Number.MAX_SAFE_INTEGER;
        const bi = Number.isFinite(b.index) ? b.index : Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return a.id - b.id;
      });

      const groupTrue  = paramsOfGraph.filter((p) => p.group_display === true);
      const groupFalse = paramsOfGraph.filter((p) => p.group_display === false);

      // ====== เคส "รวมกราฟ" (>=2) ======
      if (groupTrue.length >= 2) {
        const anyLayoutFalse = groupTrue.some((p) => p.layout_display === false);
        const orderedParamsInGroup = [...groupTrue].sort((a, b) => {
          const ai = Number.isFinite(a.index) ? a.index : Number.MAX_SAFE_INTEGER;
          const bi = Number.isFinite(b.index) ? b.index : Number.MAX_SAFE_INTEGER;
          if (ai !== bi) return ai - bi;
          return a.id - b.id;
        });
        const rowIndex = Math.min(...orderedParamsInGroup.map((p) => p.index ?? Number.MAX_SAFE_INTEGER));

        // side: ถ้าไม่ fullSpan ให้ใช้เสียงข้างมากของ right
        let side: "left" | "right" | undefined;
        if (!anyLayoutFalse) {
          const rightVotes = orderedParamsInGroup.filter((p) => p.right === true).length;
          const leftVotes  = orderedParamsInGroup.length - rightVotes;
          side = rightVotes > leftVotes ? "right" : "left"; // เสมอ → ซ้าย
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

      // ====== เดี่ยวจาก group=false ======
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

      // ====== เดี่ยวจาก group=true แต่มีแค่ 1 ======
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

    // 5) รวมเป็น "แถว" โดยดู rowIndex แล้ววางซ้าย/ขวา
    const rowsMap = new Map<number, RowBlocks>();
    const putToRow = (blk: GraphBlock) => {
      const idx = blk.rowIndex;
      const r = rowsMap.get(idx) || { index: idx };
      if (blk.fullSpan) {
        // เต็มแถว: เคลียร์ซ้าย/ขวาทิ้ง และตั้ง fullSpan
        r.fullSpan = blk;
        r.left = undefined;
        r.right = undefined;
      } else {
        if (!r.fullSpan) {
          if (blk.side === "right") {
            if (!r.right) r.right = blk;
            else if (!r.left) r.left = blk; // fallback กันข้อมูลชนกัน
          } else {
            if (!r.left) r.left = blk;
            else if (!r.right) r.right = blk; // fallback
          }
        }
      }
      rowsMap.set(idx, r);
    };

    blocks.forEach(putToRow);

    const rowsArray = Array.from(rowsMap.values()).sort((a, b) => a.index - b.index);
    setRows(rowsArray);
    setReloadCharts((prev) => prev + 1);
  }, [hardwareID]);

  useEffect(() => {
    setLoadingAll(true);
    setBoxLoaded(false);
    setTableLoaded(false);
    setAverageLoaded(false);
    fetchSensorDataAndParameters().finally(() => {
      // ลูกจะ call onLoaded เองเมื่อโหลดเสร็จ
    });
  }, [hardwareID, fetchSensorDataAndParameters]);

  useEffect(() => {
    if (boxLoaded && tableLoaded && averageLoaded) {
      setLoadingAll(false);
    }
  }, [boxLoaded, tableLoaded, averageLoaded]);

  const handleEditSuccess = async () => {
    setLoadingAll(true);
    setBoxLoaded(false);
    setTableLoaded(false);
    setAverageLoaded(false);

    await fetchSensorDataAndParameters();

    setReloadBoxes((prev) => prev + 1);
    setReloadTable((prev) => prev + 1);
    setReloadAverage((prev) => prev + 1);
    // charts ถูก setReloadCharts ใน fetch แล้ว
  };

  const onBoxLoaded = () => setBoxLoaded(true);
  const onTableLoaded = () => setTableLoaded(true);
  const onAverageLoaded = () => setAverageLoaded(true);

  // ===== Render helpers =====
  const renderChartBlock = (blk?: GraphBlock | UniqueGraphItem | null) => {
    if (!blk) return <div />;

    const parameters = blk.ParametersWithColor.map((p) => p.parameter);
    const colors = blk.ParametersWithColor.map((p) => p.color);

    const commonProps = {
      hardwareID,
      parameters,
      colors,
      timeRangeType: "day" as const,
      selectedRange: [defaultStart, defaultEnd] as [Date, Date],
      reloadKey: reloadCharts,
    };

    switch (blk.Graph) {
      case "Line":
        return <LineChart {...commonProps} />;
      case "Area":
        return <Area {...commonProps} />;
      case "Mapping":
        return <ColorMapping {...commonProps} />;
      case "Stacked":
        return <Stacked {...commonProps} />;
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
          hardwareID={hardwareID}
          reloadKey={reloadBoxes}
          onLoaded={onBoxLoaded}
        />
      </section>

      {/* Table: ใช้ activeMenu เลือกความกว้าง */}
      <section
        className={`px-2 md:px-8 bg-white p-4 rounded-lg shadow ${
          activeMenu ? "w-full w-mid-800 w-mid-1400 w-mid-1600 w-mid-max" : "w-full"
        }`}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-700">ตารางข้อมูล</h2>
        <TableData
          key={`table-${reloadTable}`}
          hardwareID={hardwareID}
          // @ts-ignore
          reloadKey={reloadTable}
          onLoaded={onTableLoaded}
        />
      </section>

      {/* Charts */}
      <section className="w-full px-2 md:px-8 bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">กราฟเเสดงค่าของเเต่ละตัวเเปร</h2>

        {rows.length === 0 ? (
          <div className="text-center text-gray-500 font-semibold">ไม่พบข้อมูล</div>
        ) : (
          <div className="flex flex-col gap-6">
            {rows.map((row, ri) => {
              // ถ้ามี fullSpan ให้แสดงเต็มแถว
              if (row.fullSpan) {
                return (
                  <div key={`row-${row.index}-${ri}`} className="grid grid-cols-1 gap-6">
                    <div className="p-3 bg-gray-50 rounded shadow">
                      {renderChartBlock(row.fullSpan)}
                    </div>
                  </div>
                );
              }

              // ไม่มี fullSpan → ใช้ 2 คอลัมน์ (ซ้าย/ขวา)
              // ถ้าบางฝั่งไม่มี ให้เว้นช่องว่างไว้เพื่อคงตำแหน่ง
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
          hardwareID={hardwareID}
          reloadKey={reloadAverage}
          onLoaded={onAverageLoaded}
        />
      </section>

      {/* Modals */}
      <EditParameterModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        hardwareID={hardwareID}
        onSuccess={handleEditSuccess}
      />

      <EditStandardUnitModal
        open={showEditStandard}
        onClose={() => setShowEditStandard(false)}
        onSuccess={handleEditSuccess}
        hardwareID={hardwareID}
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
