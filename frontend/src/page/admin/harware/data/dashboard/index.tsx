// (เหมือนเดิมส่วน import ทั้งหมด)
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Spin } from "antd";
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
import { useStateContext } from "../../../../../contexts/ContextProvider"; // 👈 เพิ่มบรรทัดนี้

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
  group_display: boolean; // group
  layout_display: boolean; // layout
}

type UniqueGraphItem = {
  ID: number; // ใช้ graph_id หรือ id ตามเคส
  Graph: string;
  ParametersWithColor: ParameterWithColor[];
  fullSpan?: boolean; // true = เต็มแถว, false/undefined = ครึ่งแถว
};

const Index = () => {
  const location = useLocation();
  const { hardwareID } = location.state || {};

  const { activeMenu } = useStateContext();

  const [uniqueGraphs, setUniqueGraphs] = useState<UniqueGraphItem[]>([]);
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
      setUniqueGraphs([]);
      return;
    }

    // 1) รวบรวม param IDs ที่ "มีข้อมูลจริง" จาก SensorData
    const allParamIDsFromSensorData: number[] = [];
    const sensorDataList = await GetSensorDataByHardwareID(hardwareID);
    if (!sensorDataList || sensorDataList.length === 0) {
      setUniqueGraphs([]);
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
      setUniqueGraphs([]);
      return;
    }

    // 3) คัดเฉพาะพารามิเตอร์ที่ "มีข้อมูลจริง"
    const validParams: HardwareParameterResponse[] = (response.parameters as HardwareParameterResponse[]).filter(
      (p) => allParamIDsFromSensorData.includes(p.id)
    );

    // 4) จัดกลุ่มตาม graph_id เพื่อพิจารณา "รวมกราฟ" หรือ "เดี่ยว"
    //    - รวมกราฟ: มีพารามิเตอร์ที่ group_display=true >= 2 ตัว ใน graph_id เดียวกัน
    //    - เดี่ยว: นอกเหนือจากนั้น
    const byGraphId = new Map<number, HardwareParameterResponse[]>();
    for (const p of validParams) {
      if (!byGraphId.has(p.graph_id)) byGraphId.set(p.graph_id, []);
      byGraphId.get(p.graph_id)!.push(p);
    }

    const results: UniqueGraphItem[] = [];

    for (const [graphId, paramsOfGraph] of byGraphId.entries()) {
      // แยกตาม group_display
      const groupTrue = paramsOfGraph.filter((p) => p.group_display === true);
      const groupFalse = paramsOfGraph.filter((p) => p.group_display === false);

      const graphName = paramsOfGraph[0]?.graph || "Unknown";

      // ====== เคส "รวมกราฟ" (มากกว่า 1 parameter และ group = true) ======
      if (groupTrue.length >= 2) {
        // ตัดสิน layout สำหรับกราฟรวม:
        // ถ้ามีสักตัว layout=false ⇒ เต็มแถว, มิฉะนั้น ⇒ ครึ่งแถว
        const anyLayoutFalse = groupTrue.some((p) => p.layout_display === false);
        const groupedItem: UniqueGraphItem = {
          ID: graphId,
          Graph: graphName,
          ParametersWithColor: groupTrue.map((p) => ({ parameter: p.parameter, color: p.color })),
          fullSpan: anyLayoutFalse ? true : false,
        };
        results.push(groupedItem);

        // หมายเหตุ: groupFalse ใน graph เดียวกันยังคงพิจารณาเป็น "เดี่ยว" ต่อไปด้านล่าง
      }

      // ====== เคส "เดี่ยว" ======
      // 1) เดี่ยวจาก group=false
      for (const p of groupFalse) {
        const isFull = p.layout_display === false; // layout=false ⇒ เต็มแถว / layout=true ⇒ ครึ่งแถว
        results.push({
          ID: p.id,
          Graph: p.graph || "Unknown",
          ParametersWithColor: [{ parameter: p.parameter, color: p.color }],
          fullSpan: isFull,
        });
      }

      // 2) เดี่ยวจาก group=true แต่มีแค่ตัวเดียว (ไม่ได้เข้าเงื่อนไขรวม)
      if (groupTrue.length === 1) {
        const p = groupTrue[0];
        const isFull = p.layout_display === false;
        results.push({
          ID: p.id,
          Graph: p.graph || "Unknown",
          ParametersWithColor: [{ parameter: p.parameter, color: p.color }],
          fullSpan: isFull,
        });
      }
      // ถ้า groupTrue.length === 0 ⇒ ไม่มีตัว group=true ในกราฟนี้ ก็จบ (เคสถูกครอบคลุมโดย groupFalse แล้ว)
    }

    setUniqueGraphs(results);
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

  return (
    <div className="space-y-8 relative">
      {loadingAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <Spin size="large" tip="Loading data..." />
        </div>
      )}

      {/* Header */}
      <section className="w-full px-2 md:px-8 p-5 bg-white border border-gray-200 rounded-lg shadow-md mb-8 mt-16 md:mt-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight mb-4">
            สวัสดีตอนเช้า<br />
            <span className="inline-flex items-center gap-2 text-teal-700 justify-center md:justify-start">
              วิศวกรรมสิ่งแวดล้อม
            </span>
          </h1>
          <p className="text-xs md:text-base text-gray-700 mb-6 max-w-xl mx-auto md:mx-0">
            วิศวกรสิ่งแวดล้อมมีหน้าที่ตรวจสอบอุณหภูมิ ความชื้น และระดับฟอร์มาลดีไฮด์
            เพื่อประเมินคุณภาพอากาศและรับรองความปลอดภัยต่อสุขภาพ!
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
              แก้ไขข้อมูลสแตนดาร์ดและหน่วย
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

        {uniqueGraphs.length === 0 ? (
          <div className="text-center text-gray-500 font-semibold">ไม่พบข้อมูล</div>
        ) : (
          <div
            className={
              uniqueGraphs.length === 1
                ? "grid grid-cols-1 gap-6"
                : "grid grid-cols-1 md:grid-cols-2 gap-6 md:[grid-auto-flow:dense]"
            }
          >
            {uniqueGraphs.map((g, index) => {
              if (!g.ParametersWithColor?.length) return null;

              const parameters = g.ParametersWithColor.map((p) => p.parameter);
              const colors = g.ParametersWithColor.map((p) => p.color);

              const commonProps = {
                hardwareID,
                parameters,
                colors,
                timeRangeType: "day" as const,
                selectedRange: [defaultStart, defaultEnd] as [Date, Date],
                reloadKey: reloadCharts,
              };

              const ChartComponent = (() => {
                switch (g.Graph) {
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
              })();

              const spanClass = g.fullSpan ? "md:col-span-2" : "";

              return (
                <div
                  key={`${g.ID}-${index}-${reloadCharts}`}
                  className={`p-3 bg-gray-50 rounded shadow ${spanClass}`}
                >
                  {ChartComponent}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Average */}
      <section className="w-full px-2 md:px-8 bg-white p-4 rounded-lg shadow">
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
