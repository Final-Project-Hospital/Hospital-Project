import { useEffect, useState } from "react";
import { BlockTitle } from "../../../../../style/global/default";
import { TopProductsWrap } from "./average_date";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
} from "../../../../../services/hardware";

interface HardwareStat {
  id: number;
  name: string;
  popularityPercent: number;
  Percent: string;
}

interface AveragedataProps {
  hardwareID: number;
}

const Average: React.FC<AveragedataProps> = ({ hardwareID }) => {
  const [hardwareStats, setHardwareStats] = useState<HardwareStat[]>([]);

  useEffect(() => {
    const fetchAndCalculateAverages = async () => {
      if (!hardwareID) return;

      try {
        const sensorData = await GetSensorDataByHardwareID(hardwareID);
        console.log("Sensor Data:", sensorData);

        if (!Array.isArray(sensorData) || sensorData.length === 0) {
          setHardwareStats([]);
          return;
        }

        const sums: Record<string, number> = {};
        const counts: Record<string, number> = {};
        const maxValues: Record<string, number> = {}; // เก็บ max value ของแต่ละ ParameterName

        // เก็บข้อมูลเพื่อหาค่าสูงสุดด้วย
        for (const sensor of sensorData) {
          const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
          console.log(`Parameters for Sensor ID ${sensor.ID}:`, params);

          if (Array.isArray(params)) {
            for (const p of params) {
              const name = p.HardwareParameter?.Parameter;
              const value = Number(p.Data);

              if (name && !isNaN(value)) {
                if (!sums[name]) sums[name] = 0;
                if (!counts[name]) counts[name] = 0;

                sums[name] += value;
                counts[name] += 1;

                // หาค่าสูงสุดของแต่ละ parameter
                if (!maxValues[name] || value > maxValues[name]) {
                  maxValues[name] = value;
                }
              }
            }
          }
        }

        console.log("Sums:", sums);
        console.log("Counts:", counts);
        console.log("Max values per parameter:", maxValues);

        // คำนวณค่าเฉลี่ยและ normalize แบบ dynamic ตาม maxValue ของ parameter นั้น ๆ
        const avgData = Object.keys(sums).map((key, idx) => {
          const avg = counts[key] > 0 ? sums[key] / counts[key] : 0;

          // กำหนด popularityPercent โดย normalize จาก maxValue ของ parameter
          const maxValue = maxValues[key] || 100; // ถ้าไม่มี maxValue ให้ใช้ 100 เป็น default
          const popularityPercent = maxValue > 0 ? Math.min((avg / maxValue) * 100, 100) : 0;

          return {
            id: idx + 1,
            name: key,
            popularityPercent,
            Percent: avg.toFixed(2),
          };
        });

        console.log("Average Data:", avgData);
        setHardwareStats(avgData);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchAndCalculateAverages();
  }, [hardwareID]);

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
                <td>{progressItem.name}</td>
                <td className="hidden md:table-cell">
                  <div className="tbl-progress-bar">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${progressItem.popularityPercent}%`,
                      }}
                    ></div>
                  </div>
                </td>
                <td>
                  <div className="tbl-badge">{progressItem.Percent}</div>
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
