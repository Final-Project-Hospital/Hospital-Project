import { useEffect, useState } from "react";
import { BlockTitle } from "../../../../../style/global/default";
import { TopProductsWrap } from "./average_date";
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
  ListHardwareParameterIDsByHardwareID,
} from "../../../../../services/hardware";

interface HardwareStat {
  id: number;
  name: string;
  popularityPercent: number;
  average: number;
  standard?: number;      // ค่ามาตรฐาน (สูงสุด) จาก backend: standard
  standardMin?: number;   // ค่ามาตรฐานต่ำสุด   จาก backend: standard_min
  unit?: string;
}

interface AveragedataProps {
  hardwareID: number;
  reloadKey?: any;
  onLoaded?: () => void;
}

interface HardwareParameterWithColor {
  id: number;
  parameter: string;
  graph_id: number;
  graph: string;
  color: string;
  unit?: string;

  // ฟิลด์จาก backend
  standard?: number;       // Max
  standard_min?: number;   // Min
}

interface ListHardwareParameterResponse {
  hardware_id: string;
  parameters: HardwareParameterWithColor[];
}

const Average: React.FC<AveragedataProps> = ({ hardwareID, reloadKey, onLoaded }) => {
  const [hardwareStats, setHardwareStats] = useState<HardwareStat[]>([]);
  const [parameterColors, setParameterColors] = useState<Record<string, string>>({});
  const [parameterMeta, setParameterMeta] = useState<
    Record<string, { unit?: string; standard?: number; standardMin?: number }>
  >({});

  useEffect(() => {
    const fetchAndCalculateAverages = async () => {
      if (!hardwareID) {
        onLoaded?.();
        return;
      }

      try {
        const [sensorData, paramInfoRaw] = await Promise.all([
          GetSensorDataByHardwareID(hardwareID),
          ListHardwareParameterIDsByHardwareID(hardwareID),
        ]);

        const paramInfo: ListHardwareParameterResponse = {
          hardware_id: String(hardwareID),
          parameters: (paramInfoRaw?.parameters || []).map((p: any) => ({
            ...p,
            color: p.color || "#999999",
          })),
        };

        const colorMap: Record<string, string> = {};
        const metaMap: Record<string, { unit?: string; standard?: number; standardMin?: number }> = {};
        for (const p of paramInfo.parameters) {
          colorMap[p.parameter] = p.color;
          metaMap[p.parameter] = {
            unit: p.unit,
            standard: typeof p.standard === "number" ? p.standard : undefined,
            standardMin: typeof p.standard_min === "number" ? p.standard_min : undefined,
          };
        }
        setParameterColors(colorMap);
        setParameterMeta(metaMap);

        if (!Array.isArray(sensorData) || sensorData.length === 0) {
          setHardwareStats([]);
          onLoaded?.();
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

        const avgData = Array.from(allParamsSet).map((key, idx) => {
          const avg = counts[key] > 0 ? sums[key] / counts[key] : 0;
          const maxValue = maxValues[key] || 100;
          const popularityPercent = maxValue > 0 ? Math.min((avg / maxValue) * 100, 100) : 0;
          const meta = metaMap[key] || {};
          return {
            id: idx + 1,
            name: key,
            popularityPercent,
            average: avg,
            standard: meta.standard,          // แสดงค่าสูงสุด
            standardMin: meta.standardMin,    // แสดงค่าต่ำสุด
            unit: meta.unit,
          } as HardwareStat;
        });


        setHardwareStats(avgData);
        onLoaded?.();
      } catch (error) {
        console.error("❌ Error fetching averages:", error);
        setHardwareStats([]);
        onLoaded?.();
      }
    };

    fetchAndCalculateAverages();
  }, [hardwareID, reloadKey, onLoaded]);

  return (
    <TopProductsWrap>
      <div className="block-head">
        <BlockTitle className="block-title">
          <h3>ข้อมูลเฉลี่ยของเซนเซอร์</h3>
        </BlockTitle>
      </div>

      <div className="tbl-products overflow-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="text-left p-2">ลำดับ</th>
              <th className="text-left p-2">พารามิเตอร์ (หน่วย)</th>
              <th className="text-left p-2">ค่ามาตรฐานต่ำสุด</th>
              <th className="text-left p-2 w-[140px]">ค่ามาตรฐานสูงสุด</th>
              <th className="hidden md:table-cell text-left p-2">แถบแสดงค่าเฉลี่ย</th>
              <th className="text-left p-2">ค่าเฉลี่ย</th>
            </tr>
          </thead>
          <tbody>
            {hardwareStats?.map((item, index) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: parameterColors[item.name] || "#999999",
                      }}
                    />
                    {item.name}{" "}
                    {item.unit && <span className="text-xs text-gray-500">({item.unit})</span>}
                  </div>
                </td>

                {/* ค่ามาตรฐานต่ำสุด */}
                <td className="p-2">
                  {item.standardMin !== undefined && item.standardMin !== 0 ? (
                    <span className="text-gray-800 font-medium">
                      {Number(item.standardMin).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-teal-500 font-medium">ยังไม่กำหนดค่าต่ำสุด</span>
                  )}
                </td>

                {/* ค่ามาตรฐาน (สูงสุด) */}
                <td className="p-2">
                  {item.standard !== undefined && item.standard !== 0 ? (
                    <span className="text-gray-800 font-medium">
                      {Number(item.standard).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-teal-500 font-medium">ยังไม่กำหนดค่ามาตรฐาน</span>
                  )}
                </td>

                {/* แถบแสดงค่าเฉลี่ย */}
                <td className="hidden md:table-cell p-2">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${item.popularityPercent}%`,
                        background: parameterColors[item.name] || "#999999",
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                </td>

                {/* ค่าเฉลี่ย */}
                <td className="p-2">
                  <div
                    className="text-white text-sm font-medium px-3 py-1 rounded-full text-center"
                    style={{
                      background: parameterColors[item.name] || "#999999",
                      minWidth: 60,
                      display: "inline-block",
                    }}
                  >
                    {Number(item.average).toFixed(2)}
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
