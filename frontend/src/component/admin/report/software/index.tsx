import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { DropDownListComponent } from "@syncfusion/ej2-react-dropdowns";
import { DateRangePickerComponent } from "@syncfusion/ej2-react-calendars";
import NotificationItem from "../NotificationItem";
import { GetAlertSoftware } from "../../../../services/index";
import dayjs from "dayjs";

const { Option } = Select;

interface Props {
  onCountChange?: (count: number) => void;
}

interface AlertItem {
  type: "environmental" | "garbage";
  data: any;
}

const timeDropdownData = [
  { Id: "day", Time: "Day(s)" },
  { Id: "month", Time: "Month" },
  { Id: "year", Time: "Year(s)" },
];

const NotificationWater: React.FC<Props> = ({ onCountChange }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [buildingFilter, setBuildingFilter] = useState<string>();
  const [parameterFilter, setParameterFilter] = useState<string>();
  const [loading, setLoading] = useState(true);

  const [timeRangeType, setTimeRangeType] = useState<"day" | "month" | "year">("day");
  const [selectedRange, setSelectedRange] = useState<any>(null);

  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [parameterOptions, setParameterOptions] = useState<string[]>([]);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
  const months = [
    { value: "01", label: "Jan" }, { value: "02", label: "Feb" },
    { value: "03", label: "Mar" }, { value: "04", label: "Apr" },
    { value: "05", label: "May" }, { value: "06", label: "Jun" },
    { value: "07", label: "Jul" }, { value: "08", label: "Aug" },
    { value: "09", label: "Sep" }, { value: "10", label: "Oct" },
    { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
  ];

  // helper functions
  const getEnvironmentName = (item: AlertItem) => item.data.Environment?.EnvironmentName ?? "-";
  const getParameterName = (item: AlertItem) => item.data.Parameter?.ParameterName ?? "-";
  const getStatusName = (item: AlertItem) => item.data.Status?.StatusName ?? "-";
  const getUnitName = (item: AlertItem) => item.data.Unit?.UnitName ?? "-";
  const getDataValue = (item: AlertItem) => item.data.Data ?? item.data.Quantity ?? 0;

  // โหลดข้อมูล alert
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const data = (await GetAlertSoftware()) ?? [];
        // กรองเฉพาะที่ไม่ผ่านเกณฑ์มาตรฐาน
        const filtered = data.filter(
          (r: AlertItem) =>
            getStatusName(r) === "ไม่ผ่านเกณฑ์มาตรฐาน" &&
            (r.type === "garbage" || r.data.BeforeAfterTreatment?.TreatmentName === "หลัง")
        );

        const sorted = filtered.sort(
          (a: AlertItem, b: AlertItem) => new Date(b.data.Date).getTime() - new Date(a.data.Date).getTime()
        );

        setAlerts(sorted);
        setFilteredAlerts(sorted);
        onCountChange?.(sorted.length);

        // ตัวเลือกสภาพแวดล้อม
        const buildings = [...new Set(sorted.map((r) => getEnvironmentName(r)).filter(Boolean))];
        setBuildingOptions(buildings);

        // ตัวเลือกพารามิเตอร์
        const parameters = [...new Set(sorted.map((r) => getParameterName(r)).filter(Boolean))];
        setParameterOptions(parameters);

      } catch (error) {
        console.error("Error fetching alert water:", error);
        setAlerts([]);
        setFilteredAlerts([]);
        onCountChange?.(0);
      }
      setLoading(false);
    };

    fetchAlerts();
  }, [onCountChange]);

  // ปรับตัวเลือกพารามิเตอร์ตามสภาพแวดล้อมที่เลือก
  useEffect(() => {
    if (!alerts) return;
    const parameters = alerts
      .filter((r) => (buildingFilter ? getEnvironmentName(r) === buildingFilter : true))
      .map((r) => getParameterName(r))
      .filter(Boolean);
    setParameterOptions([...new Set(parameters)]);

    if (parameterFilter && !parameters.includes(parameterFilter)) {
      setParameterFilter(undefined);
    }
  }, [alerts, buildingFilter]);

  // ฟิลเตอร์ข้อมูล
  useEffect(() => {
    const filtered = alerts.filter((item) => {
      const building = getEnvironmentName(item);
      const parameter = getParameterName(item);
      const itemDate = dayjs(item.data.Date);

      const matchBuilding = buildingFilter ? building === buildingFilter : true;
      const matchParameter = parameterFilter ? parameter === parameterFilter : true;

      let matchDate = true;
      if (timeRangeType === "day" && Array.isArray(selectedRange)) {
        matchDate =
          itemDate.isAfter(dayjs(selectedRange[0]).startOf("day")) &&
          itemDate.isBefore(dayjs(selectedRange[1]).endOf("day"));
      } else if (timeRangeType === "month" && selectedRange?.month && selectedRange?.year) {
        matchDate = itemDate.format("YYYY-MM") === `${selectedRange.year}-${selectedRange.month}`;
      } else if (timeRangeType === "year" && Array.isArray(selectedRange)) {
        const year = itemDate.year();
        matchDate = year >= selectedRange[0] && year <= selectedRange[1];
      }

      return matchBuilding && matchParameter && matchDate;
    });

    setFilteredAlerts(filtered);
    onCountChange?.(filtered.length);
  }, [buildingFilter, parameterFilter, alerts, selectedRange, timeRangeType, onCountChange]);

  return (
    <div className="p-2">
      {!loading && (
        <>
          {/* ฟิลเตอร์ */}
          <div className="flex flex-col md:flex-row gap-2 mb-2">
            <Select
              allowClear
              placeholder="สภาพแวดล้อม"
              className="w-full text-sm"
              onChange={(value) => { setBuildingFilter(value); setParameterFilter(undefined); }}
              value={buildingFilter}
              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            >
              {buildingOptions.map((b, i) => <Option key={i} value={b}>{b}</Option>)}
            </Select>

            <Select
              allowClear
              placeholder="พารามิเตอร์"
              className="w-full text-sm"
              onChange={setParameterFilter}
              value={parameterFilter}
              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            >
              {parameterOptions.map((p, i) => <Option key={i} value={p}>{p}</Option>)}
            </Select>
          </div>

          {/* เลือกช่วงเวลา */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <DropDownListComponent
              id="time"
              dataSource={timeDropdownData}
              fields={{ text: "Time", value: "Id" }}
              value={timeRangeType}
              change={(e) => { setTimeRangeType(e.value); setSelectedRange(null); }}
              placeholder="Select Range"
              popupHeight="180px"
              cssClass="w-full sm:w-40 border border-teal-500 rounded-md px-2 py-1"
            />

            {timeRangeType === "day" && (
              <DateRangePickerComponent
                placeholder="เลือกวันที่"
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
                  onChange={(e) => setSelectedRange({ ...selectedRange, month: e.target.value })}
                >
                  <option value="">เลือกเดือน</option>
                  {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select
                  className="border rounded px-3 py-2 w-full sm:w-auto"
                  value={selectedRange?.year || ""}
                  onChange={(e) => setSelectedRange({ ...selectedRange, year: e.target.value })}
                >
                  <option value="">เลือกปี</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            {timeRangeType === "year" && (
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <select
                  className="border rounded px-3 py-2 w-full sm:w-auto"
                  value={selectedRange?.[0] || ""}
                  onChange={(e) => setSelectedRange([+e.target.value, selectedRange?.[1] || +e.target.value])}
                >
                  <option value="">ปีเริ่มต้น</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  className="border rounded px-3 py-2 w-full sm:w-auto"
                  value={selectedRange?.[1] || ""}
                  onChange={(e) => setSelectedRange([selectedRange?.[0] || +e.target.value, +e.target.value])}
                >
                  <option value="">ปีสิ้นสุด</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>
        </>
      )}

      {/* แสดงรายการแจ้งเตือน */}
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {loading ? (
          <div className="text-center text-gray-400 py-10">กำลังโหลดข้อมูล...</div>
        ) : filteredAlerts.length > 0 ? (
          filteredAlerts.map((item) => {
            const dateObj = new Date(item.data.Date);
            const time = dateObj.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
            const date = dateObj.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });

            // แยกกรณีขยะกับน้ำ
            const title =
              item.type === "garbage"
                ? `${getParameterName(item)} ${getStatusName(item)}`
                : `${getParameterName(item)} ของ${getEnvironmentName(item)} ${getStatusName(item)}`;

            const description = `ค่าที่ตรวจพบ: ${getDataValue(item)} ${getUnitName(item)}
            สถานะ: ${getStatusName(item)}
            วันที่บันทึก: ${date} เวลา: ${time}`;

            return <NotificationItem key={item.type + item.data.ID} title={title} description={description} />;
          })
        ) : (
          <div className="text-center text-gray-400 py-10">ไม่พบข้อมูลการแจ้งเตือน</div>
        )}
      </div>
    </div>
  );
};

export default NotificationWater;
