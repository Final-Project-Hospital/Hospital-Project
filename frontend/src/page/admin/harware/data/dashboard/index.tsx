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
  ListDataHardwareParameterByParameter,
} from "../../../../../services/hardware";
import LineChart from "../chart/line/index";
import Area from "../chart/area/index";
import Bar from "../chart/bar/index";
import ColorMapping from "../chart/mapping/index";
import Stacked from "../chart/stack/index";
import EditParameterModal from "./edit";

const Index = () => {
  const location = useLocation();
  const { hardwareID } = location.state || {};
  const [uniqueGraphs, setUniqueGraphs] = useState<
    {
      ID: number;
      Graph: string;
      ParametersWithColor: { parameter: string; color: string }[];
    }[]
  >([]);
  const [showEdit, setShowEdit] = useState(false);
  const [reloadCharts, setReloadCharts] = useState(0);
  const [reloadAverage, setReloadAverage] = useState(0);
  const [reloadBoxes, setReloadBoxes] = useState(0);
  const [loadingAll, setLoadingAll] = useState(false);

  // โหลดข้อมูลกราฟ
  const fetchSensorDataAndParameters = useCallback(async () => {
    if (!hardwareID) return;

    const sensorDataList = await GetSensorDataByHardwareID(hardwareID);
    if (!sensorDataList || sensorDataList.length === 0) {
      setUniqueGraphs([]);
      return;
    }

    const allParams: string[] = [];
    for (const sensorData of sensorDataList) {
      const parameters = await GetSensorDataParametersBySensorDataID(sensorData.ID);
      if (parameters) {
        const paramNames = parameters
          .map((p) => p.HardwareParameter?.Parameter)
          .filter(Boolean);
        allParams.push(...paramNames);
      }
    }
    const uniqueParams = Array.from(new Set(allParams));

    const graphMap: {
      [graphID: number]: {
        ID: number;
        Graph: string;
        ParametersWithColor: { parameter: string; color: string }[];
      };
    } = {};

    for (const param of uniqueParams) {
      const hardwareParams = await ListDataHardwareParameterByParameter(param);
      if (hardwareParams) {
        for (const hp of hardwareParams) {
          const graph = hp.HardwareGraph;
          const colorCode = hp.HardwareParameterColor?.Code ?? "#000000";
          if (graph && graph.ID) {
            if (!graphMap[graph.ID]) {
              graphMap[graph.ID] = {
                ID: graph.ID,
                Graph: graph.Graph ?? "Unknown",
                ParametersWithColor: [],
              };
            }
            if (!graphMap[graph.ID].ParametersWithColor.find(p => p.parameter === param)) {
              graphMap[graph.ID].ParametersWithColor.push({ parameter: param, color: colorCode });
            }
          }
        }
      }
    }
    const resultGraphs = Object.values(graphMap);
    setUniqueGraphs(resultGraphs);
  }, [hardwareID]);

  useEffect(() => {
    fetchSensorDataAndParameters();
  }, [hardwareID, fetchSensorDataAndParameters, reloadCharts]);

  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 6);
  const defaultEnd = new Date();

  // >>> Handle Success จาก Modal (Overlay Loading แล้ว fetch ใหม่)
  const handleEditSuccess = async () => {
    setLoadingAll(true);
    await fetchSensorDataAndParameters();
    setReloadCharts(prev => prev + 1);
    setReloadAverage(prev => prev + 1);
    setReloadBoxes(prev => prev + 1);

    setTimeout(() => {
      setLoadingAll(false);
    }, 1000); // ปรับให้เหมาะสม
  };



  return (
    <div className="space-y-8 relative">
      {/* Overlay Loading ทั้งหน้า */}
      {loadingAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <Spin size="large" tip="Loading data..." />
        </div>
      )}

      <section className="max-w-screen-2xl mx-auto p-5 bg-white border border-gray-200 rounded-lg shadow-md mb-8 mt-24 md:mt-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight mb-4">
            Good Morning
            <br />
            <span className="inline-flex items-center gap-2 text-teal-700 justify-center md:justify-start">
              Environmental Engineering
            </span>
          </h1>
          <p className="text-xs md:text-base text-gray-700 mb-6 max-w-xl mx-auto md:mx-0">
            Environmental engineers monitor temperature, humidity, and formaldehyde levels to assess air quality and ensure a safe and healthy environment!
          </p>
          <div className="mb-6 flex justify-center md:justify-start">
            <button
              className="bg-teal-600 hover:bg-teal-800 text-white font-bold py-2 px-5 rounded-xl shadow transition"
              onClick={() => setShowEdit(true)}
            >
              Edit Parameter
            </button>
          </div>
        </div>
        <img
          src={picture1}
          alt="ESP32 Hardware"
          className="w-36 md:w-60 max-w-full object-contain mx-auto md:mx-0"
        />
      </section>

      <section className="max-w-screen-2xl mx-auto bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Current Sensor Data</h2>
        <Boxsdata hardwareID={hardwareID} reloadKey={reloadBoxes} />
      </section>
      <section className="max-w-screen-2xl mx-auto bg-white p-4 rounded-lg shadow">
        <TableData hardwareID={hardwareID} />
      </section>
            <section className="max-w-screen-2xl mx-auto bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Charts</h2>
        {uniqueGraphs.length === 0 ? (
          <div className="text-center text-red-500 font-semibold">No Data</div>
        ) : (
          <div
            className={
              uniqueGraphs.length === 1
                ? "grid grid-cols-1 gap-6"
                : "grid grid-cols-1 md:grid-cols-2 gap-6"
            }
          >
            {uniqueGraphs.map((g, index, arr) => {
              const totalCharts = uniqueGraphs.length;
              const isLastAndOdd = index === arr.length - 1 && totalCharts % 2 === 1 && totalCharts !== 1;
              const parameters = g.ParametersWithColor.map(p => p.parameter);
              const colors = g.ParametersWithColor.map(p => p.color);

              const commonProps = {
                hardwareID,
                parameters,
                colors,
                timeRangeType: "day" as "day",
                selectedRange: [defaultStart, defaultEnd],
              };

              const ChartComponent = (() => {
                switch (g.Graph) {
                  case "Line":
                    return <LineChart {...commonProps} />;
                  case "Area":
                    return <Area {...commonProps} />;
                  case "Bar":
                    return <Bar {...commonProps} />;
                  case "Mapping":
                    return <ColorMapping {...commonProps} />;
                  case "Stacked":
                    return <Stacked {...commonProps} />;
                  default:
                    return null;
                }
              })();
              return (
                <div
                  key={g.ID}
                  className={
                    uniqueGraphs.length === 1
                      ? "p-3 bg-gray-50 rounded shadow"
                      : `p-3 bg-gray-50 rounded shadow ${
                          isLastAndOdd ? "md:col-span-2" : ""
                        }`
                  }
                >
                  {ChartComponent}
                  <p className="text-sm mt-2 flex flex-wrap items-center gap-2">
                    {g.ParametersWithColor.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: p.color ?? "#ccc",
                          color: "#fff",
                        }}
                      >
                        {p.parameter}
                      </span>
                    ))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section className="max-w-screen-2xl mx-auto bg-white p-4 rounded-lg shadow">
        <Avergare hardwareID={hardwareID} reloadKey={reloadAverage} />
      </section>
      <EditParameterModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        hardwareID={hardwareID}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default Index;
