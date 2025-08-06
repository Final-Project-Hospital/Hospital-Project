import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { DropDownListComponent } from "@syncfusion/ej2-react-dropdowns";
import { DateRangePickerComponent } from "@syncfusion/ej2-react-calendars";
import { ListReportHardware } from "../../../../services/hardware";
import { SensorDataParameterInterface } from "../../../../interface/ISensorDataParameter";
import NotificationItem from "../NotificationItem";
import dayjs from "dayjs";

const { Option } = Select;

interface NotificationHardwareProps {
  onCountChange?: (count: number) => void;
}

const timeDropdownData = [
  { Id: "day", Time: "Day(s)" },
  { Id: "month", Time: "Month" },
  { Id: "year", Time: "Year(s)" },
];

const NotificationHardware: React.FC<NotificationHardwareProps> = ({ onCountChange }) => {
  const [reports, setReports] = useState<SensorDataParameterInterface[]>([]);
  const [filteredReports, setFilteredReports] = useState<SensorDataParameterInterface[]>([]);
  const [buildingFilter, setBuildingFilter] = useState<string>();
  const [floorFilter, setFloorFilter] = useState<string>();
  const [parameterFilter, setParameterFilter] = useState<string>();
  const [loading, setLoading] = useState(true);

  const [timeRangeType, setTimeRangeType] = useState<"day" | "month" | "year">("day");
  const [selectedRange, setSelectedRange] = useState<any>(null);

  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [floorOptions, setFloorOptions] = useState<string[]>([]);
  const [parameterOptions, setParameterOptions] = useState<string[]>([]);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  const months = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const reportData = await ListReportHardware();

      if (reportData && Array.isArray(reportData)) {
        const sortedReports = reportData.sort(
          (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()
        );
        setReports(sortedReports);
        setFilteredReports(sortedReports);
        onCountChange?.(sortedReports.length);

        const buildings = [...new Set(
          sortedReports.map((r) => r?.SensorData?.Hardware?.Room?.[0]?.Building?.BuildingName).filter(Boolean)
        )];

        const floors = [...new Set(
          sortedReports.map((r) => r?.SensorData?.Hardware?.Room?.[0]?.Floor)
            .filter((f): f is number => f !== undefined)
            .map(String)
        )];

        const parameters = [...new Set(
          sortedReports.map((r) => r?.HardwareParameter?.Parameter).filter(Boolean)
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
      const itemDate = dayjs(item.Date);

      const matchBuilding = buildingFilter ? buildingName === buildingFilter : true;
      const matchFloor = floorFilter ? floor === floorFilter : true;
      const matchParameter = parameterFilter ? parameter === parameterFilter : true;

      let matchDate = true;
      if (timeRangeType === "day" && Array.isArray(selectedRange)) {
        matchDate = itemDate.isAfter(dayjs(selectedRange[0]).startOf("day")) &&
                    itemDate.isBefore(dayjs(selectedRange[1]).endOf("day"));
      } else if (timeRangeType === "month" && selectedRange?.month && selectedRange?.year) {
        matchDate = itemDate.format("YYYY-MM") === `${selectedRange.year}-${selectedRange.month}`;
      } else if (timeRangeType === "year" && Array.isArray(selectedRange)) {
        const year = itemDate.year();
        matchDate = year >= selectedRange[0] && year <= selectedRange[1];
      }

      return matchBuilding && matchFloor && matchParameter && matchDate;
    });

    setFilteredReports(filtered);
    onCountChange?.(filtered.length);
  }, [buildingFilter, floorFilter, parameterFilter, reports, selectedRange, timeRangeType]);

  return (
    <div className="p-2">
      {!loading && (
        <>
          <div className="flex flex-col md:flex-row gap-2 mb-2">
            <Select
              allowClear
              placeholder="อาคาร"
              className="w-full text-sm"
              onChange={setBuildingFilter}
              value={buildingFilter}
              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            >
              {buildingOptions.map((b, i) => (
                <Option key={i} value={b}>{b}</Option>
              ))}
            </Select>

            <Select
              allowClear
              placeholder="ชั้น"
              className="w-full text-sm"
              onChange={setFloorFilter}
              value={floorFilter}
              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            >
              {floorOptions.map((f, i) => (
                <Option key={i} value={f}>{f}</Option>
              ))}
            </Select>

            <Select
              allowClear
              placeholder="Parameter"
              className="w-full text-sm"
              onChange={setParameterFilter}
              value={parameterFilter}
              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            >
              {parameterOptions.map((p, i) => (
                <Option key={i} value={p}>{p}</Option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <DropDownListComponent
              id="time"
              dataSource={timeDropdownData}
              fields={{ text: "Time", value: "Id" }}
              value={timeRangeType}
              change={(e) => {
                setTimeRangeType(e.value);
                setSelectedRange(null); // reset เมื่อเปลี่ยนช่วงเวลา
              }}
              placeholder="Select Range"
              popupHeight="180px"
              cssClass="w-full sm:w-40 border border-teal-500 rounded-md px-2 py-1"
            />

            {/* ✅ Show Selector by time type */}
            {timeRangeType === "day" && (
              <DateRangePickerComponent
                placeholder="Select date(s)"
                change={(e) => setSelectedRange(e.value)}
                max={new Date()}
                cssClass="w-full"
              />
            )}

            {timeRangeType === "month" && (
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <select
                  className="border rounded px-3 py-2 w-full sm:w-auto"
                  value={selectedRange?.month || ""}
                  onChange={(e) =>
                    setSelectedRange({ ...selectedRange, month: e.target.value })
                  }
                >
                  <option value="">Select Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded px-3 py-2 w-full sm:w-auto"
                  value={selectedRange?.year || ""}
                  onChange={(e) =>
                    setSelectedRange({ ...selectedRange, year: e.target.value })
                  }
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {timeRangeType === "year" && (
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <select
                  className="border rounded px-3 py-2 w-full sm:w-auto"
                  value={selectedRange?.[0] || ""}
                  onChange={(e) =>
                    setSelectedRange([+e.target.value, selectedRange?.[1] || +e.target.value])
                  }
                >
                  <option value="">Start Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded px-3 py-2 w-full sm:w-auto"
                  value={selectedRange?.[1] || ""}
                  onChange={(e) =>
                    setSelectedRange([selectedRange?.[0] || +e.target.value, +e.target.value])
                  }
                >
                  <option value="">End Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading...</div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((item) => {
            const parameter = item.HardwareParameter?.Parameter || "Unknown Parameter";
            const value = item.Data.toFixed(2);
            const standard =
              item.HardwareParameter?.StandardHardware?.Standard?.toFixed(2) ?? "-";
            const unit = item.HardwareParameter?.UnitHardware?.Unit || "";

            const dateObj = new Date(item.Date);
            const time = dateObj.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const date = dateObj.toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            const roomInfo = item.SensorData?.Hardware?.Room?.[0];
            const roomName = roomInfo?.RoomName || "ไม่ทราบชื่อห้อง";
            const floor = roomInfo?.Floor ?? "-";
            const buildingName = roomInfo?.Building?.BuildingName || "ไม่ทราบอาคาร";

            const title = `${parameter} Over Limit`;
            const description = `ตรวจพบค่า ${parameter} = ${value} ${unit} (เกิน ${standard}) ที่ห้อง ${roomName} ชั้น ${floor} อาคาร ${buildingName} วันที่ ${date} เวลา ${time}`;

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
