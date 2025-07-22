import React, { useEffect, useState } from "react";
import { DatePicker, Input, Select } from "antd";
import dayjs from "dayjs";
import { EnvironmentalRecordInterface } from "../../../interface/IEnvironmentalRecord";
import { GetTKN } from "../../../services/enviromentrecord";
import './TKNdataviz.css';
import { LeftOutlined, SearchOutlined } from "@ant-design/icons";
import Table, { ColumnsType } from "antd/es/table";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const TKNdataviz: React.FC = () => {
  const [chartTypeBefore, setChartTypeBefore] = useState<'line' | 'bar'>('line');
  const [chartTypeAfter, setChartTypeAfter] = useState<'line' | 'bar'>('line');
  const [chartTypeCombined, setChartTypeCombined] = useState<'line' | 'bar'>('line');

  const [dataTKN, setDataTKN] = useState<EnvironmentalRecordInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [beforeData, setBeforeData] = useState<{ date: string; data: number }[]>([]);
  const [afterData, setAfterData] = useState<{ date: string; data: number }[]>([]);
  const [combinedData, setCombinedData] = useState<{ date: string; before: number; after: number }[]>([]);


  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [selectedYear, setSelectedYear] = useState<dayjs.Dayjs | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await GetTKN();
        console.log("Raw response from GetTKN:", response);

        if (response) {
          setDataTKN(response);

          const before = response
            .filter(data => data.BeforeAfterTreatmentID === 1)
            .map(data => ({
              date: data.Date ? dayjs(data.Date.toString()).format("DD/MM/YYYY") : "",
              data: data.Data != null ? Number(data.Data) : 0,
            }));
            console.log("Processed Before Data for Chart:", before);

          const after = response
            .filter(item => item.BeforeAfterTreatmentID === 2)
            .map(item => ({
              date: item.Date ? dayjs(item.Date.toString()).format("DD/MM/YYYY") : "",
              data: item.Data != null ? Number(item.Data) : 0,
            }));
            console.log("Processed After Data for Chart:", after);
          
          const combined = before.map(b =>{
            const a = after.find(x => x.date === b.date);
            return{
              date:b.date,
              before:b.data,
              after: a ? a.data : 0,
            }
          })

          setBeforeData(before);
          setAfterData(after);
          setCombinedData(combined);
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

  const columns: ColumnsType<EnvironmentalRecordInterface> = [
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      render: (_, record) => record.Date ? dayjs(record.Date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'เวลา',
      key: 'time',
      render: (_, record) => record.Date ? dayjs(record.Date).format('HH:mm') : '-',
    },
    {
      title: 'หน่วยที่วัด',
      key: 'unit',
      render: (_, record) => record.Unit?.UnitName || '-',
    },
    {
      title: 'มาตรฐาน',
      key: 'standard',
      render: (_, record) => record.Standard?.ID || '-',
    },
    {
      title: 'ค่าก่อนเข้าระบบบำบัด',
      key: 'beforeValue',
      render: (_, record) => (record.BeforeAfterTreatmentID === 1 ? record.Data : '-'),
    },
    {
      title: 'ค่าหลังเข้าระบบบำบัด',
      key: 'afterValue',
      render: (_, record) => (record.BeforeAfterTreatmentID === 2 ? record.Data : '-'),
    },
    {
      title: 'สถานะ',
      key: 'status',
      render: (_, record) => record.BeforeAfterTreatment?.TreatmentName || '-',
    },
    {
      title: 'จัดการข้อมูล',
      key: 'action',
      render: (_, record) => (
        <>
          <a href={`update-tkn/${record.ID}`} style={{ marginRight: '10px' }}>แก้ไข</a>
          <a href={`delete-tkn/${record.ID}`} style={{ color: 'red' }}>ลบ</a>
        </>
      ),
    }
  ];

  // ฟังก์ชันสำหรับเลือก chart แสดง
  const renderChart = (
    data: { date: string; data: number }[],
    chartType: 'line' | 'bar'
  ) => (
    <ResponsiveContainer width="100%" height={350}>
      {chartType === 'line' ? (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: 'mg/L', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="data" name="TKN" stroke="#8884d8" />
        </LineChart>
      ) : (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: 'mg/L', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="data" name="TKN" fill="#82ca9d" />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
const renderCombinedChart = (
  data: { date: string; before: number; after: number }[],
  chartType: 'line' | 'bar'
) => (
  <ResponsiveContainer width="100%" height={400}>
    {chartType === 'line' ? (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis label={{ value: 'mg/L', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="before" name="ก่อนบำบัด" stroke="#8884d8" />
        <Line type="monotone" dataKey="after" name="หลังบำบัด" stroke="#82ca9d" />
      </LineChart>
    ) : (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis label={{ value: 'mg/L', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="before" name="ก่อนบำบัด" fill="#8884d8" />
        <Bar dataKey="after" name="หลังบำบัด" fill="#82ca9d" />
      </BarChart>
    )}
  </ResponsiveContainer>
);

  return (
    <div>
      <div className="title-header">
        <h1>TKN-Central</h1>
        <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
      </div>

      <div className="tkn-title">
        <h1 className="tkn-title-text"><LeftOutlined className="tkn-back-icon" />TKN-Central Statistics 
        <br></br><h2>ผลการตรวจวัดค่า ปริมาณของสารต่างๆ ที่ละลายอยู่ในน้ำ บริเวณระบบบำบัดนํ้าเสียส่วนกลาง</h2></h1>
        
        <div className="select-group">
          <DatePicker
            picker="month"
            placeholder="เลือกเดือน"
            onChange={(value) => setSelectedMonth(value)}
            value={selectedMonth}
          />
          <DatePicker
            picker="year"
            placeholder="เลือกปี"
            onChange={(value) => setSelectedYear(value)}
            value={selectedYear}
          />
        </div>
      </div>
      <div className="graph-container">
        <div className="graph-card">
          <h2>น้ำก่อนบำบัด</h2>
          <Select
            value={chartTypeBefore}
            onChange={val => setChartTypeBefore(val)}
            style={{ marginBottom: 10 }}
          >
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          {renderChart(beforeData, chartTypeBefore)}
        </div>

        <div className="graph-card">
          <h2>น้ำหลังบำบัด</h2>
          <Select
            value={chartTypeAfter}
            onChange={val => setChartTypeAfter(val)}
            style={{ marginBottom: 10 }}
          >
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          {renderChart(afterData, chartTypeAfter)}
        </div>
        <div className="graph-card">
          <h2>กราฟเปรียบเทียบ ก่อนและหลังบำบัด</h2>
            <Select
            value={chartTypeCombined}
            onChange={val => setChartTypeCombined(val)}
            style={{ marginBottom: 10 }}
          >
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          {renderCombinedChart(combinedData, chartTypeCombined)}
        </div>
      </div>

      <div className="tkn-data">
        <h1 className="tkn-title-text">TKN DATA</h1>
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
          <Table
            columns={columns}
            dataSource={dataTKN.filter(d => {
              const dateStr = d.Date ? dayjs(d.Date).format('DD/MM/YYYY') : '';
              return dateStr.includes(search);
            })}
            rowKey="ID"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default TKNdataviz;
