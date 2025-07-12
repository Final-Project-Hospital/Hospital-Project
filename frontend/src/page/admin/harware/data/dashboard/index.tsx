import picture1 from "../../../../../assets/ESP32.png";
import Boxsdata from "../box/index";
import TableData from "../table/index";
import Avergare from "../footer/index";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
  ListDataHardwareParameterByParameter,
} from "../../../../../services/hardware";

// Chart
import LineChart from "../chart/index";
import Area from "../../../../../component/admin/charts/Area";
import Bar from "../../../../../component/admin/charts/Bar";
import ColorMapping from "../../../../../component/admin/charts/ColorMapping";
import Stacked from "../../../../../component/admin/charts/Stacked";

const Index = () => {
  const location = useLocation();
  const { hardwareID } = location.state || {};

  const [uniqueGraphs, setUniqueGraphs] = useState<any[]>([]);

  useEffect(() => {
    const fetchSensorDataAndParameters = async () => {
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
        [graphID: number]: { ID: number; Graph: string; Parameters: string[] };
      } = {};

      for (const param of uniqueParams) {
        const hardwareParams = await ListDataHardwareParameterByParameter(param);
        if (hardwareParams) {
          for (const hp of hardwareParams) {
            const graph = hp.HardwareGraph;
            if (graph && graph.ID) {
              if (!graphMap[graph.ID]) {
                graphMap[graph.ID] = {
                  ID: graph.ID,
                  Graph: graph.Graph ?? "Unknown",
                  Parameters: [],
                };
              }

              if (!graphMap[graph.ID].Parameters.includes(param)) {
                graphMap[graph.ID].Parameters.push(param);
              }
            }
          }
        }
      }

      const resultGraphs = Object.values(graphMap);
      setUniqueGraphs(resultGraphs);
    };

    fetchSensorDataAndParameters();
  }, [hardwareID]);

  // default ช่วงเวลา 7 วันล่าสุด
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 6);
  const defaultEnd = new Date();

  return (
    <div className="space-y-8">
      {/* Hero */}
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
        </div>
        <img
          src={picture1}
          alt="ESP32 Hardware"
          className="w-36 md:w-60 max-w-full object-contain mx-auto md:mx-0"
        />
      </section>

      {/* Box summary */}
      <section className="max-w-screen-2xl mx-auto bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Summary</h2>
        <Boxsdata hardwareID={hardwareID} />
      </section>

      {/* Table */}
      <section className="max-w-screen-2xl mx-auto bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Sensor Data Table</h2>
        <TableData hardwareID={hardwareID} />
      </section>

      {/* Charts */}
      <section className="max-w-screen-2xl mx-auto bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Charts</h2>

        {uniqueGraphs.length === 0 ? (
          <div className="text-center text-red-500 font-semibold">No Data</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Graph */}
            {uniqueGraphs
              .filter((g) => g.Graph === "Default Graph")
              .map((g, i) => (
                <div key={g.ID ?? i} className="p-3 bg-gray-50 rounded shadow">
                  <LineChart
                    hardwareID={hardwareID}
                    timeRangeType={"day"}
                    selectedRange={[defaultStart, defaultEnd]}
                    parameters={g.Parameters}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Parameters: {g.Parameters.join(", ")}
                  </p>
                </div>
              ))}
            {uniqueGraphs
              .filter((g) => g.Graph !== "Default Graph")
              .map((g, index, arr) => {
                const totalCharts =
                  (uniqueGraphs.some((gg) => gg.Graph === "Default Graph") ? 1 : 0) + arr.length;
                const isLastAndOdd = index === arr.length - 1 && totalCharts % 2 === 1;

                const commonProps = {
                  hardwareID,
                  parameters: g.Parameters,
                  timeRangeType: "day" as "day",
                  selectedRange: [defaultStart, defaultEnd],
                };

                const ChartComponent = (() => {
                  switch (g.Graph) {
                    case "Area":
                      return <Area {...commonProps} />;
                    case "Bar":
                      return <Bar {...commonProps} />;
                    case "Color Mapping":
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
                    className={`p-3 bg-gray-50 rounded shadow ${isLastAndOdd ? "md:col-span-2" : ""}`}
                  >
                    {ChartComponent}
                    <p className="text-sm text-gray-500 mt-2">
                      Parameters: {g.Parameters.join(", ")}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Average */}
      <section className="max-w-screen-2xl mx-auto bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Average Data</h2>
        <Avergare hardwareID={hardwareID} />
      </section>
    </div>
  );
};

export default Index;
