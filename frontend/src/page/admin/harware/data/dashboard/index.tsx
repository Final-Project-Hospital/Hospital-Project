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
  group_display: boolean;     // เดิม
  layout_display: boolean;    // เพิ่มใหม่ (มาจาก API เป็น snake_case)
}

type UniqueGraphItem = {
  ID: number;
  Graph: string;
  ParametersWithColor: ParameterWithColor[];
  fullSpan?: boolean;
};

const Index = () => {
  const location = useLocation();
  const { hardwareID } = location.state || {};

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

  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 6);
  const defaultEnd = new Date();

  const fetchSensorDataAndParameters = useCallback(async () => {
    if (!hardwareID) {
      setUniqueGraphs([]);
      return;
    }

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
          .map((p) => p.HardwareParameter?.ID)
          .filter((id): id is number => typeof id === "number");
        allParamIDsFromSensorData.push(...paramIDs);
      }
    }

    const response = await ListHardwareParameterIDsByHardwareID(hardwareID);
    if (!response?.parameters || !Array.isArray(response.parameters)) {
      setUniqueGraphs([]);
      return;
    }

    const filteredGraphMap: Record<
      string,
      { ID: number; Graph: string; ParametersWithColor: ParameterWithColor[]; fullSpan?: boolean }
    > = {};

    for (const paramObj of response.parameters as HardwareParameterResponse[]) {
      const {
        id,
        parameter,
        graph_id,
        graph,
        color,
        group_display,
        layout_display,
      } = paramObj;

      if (!allParamIDsFromSensorData.includes(id)) continue;

      if (layout_display === false) {
        filteredGraphMap[`isolate-full-${id}`] = {
          ID: id,
          Graph: graph || "Unknown",
          ParametersWithColor: [{ parameter, color }],
          fullSpan: true,
        };
        continue;
      }

      if (group_display === false) {
        filteredGraphMap[`single-${id}`] = {
          ID: id,
          Graph: graph || "Unknown",
          ParametersWithColor: [{ parameter, color }],
        };
        continue;
      }

      const key = `group-${graph_id}`;
      if (!filteredGraphMap[key]) {
        filteredGraphMap[key] = {
          ID: graph_id,
          Graph: graph || "Unknown",
          ParametersWithColor: [],
        };
      }
      filteredGraphMap[key].ParametersWithColor.push({ parameter, color });
    }

    setUniqueGraphs(Object.values(filteredGraphMap));
    setReloadCharts((prev) => prev + 1);
  }, [hardwareID]);

  useEffect(() => {
    // โหลดครั้งแรก
    setLoadingAll(true);
    setBoxLoaded(false);
    setTableLoaded(false);
    setAverageLoaded(false);
    fetchSensorDataAndParameters().finally(() => {
      // ปล่อยให้ลูกยิง onLoaded เอง
    });
  }, [hardwareID, fetchSensorDataAndParameters]);

  useEffect(() => {
    if (boxLoaded && tableLoaded && averageLoaded) {
      setLoadingAll(false);
    }
  }, [boxLoaded, tableLoaded, averageLoaded]);

  const handleEditSuccess = async () => {
    // เริ่มรอบโหลดใหม่
    setLoadingAll(true);
    setBoxLoaded(false);
    setTableLoaded(false);
    setAverageLoaded(false);

    // ดึง layout/graphs ให้ทันก่อน
    await fetchSensorDataAndParameters();

    // กระตุ้นให้ลูกรีโหลด/รีมาวน์
    setReloadBoxes((prev) => prev + 1);
    setReloadTable((prev) => prev + 1);
    setReloadAverage((prev) => prev + 1);
    // หมายเหตุ: charts ใช้ setReloadCharts ไปแล้วใน fetchSensorDataAndParameters()
  };

  const onBoxLoaded = () => setBoxLoaded(true);
  const onTableLoaded = () => setTableLoaded(true);
  const onAverageLoaded = () => setAverageLoaded(true);

  const nonFullTotal = uniqueGraphs.filter((g) => !g.fullSpan).length;

  return (
    <div className="space-y-8 relative">
      {loadingAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <Spin size="large" tip="Loading data..." />
        </div>
      )}

      {/* ส่วนแสดงคำอธิบาย */}
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
              แก้ไขข้อมูลพารามิเตอร์
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

      {/* Table */}
      <section className="w-full px-2 md:px-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">ตารางข้อมูล</h2>
        <TableData
          key={`table-${reloadTable}`}
          hardwareID={hardwareID}
          // ถ้า TableData รองรับ reloadKey ให้ส่งให้ด้วย
          // ถ้าไม่รองรับ key จะทำให้รีมาวน์และดึงข้อมูลใหม่
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
                : "grid grid-cols-1 md:grid-cols-2 gap-6"
            }
          >
            {(() => {
              let nonFullSeen = 0;

              return uniqueGraphs.map((g, index) => {
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

                let spanClass = "";
                if (g.fullSpan) {
                  spanClass = "md:col-span-2";
                } else {
                  const isLastNonFullAndOdd =
                    nonFullSeen === nonFullTotal - 1 && nonFullTotal % 2 === 1;
                  if (isLastNonFullAndOdd) {
                    spanClass = "md:col-span-2";
                  }
                  nonFullSeen += 1;
                }

                return (
                  <div
                    key={`${g.ID}-${index}-${reloadCharts}`}
                    className={`p-3 bg-gray-50 rounded shadow ${spanClass}`}
                  >
                    {ChartComponent}
                  </div>
                );
              });
            })()}
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
    </div>
  );
};

export default Index;
