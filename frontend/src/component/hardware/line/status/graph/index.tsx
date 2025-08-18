import { Space, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { MdFiberManualRecord } from "react-icons/md";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ListNotification } from "../../../../../services/hardware";
import { NotificationInterface } from "../../../../../interface/INotification";
import { useNotificationContext } from "../../NotificationContext";

// type ของ legend item
interface LegendPayloadItem {
  value: string;
  color: string;
}

const RenderLegend = (props: any): React.ReactNode => {
  const { payload } = props as { payload?: LegendPayloadItem[] };
  return (
    <Space wrap className="justify-center">
      {payload?.map((entry, index) => (
        <div className="flex items-center gap-4" key={index}>
          <MdFiberManualRecord style={{ color: entry.color }} />
          <span className="text-xs">{entry.value}</span>
        </div>
      ))}
    </Space>
  );
};

const Graph = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const { reloadKey } = useNotificationContext();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await ListNotification();
      if (res) {
        const notifications = res as NotificationInterface[];

        // แยกสถานะ: แจ้งเตือน / ไม่แจ้งเตือน
        const alertCount = notifications.filter((n) => n.Alert).length;
        const normalCount = notifications.filter((n) => !n.Alert).length;

        setData([
          { name: "แจ้งเตือน", value: alertCount, color: "#66BB6A" },
          { name: "ไม่แจ้งเตือน", value: normalCount, color: "#EF5350" },
        ]);
      }
      setLoading(false);
    };
    fetchData();
  }, [reloadKey]); // ✅ reloadKey เปลี่ยน → fetch ใหม่

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Spin />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Tooltip
          animationEasing={"ease-in-out"}
          content={({ active, payload }) =>
            active ? (
              <div>
                {payload?.map((row: any, index: number) => (
                  <div
                    key={index}
                    className={index !== payload.length - 1 ? "mb-1" : ""}
                  >
                    <div style={{ color: row.color }}>
                      {row.name} {row.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : null
          }
          wrapperStyle={{
            background: "rgba(255,255,255,.9)",
            borderRadius: 4,
            padding: "5px 8px",
            fontWeight: 500,
            boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
          }}
          cursor={false}
        />
        <Pie
          data={data}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={80}
        >
          {data.map((item, index) => (
            <Cell key={index} fill={item.color} />
          ))}
        </Pie>
        <Legend
          content={<RenderLegend />}
          wrapperStyle={{ position: "absolute", bottom: 0 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default Graph;
