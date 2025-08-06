// pages/Dashboard.tsx (เฉพาะส่วนที่เปลี่ยนแปลงสำคัญ)
import React, { useEffect, useMemo, useState } from "react";
import { DatePicker, Radio, Row, Col, Select } from "antd";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend,
} from "chart.js";
import dayjs, { Dayjs } from "dayjs";
import "./dashboard.css";
import {
  GetEnvironmentalRecords, RecordItem,
  GetEnvironmentalEfficiency, EfficiencyItem,
} from "../../services/DashboardService";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const { Option } = Select;

const Dashboard: React.FC = () => {
  const [data, setData] = useState<RecordItem[]>([]);
  const [effData, setEffData] = useState<EfficiencyItem[]>([]); // ✅ ใหม่
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedDateType, setSelectedDateType] = useState<"date" | "month" | "year">("date");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [viewType, setViewType] = useState<"before" | "after" | "compare">("before");
  const [loading, setLoading] = useState(false);
  const [parameterOptions, setParameterOptions] = useState<string[]>([]);

  const formattedDate: string | undefined = useMemo(() => {
    if (!selectedDate) return undefined;
    if (selectedDateType === "date") return selectedDate.format("YYYY-MM-DD");
    if (selectedDateType === "month") return selectedDate.format("YYYY-MM");
    return selectedDate.format("YYYY");
  }, [selectedDate, selectedDateType]);

  // โหลดชุดหลัก (ค่าก่อน/หลัง)
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const resData = await GetEnvironmentalRecords({
          date: formattedDate,
          type: formattedDate ? selectedDateType : undefined,
          view: viewType,
        });
        const safeData = resData ?? [];
        setData(safeData);

        const paramsSet = [...new Set(safeData.map((d) => d.parameter))];
        setParameterOptions(paramsSet);
        if ((!selectedParam || !paramsSet.includes(selectedParam)) && paramsSet.length > 0) {
          setSelectedParam(paramsSet[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [formattedDate, selectedDateType, viewType]);

  // โหลดประสิทธิภาพ (ตามช่วงเวลาเดียวกัน และ optional กรอง param)
  useEffect(() => {
    const run = async () => {
      const res = await GetEnvironmentalEfficiency({
        date: formattedDate,
        type: formattedDate ? selectedDateType : undefined,
        // ถ้าต้องการดึงทุกพารามิเตอร์ให้ตัด param ออกได้ แต่ที่นี่เราจะกรองด้วย selectedParam
        param: selectedParam || undefined,
      });
      setEffData(res ?? []);
    };
    // โหลดเมื่อ selectedParam พร้อมแล้ว (หลัง data มาก่อน)
    if (selectedParam) run();
  }, [formattedDate, selectedDateType, selectedParam]);

  // labels กราฟหลัก (ขึ้นกับ param ที่เลือก)
  const labels = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter((d) => d.parameter === selectedParam)
          .map((d) =>
            new Date(d.date).toLocaleDateString("th-TH", {
              year: "numeric",
              ...(selectedDateType !== "year" && { month: "numeric" }),
              ...(selectedDateType === "date" && { day: "numeric" }),
            })
          )
      )
    );
  }, [data, selectedParam, selectedDateType]);

  const getDataset = (treatment: string, color: string) => {
    const treatmentData = data.filter(
      (d) => d.parameter === selectedParam && d.treatment === treatment
    );
    return {
      label: `${selectedParam} (${treatment})`,
      data: labels.map((label) => {
        const match = treatmentData.find(
          (d) =>
            new Date(d.date).toLocaleDateString("th-TH", {
              year: "numeric",
              ...(selectedDateType !== "year" && { month: "numeric" }),
              ...(selectedDateType === "date" && { day: "numeric" }),
            }) === label
        );
        return match ? match.value : null;
      }),
      borderColor: color,
      backgroundColor: color,
      tension: 0.2,
    };
  };

  type ChartDataset = {
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  };

  let datasets: ChartDataset[] = [];
  if (viewType === "compare") {
    datasets = [getDataset("ก่อน", "#f5222d"), getDataset("หลัง", "#52c41a")];
  } else {
    datasets = [getDataset(viewType === "before" ? "ก่อน" : "หลัง", "#1890ff")];
  }
  const chartData = { labels, datasets };

  // ===== กราฟแท่ง ประสิทธิภาพ =====
  // แปลง effData (เฉพาะ param ที่เลือก) ให้แมปกับ labels เดียวกัน
  const efficiencyMap = useMemo(() => {
    const m = new Map<string, number>();
    effData
      .filter((e) => e.parameter === selectedParam)
      .forEach((e) => {
        const label = new Date(e.date).toLocaleDateString("th-TH", {
          year: "numeric",
          ...(selectedDateType !== "year" && { month: "numeric" }),
          ...(selectedDateType === "date" && { day: "numeric" }),
        });
        m.set(label, e.efficiency); // ค่าตามสูตรที่ backend ส่งมา
      });
    return m;
  }, [effData, selectedParam, selectedDateType]);

  const efficiencyBarData = {
    labels,
    datasets: [
      {
        label: `ประสิทธิภาพ (${selectedParam})`,
        data: labels.map((lb) => {
          const v = efficiencyMap.get(lb);
          return v !== undefined ? v : null;
        }),
        backgroundColor: "#faad14", // โทนส้มทอง
      },
    ],
  };

  return (
    <div>
      {/* header */}
      <div className="title-header">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold drop-shadow-md">
              การตรวจวัดคุณภาพสิ่งแวดล้อม
            </h1>
            <p className="text-sm drop-shadow-sm leading-snug">
              โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
            </p>
          </div>
        </div>
      </div>

      {/* controls + charts */}
      <div className="max-w-screen-xl mx-auto mt-6 bg-white rounded-lg p-6 text-black">
        {/* controls */}
        <Row gutter={16} align="middle" style={{ marginBottom: 8 }}>
          <Col flex="1" style={{ textAlign: "center" }}>
            <Radio.Group value={selectedParam} onChange={(e) => setSelectedParam(e.target.value)} style={{ flexWrap: "wrap" }}>
              {parameterOptions.map((param) => (
                <Radio.Button key={param} value={param}>
                  {param}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Col>

          <Col>
            <Radio.Group
              value={selectedDateType}
              onChange={(e) => {
                setSelectedDateType(e.target.value);
                setSelectedDate(null);
              }}
              style={{ marginBottom: 8, marginRight: 5 }}
            >
              <Radio.Button value="date">วัน</Radio.Button>
              <Radio.Button value="month">เดือน</Radio.Button>
              <Radio.Button value="year">ปี</Radio.Button>
            </Radio.Group>

            {selectedDateType === "date" && (
              <DatePicker picker="date" value={selectedDate} onChange={setSelectedDate} placeholder="เลือกวัน" format="DD MMMM YYYY" size="middle" />
            )}
            {selectedDateType === "month" && (
              <DatePicker picker="month" value={selectedDate} onChange={setSelectedDate} placeholder="เลือกเดือน" format="MMMM YYYY" size="middle" />
            )}
            {selectedDateType === "year" && (
              <DatePicker picker="year" value={selectedDate} onChange={setSelectedDate} placeholder="เลือกปี" format="YYYY" size="middle" />
            )}
          </Col>
        </Row>

        <Row justify="end" gutter={16} style={{ marginBottom: 16, marginRight: 25 }}>
          <Col>
            <Select value={viewType} onChange={(val) => setViewType(val)} style={{ width: 150 }}>
              <Option value="before">ก่อนบำบัด</Option>
              <Option value="after">หลังบำบัด</Option>
              <Option value="compare">เปรียบเทียบ</Option>
            </Select>
          </Col>

          <Col>
            <Select value={chartType} onChange={(val) => setChartType(val)} style={{ width: 120 }}>
              <Option value="line">กราฟเส้น</Option>
              <Option value="bar">กราฟแท่ง</Option>
            </Select>
          </Col>
        </Row>

        {/* กราฟหลัก (ค่าก่อน/หลัง/เปรียบเทียบ) */}
        <Row gutter={16}>
  {/* ซ้าย: กราฟค่าก่อน/หลัง/เปรียบเทียบ */}
  <Col xs={24} lg={12} style={{ height: 320 }}>
    {chartType === "line" ? (
      <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
    ) : (
      <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
    )}
  </Col>

  {/* ขวา: กราฟแท่งประสิทธิภาพ */}
  <Col xs={24} lg={12} style={{ height: 320 }}>
    <Bar data={efficiencyBarData} options={{ responsive: true, maintainAspectRatio: false }} />
  </Col>
</Row>
        {loading && <p>กำลังโหลดข้อมูล...</p>}
        {!loading && datasets.every((ds) => ds.data.every((v: number | null) => v === null)) && (
          <p>ไม่มีข้อมูลสำหรับการเลือกนี้</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
