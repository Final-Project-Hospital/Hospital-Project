import React, { useEffect, useState } from "react";
import { DatePicker, Input, Select } from "antd";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { GetTDS } from "../../../services/tdsService";
import './TDSdataviz.css';
import { LeftOutlined, SearchOutlined } from "@ant-design/icons";
import Table, { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TDSdataviz: React.FC = () => {
  const [chartTypeBefore, setChartTypeBefore] = useState<'line' | 'bar'>('line');
  const [chartTypeAfter, setChartTypeAfter] = useState<'line' | 'bar'>('line');
  const [chartTypeCompare1, setChartTypeCompare1] = useState<'line' | 'bar'>('line');
  const [chartTypeCompare2, setChartTypeCompare2] = useState<'line' | 'bar'>('line');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<{ date: string; before: number; after: number }[]>([]);
  const [beforeData, setBeforeData] = useState<{ date: string; data: number }[]>([]);
  const [afterData, setAfterData] = useState<{ date: string; data: number }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [selectedYear, setSelectedYear] = useState<dayjs.Dayjs | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await GetTDS();
        if (response) {
          const processedData = response.map((item: any) => {
            const dt = dayjs(item.Date);
            return {
              ...item,
              dateOnly: dt.format('DD-MM-YYYY'),
              timeOnly: dt.format('HH:mm:ss'),
            };
          });
          setData(processedData);

          const before = processedData
            .filter((item: any) => item.BeforeAfterTreatment?.ID === 1)
            .map((item: any) => ({ date: item.dateOnly, data: item.data || 0 }));

          const after = processedData
            .filter((item: any) => item.BeforeAfterTreatment?.ID === 2)
            .map((item: any) => ({ date: item.dateOnly, data: item.data || 0 }));

          const combined = processedData
            .filter((item: any) => item.BeforeAfterTreatment?.ID === 3)
            .map((item: any) => ({
              date: item.dateOnly,
              beforeData: item.note === "ก่อนบำบัด" ? item.data || 0 : null,
              afterData: item.note === "หลังบำบัด" ? item.data || 0 : null,
            }));

          const combinedMap: Record<string, { before: number; after: number }> = {};
          combined.forEach((item: any) => {
            if (!combinedMap[item.date]) {
              combinedMap[item.date] = { before: 0, after: 0 };
            }
            if (item.beforeData !== null) combinedMap[item.date].before = item.beforeData;
            if (item.afterData !== null) combinedMap[item.date].after = item.afterData;
          });

          const compare = Object.entries(combinedMap).map(([date, values]) => ({
            date,
            before: values.before,
            after: values.after,
          }));

          setBeforeData(before);
          setAfterData(after);
          setCompareData(compare);
        } else {
          setError("ไม่พบข้อมูล TDS");
        }
      } catch (err) {
        console.error("Error fetching TDS data:", err);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getChartOptions = (categories: string[]): ApexOptions => ({
    chart: { id: 'tds-chart', toolbar: { show: true } },
    xaxis: { categories, title: { text: 'วันที่' } },
    yaxis: { title: { text: 'mg/L' } },
    tooltip: { enabled: true },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
  });

  const beforeSeries = [{ name: "TDS", data: beforeData.map((item) => item.data) }];
  const afterSeries = [{ name: "TDS", data: afterData.map((item) => item.data) }];
  const compareSeries = [
    { name: "ก่อนบำบัด", data: compareData.map(item => item.before) },
    { name: "หลังบำบัด", data: compareData.map(item => item.after) },
  ];

  const columns: ColumnsType<any> = [
    {
      title: 'วันที่',
      dataIndex: 'dateOnly',
      key: 'dateOnly',
    },
    {
      title: 'เวลา',
      dataIndex: 'timeOnly',
      key: 'timeOnly',
    },
    {
      title: 'หน่วยที่วัด',
      key: 'unit',
      render: (_, record: any) => record.Unit?.UnitName || '-',
    },
    {
      title: 'มาตรฐาน',
      key: 'standard',
      render: (_: any, record: any) => {
        const std = record.Standard;
        if (std) {
          if (typeof std.MiddleValue === 'number' && std.MiddleValue > 0) {
            return std.MiddleValue;
          }
          if (
            typeof std.MinValue === 'number' &&
            typeof std.MaxValue === 'number' &&
            (std.MinValue !== 0 || std.MaxValue !== 0) // ถ้า MinValue กับ MaxValue ไม่ใช่ 0 ทั้งคู่
          ) {
            return `${std.MinValue} - ${std.MaxValue}`;
          }
        }
        return '-';
      }
    },
    {
      title: 'ค่าก่อนเข้าระบบบำบัด',
      key: 'beforeValue',
      render: (_, record: any) => (record.BeforeAfterTreatment?.ID === 1 ? record.Data : '-'),
    },
    {
      title: 'ค่าหลังเข้าระบบบำบัด',
      key: 'afterValue',
      render: (_, record: any) => (record.BeforeAfterTreatment?.ID === 2 ? record.Data : '-'),
    },
    {
      title: 'หมายเหตุ',
      key: 'note',
      render: (_, record: any) => record.Note || '-',
    },
    {
      title: 'สถานะ',
      key: 'status',
      render: (_, record) => {
        const value = record.data;
        const standard = 500; // เปลี่ยนตาม logic จริง
        if (value > standard) {
          return <span className="status-badge status-bad">🚨 เกินเกณฑ์มาตรฐาน</span>;
        }
        return <span className="status-badge status-good">✅ อยู่ในเกณฑ์มาตรฐาน</span>;
      }
    },
    {
      title: 'จัดการข้อมูล',
      key: 'action',
      render: (_: any, record: any) => (
        <div className="action-buttons">
          <button
            className="circle-btn edit-btn"
            onClick={() => handleEdit(record)}
          >
            <EditOutlined />
          </button>
          <button
            className="circle-btn delete-btn"
            onClick={() => handleDelete(record.ID)}
          >
            <DeleteOutlined />
          </button>
        </div>
      ),
    },
  ];

  const handleEdit = (record: any) => {
    // ไปหน้าแก้ไขหรือเปิด Modal
    console.log("Edit:", record);
  };

  const handleDelete = (id: number) => {
    // ลบข้อมูล (เช่นเรียก API)
    console.log("Delete ID:", id);
  };

  return (
    <div>
      <div className="title-header">
        <h1>TDS-Central</h1>
        <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
      </div>

      <div className="tds-title">
        <h1 className="tds-title-text"><LeftOutlined className="tds-back-icon" />TDS-GRAPH</h1>
        <div className="select-group">
          <DatePicker picker="month" placeholder="เลือกเดือน" onChange={(value) => setSelectedMonth(value)} value={selectedMonth} />
          <DatePicker picker="year" placeholder="เลือกปี" onChange={(value) => setSelectedYear(value)} value={selectedYear} />
        </div>
      </div>

      <div className="graph-container">
        <div className="graph-card">
          <h2>น้ำก่อนบำบัด</h2>
          <Select value={chartTypeBefore} onChange={val => setChartTypeBefore(val)} style={{ marginBottom: 10 }}>
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          <ApexChart options={getChartOptions(beforeData.map(item => item.date))} series={beforeSeries} type={chartTypeBefore} height={350} />
        </div>

        <div className="graph-card">
          <h2>น้ำหลังบำบัด</h2>
          <Select value={chartTypeAfter} onChange={val => setChartTypeAfter(val)} style={{ marginBottom: 10 }}>
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          <ApexChart options={getChartOptions(afterData.map(item => item.date))} series={afterSeries} type={chartTypeAfter} height={350} />
        </div>

        <div className="graph-card">
          <h2>น้ำก่อน - หลังบำบัด</h2>
          <Select value={chartTypeCompare1} onChange={val => setChartTypeCompare1(val)} style={{ marginBottom: 10 }}>
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          <ApexChart options={getChartOptions(compareData.map(item => item.date))} series={compareSeries} type={chartTypeCompare1} height={350} />
        </div>

        <div className="graph-card">
          <h2>น้ำก่อน - หลังบำบัด</h2>
          <Select value={chartTypeCompare2} onChange={val => setChartTypeCompare2(val)} style={{ marginBottom: 10 }}>
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          <ApexChart options={getChartOptions(compareData.map(item => item.date))} series={compareSeries} type={chartTypeCompare2} height={350} />
        </div>
      </div>

      <div className="tds-header">
        <div className="tds-title-search">
          <h1 className="tds-title-text">TDS DATA</h1>
          <div>
            <div className="search-box">
            </div>
            <Input
              placeholder="ค้นหา"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<SearchOutlined />}
              className="search-input"
            />
          </div>
        </div>
        <button className="add-btn">เพิ่มข้อมูลใหม่</button>
      </div>

      <div className="table-tdsdata">
        <h1 className="tds-title-text-table">ตารางรายงานผลการดำเนินงาน</h1>
        <Table
          columns={columns}
          dataSource={data.filter((d: any) =>
            dayjs(d.date).format('YYYY-MM-DD').includes(search)
          )}
          rowKey="ID"
          loading={loading}
          pagination={{ pageSize: 8 }}
          bordered
        />
      </div>

      <div className="tds-central-statistics">
        <h1 className="tds-title-text">TDS-Central Statistics</h1>
        <h2>ผลการตรวจวัดค่า ปริมาณของสารต่างๆ ที่ละลายอยู่ในน้ำ บริเวณระบบบำบัดนํ้าเสียส่วนกลาง</h2>
      </div>
    </div >
  );
};

export default TDSdataviz;
