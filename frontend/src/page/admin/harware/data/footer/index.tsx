import { useEffect, useState } from "react";
import { BlockTitle } from "../../../../../style/global/default";
import { TopProductsWrap } from "./average_date";
import { ListDataHardware } from "../../../../../services/hardware";

interface HardwareStat {
  id: number;
  name: string;
  popularityPercent: number;
  Percent: string;
}

const TopProducts = () => {
  const [hardwareStats, setHardwareStats] = useState<HardwareStat[]>([]);

  useEffect(() => {
    const fetchHardwareData = async () => {
      const res = await ListDataHardware();
      if (res?.status === 200) {
        const data = res.data;

        if (data.length > 0) {
          const total = data.reduce(
            (acc: any, item: any) => {
              acc.formaldehyde += item.Formaldehyde;
              acc.humidity += item.Humidity;
              acc.temperature += item.Tempreture;
              return acc;
            },
            { formaldehyde: 0, humidity: 0, temperature: 0 }
          );

          const count = data.length;

          const avgFormaldehyde = total.formaldehyde / count;
          const avgHumidity = total.humidity / count;
          const avgTemperature = total.temperature / count;

          const formattedData: HardwareStat[] = [
            {
              id: 1,
              name: "Temperature",
              popularityPercent: Math.min((avgTemperature / 100) * 100, 100),
              Percent: avgTemperature.toFixed(2),
            },
            {
              id: 2,
              name: "Humidity",
              popularityPercent: Math.min(avgHumidity, 100),
              Percent: avgHumidity.toFixed(2),
            },
            {
              id: 3,
              name: "Formaldehyde",
              popularityPercent: Math.min((avgFormaldehyde / 5) * 100, 100),
              Percent: avgFormaldehyde.toFixed(2),
            },
          ];

          setHardwareStats(formattedData);
        }
      }
    };

    fetchHardwareData();
  }, []);

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
              <th className="hidden md:table-cell text-left">Average</th>
              <th className="text-left">Percent</th>
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

export default TopProducts;
