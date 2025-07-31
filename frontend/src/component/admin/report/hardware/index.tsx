import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { ListReportHardware } from "../../../../services/hardware";
import { SensorDataParameterInterface } from "../../../../interface/ISensorDataParameter";
import NotificationItem from "../NotificationItem";

const { Option } = Select;

interface NotificationHardwareProps {
  onCountChange?: (count: number) => void;
}

const NotificationHardware: React.FC<NotificationHardwareProps> = ({ onCountChange }) => {
  const [reports, setReports] = useState<SensorDataParameterInterface[]>([]);
  const [filteredReports, setFilteredReports] = useState<SensorDataParameterInterface[]>([]);
  const [buildingFilter, setBuildingFilter] = useState<string>();
  const [floorFilter, setFloorFilter] = useState<string>();
  const [parameterFilter, setParameterFilter] = useState<string>();
  const [loading, setLoading] = useState(true);

  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [floorOptions, setFloorOptions] = useState<string[]>([]);
  const [parameterOptions, setParameterOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const reportData = await ListReportHardware();

      if (reportData && Array.isArray(reportData)) {
        setReports(reportData);
        setFilteredReports(reportData);
        onCountChange?.(reportData.length);

        // ✅ Extract options from reportData
        const buildings = [...new Set(
          reportData
            .map((r) => r?.SensorData?.Hardware?.Room?.[0]?.Building?.BuildingName)
            .filter((b): b is string => !!b)
        )];

        const floors = [...new Set(
          reportData
            .map((r) => r?.SensorData?.Hardware?.Room?.[0]?.Floor)
            .filter((f): f is number => f !== undefined)
            .map((f) => String(f))
        )];

        const parameters = [...new Set(
          reportData
            .map((r) => r?.HardwareParameter?.Parameter)
            .filter((p): p is string => !!p)
        )];

        setBuildingOptions(buildings);
        setFloorOptions(floors);
        setParameterOptions(parameters);
      }

      setLoading(false);
    };

    fetchData();
  }, [onCountChange]);

  useEffect(() => {
    const filtered = reports.filter((item) => {
      const roomInfo = item.SensorData?.Hardware?.Room?.[0];
      const buildingName = roomInfo?.Building?.BuildingName ?? "";
      const floor = roomInfo?.Floor !== undefined ? String(roomInfo.Floor) : "";
      const parameter = item.HardwareParameter?.Parameter ?? "";

      const matchBuilding = buildingFilter ? buildingName === buildingFilter : true;
      const matchFloor = floorFilter ? floor === floorFilter : true;
      const matchParameter = parameterFilter ? parameter === parameterFilter : true;

      return matchBuilding && matchFloor && matchParameter;
    });

    setFilteredReports(filtered);
  }, [buildingFilter, floorFilter, parameterFilter, reports]);

  return (
    <div className="p-2">
      {!loading && (
        <div className="flex gap-2 mb-4">
          <Select
            allowClear
            placeholder="อาคาร"
            className="w-full text-sm"
            onChange={setBuildingFilter}
            value={buildingOptions.includes(buildingFilter ?? "") ? buildingFilter : undefined}
            getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
          >
            {buildingOptions.map((b, i) => (
              <Option key={`building-${i}`} value={b}>
                {b}
              </Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="ชั้น"
            className="w-full text-sm"
            onChange={setFloorFilter}
            value={floorOptions.includes(floorFilter ?? "") ? floorFilter : undefined}
            getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
          >
            {floorOptions.map((f, i) => (
              <Option key={`floor-${i}`} value={f}>
                {f}
              </Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="Parameter"
            className="w-full text-sm"
            onChange={setParameterFilter}
            value={parameterOptions.includes(parameterFilter ?? "") ? parameterFilter : undefined}
            getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
          >
            {parameterOptions.map((p, i) => (
              <Option key={`param-${i}`} value={p}>
                {p}
              </Option>
            ))}
          </Select>
        </div>
      )}

      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading...</div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((item) => {
            const parameter = item.HardwareParameter?.Parameter || "Unknown Parameter";
            const value = item.Data.toFixed(2);
            const standard = item.HardwareParameter?.StandardHardware?.Standard?.toFixed(2) ?? "-";
            const unit = item.HardwareParameter?.UnitHardware?.Unit || ""; // ✅ เพิ่มหน่วย
            const time = new Date(item.Date).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const roomInfo = item.SensorData?.Hardware?.Room?.[0];
            const roomName = roomInfo?.RoomName || "ไม่ทราบชื่อห้อง";
            const floor = roomInfo?.Floor ?? "-";
            const buildingName = roomInfo?.Building?.BuildingName || "ไม่ทราบอาคาร";

            const title = `${parameter} Over Limit`;
            const description = `ตรวจพบค่า ${parameter} = ${value} ${unit} (เกิน ${standard}) ที่ห้อง ${roomName} ชั้น ${floor} อาคาร ${buildingName} เวลา ${time}`;

            return (
              <NotificationItem key={item.ID} title={title} description={description} />
            );
          })
        ) : (
          <div className="text-center text-gray-400 py-10">No new notifications</div>
        )}
      </div>
    </div>
  );
};

export default NotificationHardware;
