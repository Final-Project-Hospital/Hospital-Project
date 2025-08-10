// src/page/admin/index.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Select, DatePicker, Modal } from "antd";
import dayjs, { Dayjs } from "dayjs";
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { Maximize2 } from "lucide-react";
import {
  GetEnvironmentalRecords,
  GetEnvironmentalEfficiency,
  RecordItem,
  EfficiencyItem,
} from "../../services/DashboardService";
import "./dashboard.css";

const { Option } = Select;

interface AlertItem {
  month_year: string;
  parameter: string;
  average: number;
  max_value: number;
  unit: string;
}

const AdminDashboard: React.FC = () => {
  // states เดิม
  const [data, setData] = useState<RecordItem[]>([]);
  const [effData, setEffData] = useState<EfficiencyItem[]>([]);
  const [selectedParam, setSelectedParam] = useState("");
  const [dateType, setDateType] = useState<"date" | "month" | "year">("month");
  const [date, setDate] = useState<Dayjs | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [view, setView] = useState<"before" | "after" | "compare">("compare");
  const [showModal, setShowModal] = useState(false);
  const [chartColor, setChartColor] = useState({
    before: "#7B61FF",
    after: "#33E944",
    compareBefore: "#FF4560",
    compareAfter: "#775DD0",
    efficiency: "#faad14",
  });

  // state ใหม่: alert data
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // ฟอร์แมตวันที่ใช้ส่ง API
  const formattedDate = date ? dayjs(date).format(
    dateType === "year" ? "YYYY" :
    dateType === "month" ? "YYYY-MM" : "YYYY-MM-DD") : undefined;

  // โหลด environmental records (เหมือนเดิม)
  useEffect(() => {
    const run = async () => {
      const res = await GetEnvironmentalRecords({
        date: formattedDate || undefined,
        type: formattedDate ? dateType : undefined,
        view,
      });
      setData(res ?? []);
    };
    run();
  }, [formattedDate, dateType, view]);

  // โหลด efficiency (เหมือนเดิม)
  useEffect(() => {
    const loadEff = async () => {
      const res = await GetEnvironmentalEfficiency({
        date: formattedDate,
        type: formattedDate ? dateType : undefined,
        param: selectedParam || undefined,
      });
      setEffData(res ?? []);
    };
    if (selectedParam) loadEff();
  }, [formattedDate, dateType, selectedParam]);

  // โหลด alerts ใหม่ — เรียก API โดยตรง
  useEffect(() => {
    async function loadAlerts() {
      let url = `/dashboard/environmental/alerts?type=${dateType}`;
      if (formattedDate) url += `&date=${formattedDate}`;
      if (selectedParam) url += `&param=${selectedParam}`;

      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        } else {
          setAlerts([]);
        }
      } catch {
        setAlerts([]);
      }
    }
    loadAlerts();
  }, [formattedDate, dateType, selectedParam]);

  // param options เดิม
  const params = useMemo(() => [...new Set(data.map((d) => d.parameter))], [data]);
  useEffect(() => {
    if (params.length > 0 && !params.includes(selectedParam)) {
      setSelectedParam(params[0]);
    }
  }, [params]);

  // labels สำหรับกราฟ (เหมือนเดิม)
  const labels = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter((d) => d.parameter === selectedParam)
          .map((d) =>
            new Date(d.date).toLocaleDateString("th-TH", {
              year: "numeric",
              ...(dateType !== "year" && { month: "numeric" }),
              ...(dateType === "date" && { day: "numeric" }),
            })
          )
      )
    );
  }, [data, selectedParam, dateType]);

  // สร้าง series สำหรับกราฟ (เหมือนเดิม)
  const makeSeries = (treatment: "ก่อน" | "หลัง") => {
    const tdata = data.filter((d) => d.parameter === selectedParam && d.treatment === treatment);
    return labels.map((lb) => {
      const f = tdata.find(
        (d) =>
          new Date(d.date).toLocaleDateString("th-TH", {
            year: "numeric",
            ...(dateType !== "year" && { month: "numeric" }),
            ...(dateType === "date" && { day: "numeric" }),
          }) === lb
      );
      return { x: lb, y: f ? f.value : 0 };
    });
  };

  // แปลง effData เป็น Map (เหมือนเดิม)
  const effMap = useMemo(() => {
    const m = new Map<string, number>();
    effData.forEach((e) => {
      const key = new Date(e.date).toLocaleDateString("th-TH", {
        year: "numeric",
        ...(dateType !== "year" && { month: "numeric" }),
        ...(dateType === "date" && { day: "numeric" }),
      });
      m.set(key, +(e.efficiency * 100).toFixed(2));
    });
    return m;
  }, [effData, dateType]);

  const effSeriesData = labels.map((lb) => ({
    x: lb,
    y: effMap.get(lb) ?? 0,
  }));

  // ปรับความสูงกราฟตามจำนวน alerts
  const graphHeight = alerts.length > 0 ? 250 : 350;

  // options กราฟ (เหมือนเดิม)
  const buildOpts = (title: string): ApexOptions => ({
    chart: { id: title, zoom: { enabled: true, type: "x", autoScaleYaxis: true }, toolbar: { show: true } },
    dataLabels: { enabled: false },
    xaxis: { categories: labels, labels: { rotate: -45 } },
    yaxis: { forceNiceScale: true, min: 0 },
    title: { text: title, align: "left" },
  });

  return (
    <>
      {/* การ์ดแจ้งเตือน */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
          {alerts.map((a, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #f5222d",
                backgroundColor: "#fff1f0",
                padding: 12,
                borderRadius: 6,
                minWidth: 220,
                boxShadow: "0 0 6px rgba(245, 34, 45, 0.2)",
              }}
            >
              <div><b>เดือน:</b> {a.month_year}</div>
              <div><b>พารามิเตอร์:</b> {a.parameter}</div>
              <div><b>ค่าเฉลี่ย:</b> {a.average.toFixed(2)} {a.unit}</div>
              <div><b>มาตรฐานสูงสุด:</b> {a.max_value.toFixed(2)} {a.unit}</div>
            </div>
          ))}
        </div>
      )}

      {/* header และ controls ตามเดิม */}
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

        {/* CONTROLS */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Select value={view} onChange={setView} style={{ width: 160 }}>
              <Option value="before">น้ำก่อนบำบัด</Option>
              <Option value="after">น้ำหลังบำบัด</Option>
              <Option value="compare">เปรียบเทียบก่อน–หลัง</Option>
            </Select>
          </Col>
          <Col>
            <Select value={selectedParam} onChange={setSelectedParam} style={{ width: 180 }}>
              {params.map((p) => (
                <Option key={p}>{p}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select value={dateType} onChange={(v) => { setDateType(v); setDate(null); }} style={{ width: 120 }}>
              <Option value="date">วัน</Option>
              <Option value="month">เดือน</Option>
              <Option value="year">ปี</Option>
            </Select>
          </Col>
          <Col>
            {dateType === "date" && <DatePicker value={date} onChange={setDate} />}
            {dateType === "month" && <DatePicker picker="month" value={date} onChange={setDate} />}
            {dateType === "year" && <DatePicker picker="year" value={date} onChange={setDate} />}
          </Col>
          <Col>
            <Select value={chartType} onChange={setChartType} style={{ width: 110 }}>
              <Option value="line">กราฟเส้น</Option>
              <Option value="bar">กราฟแท่ง</Option>
            </Select>
          </Col>
        </Row>

        {/* กราฟซ้าย */}
<Col span={12}>
  <div className="dashboard-graph-card">
    <div className="dashboard-head-graph-card">
      <div>{view === "before" ? "น้ำก่อนบำบัด" : view === "after" ? "น้ำหลังบำบัด" : "เปรียบเทียบก่อน-หลัง"}</div>
      <div>
        {(view === "before" || view === "after") && (
          <ColorPicker
            value={view === "before" ? chartColor.before : chartColor.after}
            onChange={(c: Color) => {
              const hex = c.toHexString();
              if (view === "before") setChartColor({ ...chartColor, before: hex });
              else setChartColor({ ...chartColor, after: hex });
            }}
          />
        )}
        {view === "compare" && (
          <>
            <ColorPicker
              value={chartColor.compareBefore}
              onChange={(c) => setChartColor({ ...chartColor, compareBefore: c.toHexString() })}
            />
            <ColorPicker
              value={chartColor.compareAfter}
              onChange={(c) => setChartColor({ ...chartColor, compareAfter: c.toHexString() })}
            />
          </>
        )}
        <Maximize2 style={{ cursor: "pointer", marginLeft: 8 }} onClick={() => setShowModal(true)} />
      </div>
    </div>
    <ApexChart
      key={view + chartType}
      options={buildOpts("")}
      series={
        view === "before"
          ? [{ name: "ก่อน", data: makeSeries("ก่อน"), color: chartColor.before }]
          : view === "after"
          ? [{ name: "หลัง", data: makeSeries("หลัง"), color: chartColor.after }]
          : [
              { name: "ก่อน", data: makeSeries("ก่อน"), color: chartColor.compareBefore },
              { name: "หลัง", data: makeSeries("หลัง"), color: chartColor.compareAfter },
            ]
      }
      type={chartType}
      height={graphHeight}
    />
  </div>
</Col>

{/* กราฟขวา efficiency */}
<Col span={12}>
  <div className="dashboard-graph-card">
    <div className="dashboard-head-graph-card">
      <div>ประสิทธิภาพ (%)</div>
      <div>
        <ColorPicker
          value={chartColor.efficiency}
          onChange={(c) => setChartColor({ ...chartColor, efficiency: c.toHexString() })}
        />
      </div>
    </div>
    <ApexChart
      options={buildOpts("Efficiency (%)")}
      series={[{ name: "Efficiency", data: effSeriesData, color: chartColor.efficiency }]}
      type="bar"
      height={graphHeight}
    />
  </div>
</Col>

        {/* MODAL */}
        <Modal open={showModal} footer={null} onCancel={() => setShowModal(false)} width={1000}>
          <ApexChart
            key={"modal" + view + chartType}
            options={buildOpts("Zoom Chart")}
            series={
              view === "before"
                ? [{ name: "ก่อน", data: makeSeries("ก่อน"), color: chartColor.before }]
                : view === "after"
                ? [{ name: "หลัง", data: makeSeries("หลัง"), color: chartColor.after }]
                : [
                    { name: "ก่อน", data: makeSeries("ก่อน"), color: chartColor.compareBefore },
                    { name: "หลัง", data: makeSeries("หลัง"), color: chartColor.compareAfter },
                  ]
            }
            type={chartType}
            height={600}
          />
        </Modal>
      </div>
    </>
  );
};

export default AdminDashboard;
