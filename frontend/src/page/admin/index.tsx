import React, { useEffect, useState } from "react";
import { Card, DatePicker, Radio, Space, Row, Col, Select } from "antd";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import dayjs, { Dayjs } from "dayjs";
import "./dashboard.css";


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

interface RecordItem {
  date: string;
  value: number;
  parameter: string;
  unit: string;
  treatment: string;
  status: string;
}

const { Option } = Select;

const Dashboard: React.FC = () => {
  const [data, setData] = useState<RecordItem[]>([]);
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedDateType, setSelectedDateType] = useState<"date" | "month" | "year">("date");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [viewType, setViewType] = useState<"before" | "after" | "compare">("before");
  const [loading, setLoading] = useState(false);
  const [parameterOptions, setParameterOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const params = new URLSearchParams();

        if (selectedDate) {
          if (selectedDateType === "date") {
            params.append("date", selectedDate.format("YYYY-MM-DD"));
          } else if (selectedDateType === "month") {
            params.append("date", selectedDate.format("YYYY-MM"));
          } else if (selectedDateType === "year") {
            params.append("date", selectedDate.format("YYYY"));
          }
          params.append("type", selectedDateType);
        }
        
        if (viewType) {
          params.append("view", viewType);
        }
        
        const res = await fetch(`http://localhost:8000/dashboard/environmental?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Fetch error: ${res.status} - ${errorText}`);
        }

        const resData: RecordItem[] = await res.json();
        setData(resData ?? []);

        const paramsSet = [...new Set(resData.map((d) => d.parameter))];
        setParameterOptions(paramsSet);

        if ((!selectedParam || !paramsSet.includes(selectedParam)) && paramsSet.length > 0) {
          setSelectedParam(paramsSet[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, selectedDateType, viewType]);

  const labels = Array.from(
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
      fill: false,
      borderColor: color,
      backgroundColor: color,
      tension: 0.2,
    };
  };

  let datasets = [];
  if (viewType === "compare") {
    datasets = [
      getDataset("ก่อน", "#f5222d"),
      getDataset("หลัง", "#52c41a"),
    ];
  } else {
    datasets = [getDataset(viewType === "before" ? "ก่อน" : "หลัง", "#1890ff")];
  }

  const chartData = {
    labels,
    datasets,
  };

  const calcPercentOverStandard = () => {
    if (!selectedParam) return 0;
    const filtered = data.filter(d => d.parameter === selectedParam);
    if (filtered.length === 0) return 0;
    const overCount = filtered.filter(d => d.value > 50).length;
    return Math.round((overCount / filtered.length) * 100);
  };

  const pieData = {
    labels: ["ไม่เกินมาตรฐาน", "เกินมาตรฐาน"],
    datasets: [
      {
        data: [100 - calcPercentOverStandard(), calcPercentOverStandard()],
        backgroundColor: ["#52c41a", "#f5222d"],
        hoverBackgroundColor: ["#73d13d", "#ff4d4f"],
      },
    ],
  };

  return (
    <div>
  {/* ส่วนหัวพื้นหลังเขียว */}
  <div className="title-header">
    <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div><h1 className="text-lg sm:text-xl md:text-2xl font-semibold drop-shadow-md">
        การตรวจวัดคุณภาพสิ่งแวดล้อม</h1>
      <p className="text-sm drop-shadow-sm leading-snug">
        โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
      </p></div>
    </div>
  </div>

  {/* ส่วนควบคุมและกราฟ */}
  <div className="max-w-screen-xl mx-auto mt-6 bg-white rounded-lg p-6 text-black">
    {/* เลือกพารามิเตอร์ และ วันที่ */}
    <Row gutter={16} align="middle" style={{ marginBottom: 8 }}>
      <Col flex="1" style={{ textAlign: "center" }}>
        <Radio.Group
          value={selectedParam}
          onChange={(e) => setSelectedParam(e.target.value)}
          style={{ flexWrap: "wrap" }}
        >
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
          style={{ marginBottom: 8 ,marginRight : 5}}
        >
          <Radio.Button value="date">วัน</Radio.Button>
          <Radio.Button value="month">เดือน</Radio.Button>
          <Radio.Button value="year">ปี</Radio.Button>
        </Radio.Group>

        {selectedDateType === "date" && (
          <DatePicker
            picker="date"
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="เลือกวัน"
            format="DD MMMM YYYY"
            size="middle"
          />
        )}
        {selectedDateType === "month" && (
          <DatePicker
            picker="month"
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="เลือกเดือน"
            format="MMMM YYYY"
            size="middle"
          />
        )}
        {selectedDateType === "year" && (
          <DatePicker
            picker="year"
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="เลือกปี"
            format="YYYY"
            size="middle"
          />
        )}
      </Col>
    </Row>

    {/* เลือกประเภทข้อมูล และกราฟ */}
    <Row justify="end" gutter={16} style={{ marginBottom: 16 ,marginRight : 25}}>
      <Col>
        <Select
          value={viewType}
          onChange={(val) => setViewType(val)}
          style={{ width: 150 }}
        >
          <Option value="before">ก่อนบำบัด</Option>
          <Option value="after">หลังบำบัด</Option>
          <Option value="compare">เปรียบเทียบ</Option>
        </Select>
      </Col>

      <Col>
        <Select
          value={chartType}
          onChange={(val) => setChartType(val)}
          style={{ width: 120 }}
        >
          <Option value="line">กราฟเส้น</Option>
          <Option value="bar">กราฟแท่ง</Option>
        </Select>
      </Col>
    </Row>

    {/* กราฟ */}
    <Row gutter={16}>
      <Col flex="auto" style={{ height: 320 }}>
        {chartType === "line" ? (
          <Line data={chartData} />
        ) : (
          <Bar data={chartData} />
        )}
      </Col>

      <Col flex="300px" style={{ height: 320 }}>
        <Pie
          data={{
            labels: ["ไม่เกินมาตรฐาน", "เกินมาตรฐาน"],
            datasets: [
              {
                data: [100 - calcPercentOverStandard(), calcPercentOverStandard()],
                backgroundColor: ["#52c41a", "#f5222d"],
                hoverBackgroundColor: ["#73d13d", "#ff4d4f"],
              },
            ],
          }}
          options={{ plugins: { legend: { position: "bottom" } } }}
        />
        <p style={{ textAlign: "center", marginTop: 8 }}>
          % เกินค่ามาตรฐาน: {calcPercentOverStandard()}%
        </p>
      </Col>
    </Row>

    {/* แสดงสถานะโหลดหรือไม่มีข้อมูล */}
    {loading && <p>กำลังโหลดข้อมูล...</p>}
    {!loading && datasets.every((ds) => ds.data.every((v) => v === null)) && (
      <p>ไม่มีข้อมูลสำหรับการเลือกนี้</p>
    )}
  </div>
</div>

  );
};

export default Dashboard;