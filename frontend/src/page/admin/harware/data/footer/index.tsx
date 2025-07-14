import { useEffect, useState } from "react";
import { BlockTitle } from "../../../../../style/global/default";
import { TopProductsWrap } from "./average_date";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
  ListDataHardwareParameterByParameter,
} from "../../../../../services/hardware";

interface HardwareStat {
  id: number;
  name: string;
  popularityPercent: number;
  Percent: string;
}

interface AveragedataProps {
  hardwareID: number;
  reloadKey?: any;
}

const Average: React.FC<AveragedataProps> = ({ hardwareID, reloadKey }) => {
  const [hardwareStats, setHardwareStats] = useState<HardwareStat[]>([]);
  const [parameterColors, setParameterColors] = useState<Record<string, string>>({});

  useEffect(() => {
    setParameterColors({}); // สำคัญ! รีเซ็ตสี parameter ทันทีที่ reloadKey/hardwareID เปลี่ยน
    const fetchAndCalculateAverages = async () => {
      if (!hardwareID) return;

      try {
        const sensorData = await GetSensorDataByHardwareID(hardwareID);
        if (!Array.isArray(sensorData) || sensorData.length === 0) {
          setHardwareStats([]);
          return;
        }

        const sums: Record<string, number> = {};
        const counts: Record<string, number> = {};
        const maxValues: Record<string, number> = {};
        const allParamsSet = new Set<string>();

        for (const sensor of sensorData) {
          const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
          if (Array.isArray(params)) {
            for (const p of params) {
              const name = p.HardwareParameter?.Parameter;
              const value = Number(p.Data);

              if (name && !isNaN(value)) {
                allParamsSet.add(name);
                if (!sums[name]) sums[name] = 0;
                if (!counts[name]) counts[name] = 0;

                sums[name] += value;
                counts[name] += 1;
                if (!maxValues[name] || value > maxValues[name]) {
                  maxValues[name] = value;
                }
              }
            }
          }
        }

        // ดึงสีใหม่ทุกครั้ง!
        const paramsArr = Array.from(allParamsSet);
        const colorsMap: Record<string, string> = {};
        await Promise.all(
          paramsArr.map(async (param) => {
            const res = await ListDataHardwareParameterByParameter(param);
            if (res && res.length > 0) {
              colorsMap[param] = res[0].HardwareParameterColor?.Code || "#999999";
            } else {
              colorsMap[param] = "#999999";
            }
          })
        );
        setParameterColors(colorsMap);

        // เตรียมข้อมูลแสดงผล
        const avgData = Object.keys(sums).map((key, idx) => {
          const avg = counts[key] > 0 ? sums[key] / counts[key] : 0;
          const maxValue = maxValues[key] || 100;
          const popularityPercent = maxValue > 0 ? Math.min((avg / maxValue) * 100, 100) : 0;
          return {
            id: idx + 1,
            name: key,
            popularityPercent,
            Percent: avg.toFixed(2),
          };
        });

        setHardwareStats(avgData);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchAndCalculateAverages();
  }, [hardwareID, reloadKey]);

  return (
    <TopProductsWrap>
      <div className="block-head">
        <BlockTitle className="block-title">
          <h3>Total Hardware Data</h3>
        </BlockTitle>
      </div>
      <div className="tbl-products overflow-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr>
              <th className="text-left">No.</th>
              <th className="text-left">Name</th>
              <th className="hidden md:table-cell text-left"></th>
              <th className="text-left">Average</th>
            </tr>
          </thead>
          <tbody>
            {hardwareStats?.map((progressItem, index) => (
              <tr key={progressItem.id}>
                <td>{index + 1}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: parameterColors[progressItem.name] || "#999999",
                      }}
                    />
                    {progressItem.name}
                  </div>
                </td>
                <td className="hidden md:table-cell">
                  <div className="tbl-progress-bar" style={{ background: "#eee" }}>
                    <div
                      className="bar-fill"
                      style={{
                        width: `${progressItem.popularityPercent}%`,
                        background: parameterColors[progressItem.name] || "#999999",
                        height: 10,
                        borderRadius: 8,
                        transition: "width 0.5s",
                      }}
                    ></div>
                  </div>
                </td>
                <td>
                  <div
                    className="tbl-badge"
                    style={{
                      background: parameterColors[progressItem.name] || "#999999",
                      color: "#fff",
                      padding: "0.25em 0.75em",
                      borderRadius: 12,
                      minWidth: 60,
                      textAlign: "center",
                    }}
                  >
                    {progressItem.Percent}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TopProductsWrap>
  );
};

export default Average;
