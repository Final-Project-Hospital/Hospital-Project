// src/page/admin/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Select,
  DatePicker,
  Modal,
  ColorPicker,
  Button,
  Card,
  Segmented,
} from "antd";
import type { Color } from "antd/es/color-picker";
import dayjs, { Dayjs } from "dayjs";
import th_TH from "antd/es/date-picker/locale/th_TH";
import ApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Maximize2 } from "lucide-react";

import {
  GetEnvironmentalRecords,
  GetEnvironmentalEfficiency,
  // @ts-ignore – ฟังก์ชันใหม่ใน service (ต้องมี)
  GetEnvironmentalMeta,
  type RecordItem,
  type EfficiencyItem,
} from "../../services/DashboardService";

import { fetchPrediction } from "../../services/predict";
import { PredictionOutput } from "../../interface/IPredict";

import "./dashboard.css";
import "./skydash-override.css";

const { RangePicker } = DatePicker;
const { Option } = Select;

/* ===== meta types ===== */
interface ParamMeta {
  id: number;
  name: string;
  unit: string;
  std_min?: number | null;
  std_middle?: number | null;
  std_max?: number | null;
}
interface EnvMeta {
  id: number;
  name: string; // น้ำเสีย, น้ำดื่ม, น้ำประปา, ขยะ
  params: ParamMeta[];
}

/* ===== helpers ===== */
const formatThaiLabel = (
  iso: string,
  mode: "dateRange" | "month" | "year"
) => {
  const d = new Date(iso);
  if (mode === "year") {
    return d.toLocaleDateString("th-TH", { year: "numeric" });
  }
  if (mode === "month") {
    return d.toLocaleDateString("th-TH", { month: "short", year: "numeric" });
  }
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

type ViewType = "before" | "after" | "compare";

/* ===== main component ===== */
const AdminDashboard: React.FC = () => {
  // meta
  const [metas, setMetas] = useState<EnvMeta[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
  const [selectedParamId, setSelectedParamId] = useState<number | null>(null);

  // raw records + efficiency (optional)
  const [rawData, setRawData] = useState<RecordItem[]>([]);
  const [efficiency, setEfficiency] = useState<EfficiencyItem[] | null>(null);

  // ui states
  const [view, setView] = useState<ViewType>("compare");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [showModal, setShowModal] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  // colors
  const [chartColor, setChartColor] = useState({
    before: "#00C2C7",
    after: "#33E944",
    compareBefore: "#00C2C7",
    compareAfter: "#7B61FF",
    efficiency: "#faad14",
  });

  // date filters
  const [filterMode, setFilterMode] = useState<"dateRange" | "month" | "year">(
    "dateRange"
  );
  const [dateRange, setDateRange] = useState<Dayjs[] | null>(null);

  const [predictionData, setPredictionData] = useState<PredictionOutput | null>(null);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(true);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  useEffect(() => {
    const getPrediction = async () => {
      // เรียก API เฉพาะเมื่อหน้าเพจโหลดครั้งแรกเท่านั้น
      try {
        const data = await fetchPrediction();
        setPredictionData(data);
      } catch (err: any) {
        setPredictionError(err.message);
      } finally {
        setPredictionLoading(false);
      }
    };
    // เรียกใช้ฟังก์ชันเมื่อ Component ถูก Mount
    getPrediction();
  }, []);

  // ฟอร์แมตวันที่ใช้ส่ง API
  const formattedDate = date ? dayjs(date).format(
    dateType === "year" ? "YYYY" :
      dateType === "month" ? "YYYY-MM" : "YYYY-MM-DD") : undefined;

  // โหลด environmental records (เหมือนเดิม)
  // load meta + records (ครั้งเดียว)
  useEffect(() => {
    const run = async () => {
      try {
        const m = await GetEnvironmentalMeta();
        if (Array.isArray(m) && m.length > 0) {
          setMetas(m);
          setSelectedEnvId(m[0].id);
          if (m[0].params?.length) setSelectedParamId(m[0].params[0].id);
        }
      } catch (e) {}

      // default: ช่วงปีปัจจุบัน
      const now = dayjs();
      setDateRange([dayjs().startOf("year"), now.endOf("month")]);

      // records
      const rec = await GetEnvironmentalRecords({
        date: undefined,
        type: undefined,
        view: "compare",
      });
      setRawData(rec ?? []);

      // efficiency
      const eff = await GetEnvironmentalEfficiency({
        date: undefined,
        type: undefined,
        param: undefined,
      });
      setEfficiency(eff ?? null);
    };
    run();
  }, []);

  // derived
  const selectedEnv = useMemo(
    () => metas.find((e) => e.id === selectedEnvId) || null,
    [metas, selectedEnvId]
  );
  const paramList = selectedEnv?.params ?? [];
  const selectedParamMeta = useMemo(
    () => paramList.find((p) => p.id === selectedParamId) || null,
    [paramList, selectedParamId]
  );

  const isGarbage = selectedEnv?.name === "ขยะ";
  const selectedParamName = selectedParamMeta?.name || "";
  const selectedParamUnit = selectedParamMeta?.unit || "";
  const stdMax = selectedParamMeta?.std_max ?? undefined;

  // filter by date
  const data = useMemo(() => {
    if (!dateRange || dateRange.length !== 2) return rawData;
    const [start, end] = dateRange;
    return (rawData || []).filter((d) => {
      const dd = new Date(d.date);
      return dd >= start.toDate() && dd <= end.toDate();
    });
  }, [rawData, dateRange]);

  // labels (TH)
  const labels = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter((d) => d.parameter === selectedParamName)
          .map((d) => formatThaiLabel(d.date, filterMode))
      )
    );
  }, [data, selectedParamName, filterMode]);

  // series (before / after)
  const makeSeries = (treatment: "ก่อน" | "หลัง") => {
    const tdata = data.filter(
      (d) => d.parameter === selectedParamName && d.treatment === treatment
    );
    return labels.map((lb) => {
      const f = tdata.find((d) => formatThaiLabel(d.date, filterMode) === lb);
      return { x: lb, y: f ? Number(dFix(f.value)) : 0 };
    });
  };

  // efficiency series
  const effSeriesData = useMemo(() => {
    if (isGarbage) return [];
    const points =
      (efficiency || [])
        .filter((e) => e.parameter === selectedParamName)
        .map((e) => ({
          x: formatThaiLabel(e.date, filterMode),
          y: +Number(e.efficiency).toFixed(2),
        }))
        .sort((a, b) => (a.x > b.x ? 1 : -1)) ?? [];
    return [{ name: "Efficiency", data: points, color: chartColor.efficiency }];
  }, [efficiency, isGarbage, selectedParamName, filterMode, chartColor.efficiency]);

  // alert (front คำนวณง่าย ๆ)
  const alerts = useMemo(() => {
    const byMonth: Record<
      string,
      { values: number[]; param: string; unit: string }
    > = {};
    data.forEach((d) => {
      const key = new Date(d.date).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
      });
      if (!byMonth[key])
        byMonth[key] = { values: [], param: d.parameter, unit: d.unit };
      byMonth[key].values.push(Number(d.value));
    });
    const rows = Object.entries(byMonth).map(([month, v]) => {
      const avg =
        v.values.reduce((a, b) => a + b, 0) / Math.max(v.values.length, 1);
      return {
        month_year: month,
        parameter: v.param,
        average: avg,
        max_value: stdMax ?? Number.POSITIVE_INFINITY,
        unit: v.unit,
      };
    });
    return rows.filter((r) => r.average > r.max_value);
  }, [data, stdMax]);

  const latestAlerts = alerts.slice(0, 3);
  const historyAlerts = alerts.slice(3);

  // graph height
  const graphHeight = alerts.length > 0 ? 250 : 350;

  // build apex options
  const buildOpts = (title: string): ApexOptions => ({
    chart: { zoom: { enabled: true, type: "x", autoScaleYaxis: true } },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    markers: { size: 5, strokeWidth: 2, hover: { sizeOffset: 2 } },
    xaxis: { categories: labels, labels: { rotate: -45 } },
    yaxis: {
      forceNiceScale: true,
      min: 0,
      title: { text: selectedParamUnit ? `หน่วย: ${selectedParamUnit}` : "" },
    },
    annotations:
      !isGarbage && stdMax != null
        ? {
            yaxis: [
              {
                y: Number(stdMax),
                strokeDashArray: 6,
                borderColor: "#ff4d4f",
                label: {
                  borderColor: "#ff4d4f",
                  style: { color: "#fff", background: "#ff4d4f" },
                  text: `มาตรฐาน ${Number(stdMax).toLocaleString("th-TH")}${
                    selectedParamUnit ? " " + selectedParamUnit : ""
                  }`,
                },
              },
            ],
          }
        : undefined,
    title: { text: title, align: "left" },
    tooltip: {
      x: {
        formatter: (_: any, opt: any) =>
          opt?.w?.globals?.categoryLabels?.[opt?.dataPointIndex] ?? "",
      },
      y: {
        formatter: (v: number) =>
          v != null
            ? `${Number(v).toLocaleString("th-TH", {
                maximumFractionDigits: 2,
              })}${selectedParamUnit ? " " + selectedParamUnit : ""}`
            : "-",
      },
    },
    legend: { position: "top" },
  });

  // utils
  function dFix(n: any) {
    const f = Number(n);
    if (!Number.isFinite(f)) return 0;
    return +f.toFixed(3);
  }

  return (
    <div className="content-wrapper">
      <div className="container-xl">
        {/* Header */}
        <div className="dashboard-title-header">
          <div className="dashboard-title-inner">
            <h1>การตรวจวัดคุณภาพสิ่งแวดล้อม</h1>
            <p>
              โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม
            </p>
          </div>
        </div>
        <div style={{
          backgroundColor: '#e6f7ff',
          border: '1px solid #91d5ff',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <h3>ค่า pH น้ำเสียก่อนบำบัด ที่คาดการณ์สำหรับเดือนถัดไป</h3>
          {predictionLoading ? (
            <p>กำลังคำนวณ...</p>
          ) : predictionError ? (
            <p style={{ color: 'red' }}>ไม่สามารถดึงค่าทำนายได้: {predictionError}</p>
          ) : (
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0050b3' }}>
              {predictionData?.prediction.toFixed(3)}
            </div>
          )}
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

        {/* Controls Card */}
        <Card className="dashboard-controls-card" bordered={false}>
          <Row
            gutter={[12, 12]}
            align="middle"
            className="dashboard-controls-row"
          >
            {/* Environment */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <label className="dashboard-label">สภาพแวดล้อม</label>
              <Select
                value={selectedEnvId ?? undefined}
                onChange={(v) => {
                  setSelectedEnvId(v);
                  const first = metas.find((e) => e.id === v)?.params?.[0];
                  setSelectedParamId(first ? first.id : null);
                  if (v && metas.find((e) => e.id === v)?.name === "ขยะ") {
                    setView("after");
                  }
                }}
                className="dashboard-select"
                placeholder="เลือกสภาพแวดล้อม"
                allowClear={false}
              >
                {metas.map((e) => (
                  <Option key={e.id} value={e.id}>
                    {e.name}
                  </Option>
                ))}
              </Select>
            </Col>

            {/* Parameter */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <label className="dashboard-label">พารามิเตอร์</label>
              <Select
                value={selectedParamId ?? undefined}
                onChange={setSelectedParamId}
                className="dashboard-select"
                placeholder="เลือกพารามิเตอร์"
                allowClear={false}
              >
                {paramList.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Col>

            {/* View (hide compare for garbage) */}
            {!isGarbage && (
              <Col xs={24} sm={12} md={8} lg={6}>
                <label className="dashboard-label">มุมมอง</label>
                <Select
                  value={view}
                  onChange={setView}
                  className="dashboard-select"
                >
                  <Option value="before">น้ำก่อนบำบัด</Option>
                  <Option value="after">น้ำหลังบำบัด</Option>
                  <Option value="compare">เปรียบเทียบก่อน–หลัง</Option>
                </Select>
              </Col>
            )}

            {/* Filter mode */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <label className="dashboard-label">ช่วงเวลา</label>
              <Select
                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  setDateRange(null);
                }}
                className="dashboard-select"
                options={[
                  { label: "เลือกช่วงวัน", value: "dateRange" },
                  { label: "เลือกเดือน", value: "month" },
                  { label: "เลือกปี", value: "year" },
                ]}
              />
            </Col>

            {/* Date pickers */}
            <Col xs={24} md={16} lg={12}>
              <label className="dashboard-label">เลือกวันที่</label>
              {filterMode === "dateRange" && (
                <RangePicker
                  value={dateRange as [Dayjs, Dayjs] | undefined}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setDateRange([dates[0], dates[1]]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                  locale={th_TH}
                  className="dashboard-picker"
                  placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                  allowClear
                />
              )}
              {filterMode === "month" && (
                <DatePicker
                  picker="month"
                  value={dateRange ? dateRange[0] : null}
                  onChange={(date) => {
                    if (date)
                      setDateRange([date.startOf("month"), date.endOf("month")]);
                    else setDateRange(null);
                  }}
                  locale={th_TH}
                  className="dashboard-picker"
                  placeholder="เลือกเดือน"
                  allowClear
                />
              )}
              {filterMode === "year" && (
                <DatePicker.RangePicker
                  picker="year"
                  value={dateRange as [Dayjs, Dayjs] | undefined}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1])
                      setDateRange([
                        dates[0].startOf("year"),
                        dates[1].endOf("year"),
                      ]);
                    else setDateRange(null);
                  }}
                  locale={th_TH}
                  className="dashboard-picker"
                  placeholder={["ปีเริ่มต้น", "ปีสิ้นสุด"]}
                  allowClear
                />
              )}
            </Col>

            {/* Chart type toggle (line/bar) */}
            <Col xs={24} md={8} lg={6}>
              <label className="dashboard-label">ประเภทกราฟ</label>
              <Segmented
                className="dashboard-segmented"
                options={[
                  { label: "เส้น", value: "line" },
                  { label: "แท่ง", value: "bar" },
                ]}
                value={chartType}
                onChange={(v) => setChartType(v as "line" | "bar")}
              />
            </Col>
          </Row>
        </Card>

        {/* Graphs */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <div className="dashboard-graph-card card">
              <div className="dashboard-head-graph-card">
                <div className="dashboard-head-title">
                  {isGarbage
                    ? "ปริมาณขยะ"
                    : view === "before"
                    ? "น้ำก่อนบำบัด"
                    : view === "after"
                    ? "น้ำหลังบำบัด"
                    : "เปรียบเทียบก่อน-หลัง"}
                </div>
                <div className="dashboard-head-controls">
                  {!isGarbage && (view === "before" || view === "after") && (
                    <ColorPicker
                      value={
                        view === "before" ? chartColor.before : chartColor.after
                      }
                      onChange={(c: Color) => {
                        const hex = c.toHexString();
                        if (view === "before")
                          setChartColor({ ...chartColor, before: hex });
                        else setChartColor({ ...chartColor, after: hex });
                      }}
                    />
                  )}
                  {!isGarbage && view === "compare" && (
                    <>
                      <ColorPicker
                        value={chartColor.compareBefore}
                        onChange={(c) =>
                          setChartColor({
                            ...chartColor,
                            compareBefore: c.toHexString(),
                          })
                        }
                      />
                      <ColorPicker
                        value={chartColor.compareAfter}
                        onChange={(c) =>
                          setChartColor({
                            ...chartColor,
                            compareAfter: c.toHexString(),
                          })
                        }
                      />
                    </>
                  )}
                  <Button
                    type="text"
                    icon={<Maximize2 size={18} />}
                    onClick={() => setShowModal(true)}
                  />
                </div>
              </div>

              <ApexChart
                key={
                  String(selectedEnvId) + String(selectedParamId) + view + chartType
                }
                options={buildOpts("")}
                series={
                  isGarbage
                    ? [
                        {
                          name: "ปริมาณ",
                          data: labels.map((lb) => {
                            const f = data.find(
                              (d) =>
                                d.parameter === selectedParamName &&
                                formatThaiLabel(d.date, filterMode) === lb
                            );
                            return { x: lb, y: f ? Number(dFix(f.value)) : 0 };
                          }),
                          color: chartColor.after,
                        },
                      ]
                    : view === "before"
                    ? [
                        {
                          name: "ก่อน",
                          data: makeSeries("ก่อน"),
                          color: chartColor.before,
                        },
                      ]
                    : view === "after"
                    ? [
                        {
                          name: "หลัง",
                          data: makeSeries("หลัง"),
                          color: chartColor.after,
                        },
                      ]
                    : [
                        {
                          name: "ก่อน",
                          data: makeSeries("ก่อน"),
                          color: chartColor.compareBefore,
                        },
                        {
                          name: "หลัง",
                          data: makeSeries("หลัง"),
                          color: chartColor.compareAfter,
                        },
                      ]
                }
                type={chartType}
                height={graphHeight}
              />
            </div>
          </Col>

          {!isGarbage && (
            <Col xs={24} lg={12}>
              <div className="dashboard-graph-card card">
                <div className="dashboard-head-graph-card">
                  <div className="dashboard-head-title">ประสิทธิภาพ (%)</div>
                  <div className="dashboard-head-controls">
                    <ColorPicker
                      value={chartColor.efficiency}
                      onChange={(c) =>
                        setChartColor({ ...chartColor, efficiency: c.toHexString() })
                      }
                    />
                  </div>
                </div>
                <ApexChart
                  options={buildOpts("Efficiency (%)")}
                  series={effSeriesData}
                  type="bar"
                  height={graphHeight}
                />
              </div>
            </Col>
          )}
        </Row>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="dashboard-alerts-card" bordered={false}>
            <div className="dashboard-alerts-list">
              {latestAlerts.map((a, i) => (
                <div key={i} className="dashboard-alert-item">
                  <div>
                    <b>เดือน:</b> {a.month_year}
                  </div>
                  <div>
                    <b>พารามิเตอร์:</b> {a.parameter}
                  </div>
                  <div>
                    <b>ค่าเฉลี่ย:</b> {a.average.toFixed(2)} {a.unit}
                  </div>
                  <div>
                    <b>มาตรฐานสูงสุด:</b> {a.max_value.toFixed(2)} {a.unit}
                  </div>
                </div>
              ))}
            </div>

            {historyAlerts.length > 0 && (
              <div style={{ marginTop: 12, textAlign: "right" }}>
                <Button type="link" onClick={() => setShowAllAlerts(true)}>
                  ดูประวัติการแจ้งเตือนทั้งหมด
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Zoom modal */}
        <Modal
          open={showModal}
          footer={null}
          onCancel={() => setShowModal(false)}
          width={1000}
        >
          <ApexChart
            key={"modal" + view + chartType}
            options={buildOpts("Zoom Chart")}
            series={
              isGarbage
                ? [
                    {
                      name: "ปริมาณ",
                      data: labels.map((lb) => {
                        const f = data.find(
                          (d) =>
                            d.parameter === selectedParamName &&
                            formatThaiLabel(d.date, filterMode) === lb
                        );
                        return { x: lb, y: f ? Number(dFix(f.value)) : 0 };
                      }),
                      color: chartColor.after,
                    },
                  ]
                : view === "before"
                ? [{ name: "ก่อน", data: makeSeries("ก่อน"), color: chartColor.before }]
                : view === "after"
                ? [{ name: "หลัง", data: makeSeries("หลัง"), color: chartColor.after }]
                : [
                    {
                      name: "ก่อน",
                      data: makeSeries("ก่อน"),
                      color: chartColor.compareBefore,
                    },
                    {
                      name: "หลัง",
                      data: makeSeries("หลัง"),
                      color: chartColor.compareAfter,
                    },
                  ]
            }
            type={chartType}
            height={600}
          />
        </Modal>
      </div>
    </div>
  );
};

export default AdminDashboard;
