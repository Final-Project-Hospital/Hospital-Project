import React, { useEffect, useState } from "react";
import { DatePicker, Input, Select } from "antd";
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import dayjs from "dayjs";
import { EnvironmentalRecordInterface } from "../../../interface/IEnvironmentalRecord";
import { ReadTKN } from "../../../services/enviromentrecord";
import './TKNdataviz.css';
import { LeftOutlined, SearchOutlined } from "@ant-design/icons";
import Table, { ColumnsType } from "antd/es/table";

const TKNdataviz: React.FC = () => {
  //chart
  const [chartTypeBefore, setChartTypeBefore] = useState<'line' | 'bar'>('line');
  const [chartTypeAfter, setChartTypeAfter] = useState<'line' | 'bar'>('line');
  const [chartTypeCompare1, setChartTypeCompare1] = useState<'line' | 'bar'>('line');
  const [chartTypeCompare2, setChartTypeCompare2] = useState<'line' | 'bar'>('line');

  //fetchdata
  const [data, setData] = useState<EnvironmentalRecordInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [compareData, setCompareData] = useState<{ date: string; before: number; after: number }[]>([]);
  const [beforeData, setBeforeData] = useState<{ date: string; data: number }[]>([]);
  const [afterData, setAfterData] = useState<{ date: string; data: number }[]>([]);

  //search
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [selectedYear, setSelectedYear] = useState<dayjs.Dayjs | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await ReadTKN();
        if (response) {
          setData(response);

          const before = response
            .filter((item) => item.BeforeAfterTreatment?.ID === 1)
            .map((item) => ({ date: item.date?.split("T")[0] || "", data: item.data || 0 }));

          const after = response
            .filter((item) => item.BeforeAfterTreatment?.ID === 2)
            .map((item) => ({ date: item.date?.split("T")[0] || "", data: item.data || 0 }));

          const combined = response
            .filter((item) => item.BeforeAfterTreatment?.ID === 3)
            .map((item) => ({
              date: item.date?.split("T")[0] || "",
              beforeData: item.note === "ก่อนบำบัด" ? item.data || 0 : null,
              afterData: item.note === "หลังบำบัด" ? item.data || 0 : null,
            }));

          const combinedMap: Record<string, { before: number; after: number }> = {};
          combined.forEach((item) => {
            if (!combinedMap[item.date]) {
              combinedMap[item.date] = { before: 0, after: 0 };
            }
            if (item.beforeData !== null) combinedMap[item.date].before = item.beforeData;
            if (item.afterData !== null) combinedMap[item.date].after = item.afterData;
          });

          const compare = Object.entries(combinedMap).map(([date, values]) => ({ date, before: values.before, after: values.after }));

          setBeforeData(before);
          setAfterData(after);
          setCompareData(compare);
        } else {
          console.error("ไม่พบข้อมูล TKN");
        }
      } catch (err) {
        console.error("Error fetching TKN data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getChartOptions = (categories: string[]): ApexOptions => ({
    chart: { id: 'tkn-chart', toolbar: { show: true } },
    xaxis: { categories, title: { text: 'วันที่' } },
    yaxis: { title: { text: 'mg/L' } },
    tooltip: { enabled: true },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
  });

  const beforeSeries = [{ name: "TKN", data: beforeData.map((item) => item.data) }];
  const afterSeries = [{ name: "TKN", data: afterData.map((item) => item.data) }];
  const compareSeries = [
    { name: "ก่อนบำบัด", data: compareData.map(item => item.before) },
    { name: "หลังบำบัด", data: compareData.map(item => item.after) }
  ];

  const columns: ColumnsType<EnvironmentalRecordInterface> = [
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'เวลา',
      key: 'time',
      render: (_, record) => record.date ? dayjs(record.date).format('HH:mm:ss') : '-',
    },
    {
      title: 'หน่วยที่วัด',
      key: 'unit',
      render: (_, record) => record.Unit?.UnitName || '-',
    },
    {
      title: 'มาตรฐาน',
      key: 'standard',
      render: (_, record) => record.Standard?.StandardValue || '-',
    },
    {
      title: 'ค่าก่อนเข้าระบบบำบัด',
      key: 'beforeValue',
      render: (_, record) => (record.BeforeAfterTreatment?.ID === 1 ? record.data : '-'),
    },
    {
      title: 'ค่าหลังเข้าระบบบำบัด',
      key: 'afterValue',
      render: (_, record) => (record.BeforeAfterTreatment?.ID === 2 ? record.data : '-'),
    },
    {
      title: 'สถานะ',
      key: 'status',
      render: (_, record) => record.BeforeAfterTreatment?.TreatmentName || '-',
    },
    {
      title: 'จัดการข้อมูล',
      key: 'action',
      render: (_, record) => (<a href={`#edit/${record.ID}`}>แก้ไข</a>),
    },
  ];

  return (
    <div>
      <div className="title-header">
        <h1>TKN-Central</h1>
        <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
      </div>

      <div className="tkn-title">
        <h1 className="tkn-title-text"><LeftOutlined className="tkn-back-icon" />TKN-GRAPH</h1>
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

      <div className="tkn-data">
        <h1 className="tkn-title-text">TDS DATA</h1>
        <div className="search-box">
          <Input
            placeholder="ค้นหา"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: '100%', maxWidth: 150, height: 23, padding: '4px 11px', fontSize: 14, borderRadius: 20, border: '1px solid #ccc' }}
          />
        </div>
        <div className="table-tkndata">
          <Table columns={columns} dataSource={data.filter(d => dayjs(d.date).format('YYYY-MM-DD').includes(search))} rowKey="ID" loading={loading} />
        </div>
      </div>

      <div className="tkn-central-statistics">
        <h1 className="tkn-title-text">TKN-Central Statistics</h1>
        <h2>ผลการตรวจวัดค่า ปริมาณของสารต่างๆ ที่ละลายอยู่ในน้ำ บริเวณระบบบำบัดนํ้าเสียส่วนกลาง</h2>
      </div>
    </div>
  );
};

export default TKNdataviz;