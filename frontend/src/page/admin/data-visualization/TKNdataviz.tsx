import React, { useEffect, useState } from "react";
import { Button, DatePicker, Input, Select } from "antd";
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import dayjs from "dayjs";
import { EnvironmentalRecordInterface } from "../../../interface/IEnvironmentalRecord";
import { ReadTKN } from "../../../services/enviromentrecord";
import './TKNdataviz.css';
import { LeftOutlined, SearchOutlined } from "@ant-design/icons";

const TKNdataviz: React.FC = () => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [beforeData, setBeforeData] = useState<{ date: string; data: number }[]>([]);
  const [afterData, setAfterData] = useState<{ date: string; data: number }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [selectedYear, setSelectedYear] = useState<dayjs.Dayjs | null>(null);
  const [search,setSearch]= useState("");
  useEffect(() => {
    const fetchData = async () => {
      const response = await ReadTKN();
      if (response) {
        const before = response
          .filter((item) => item.BeforeAfterTreatment?.ID === 1)
          .map((item) => ({
            date: item.date?.split("T")[0] || "",
            data: item.data || 0,
          }));

        const after = response
          .filter((item) => item.BeforeAfterTreatment?.ID === 2)
          .map((item) => ({
            date: item.date?.split("T")[0] || "",
            data: item.data || 0,
          }));

        setBeforeData(before);
        setAfterData(after);
      }
    };
    fetchData();
  }, []);

  const getChartOptions = (categories: string[]): ApexOptions => ({
    chart: {
      id: 'tkn-chart',
      toolbar: { show: true },
    },
    xaxis: {
      categories,
      title: { text: 'วันที่' },
    },
    yaxis: {
      title: { text: 'mg/L' },
    },
    tooltip: { enabled: true },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
  });

  const beforeSeries = [
    {
      name: "TKN",
      data: beforeData.map((item) => item.data),
    },
  ];

  const afterSeries = [
    {
      name: "TKN",
      data: afterData.map((item) => item.data),
    },
  ];
  return (
  <div>
      <div className="title-header">
          <h1>TKN-Central</h1>
          <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
      </div>
      <div className="tkn-title">
          <h1 className="tkn-title-text">
          <LeftOutlined className="tkn-back-icon" />TKN-GRAPH</h1>
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
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div className="tkn-graphBefore" style={{ flex: '1 1 48%', background: "#fff", padding: 10, borderRadius: 10 }}>
          <h2 >น้ำก่อนบำบัด</h2>
          <Select value={chartType} onChange={val => setChartType(val)} style={{ marginBottom: 10 }}>
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          <ApexChart
            options={getChartOptions(beforeData.map(item => item.date))}
            series={beforeSeries}
            type={chartType}
            height={350}
          />
        </div>
      
        <div className="tkn-graphAfter" style={{ flex: '1 1 48%', background: "#fff", padding: 10, borderRadius: 10 }}>
          <h2>น้ำหลังบำบัด</h2>
          <Select value={chartType} onChange={val => setChartType(val)} style={{ marginBottom: 10 }}>
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          <ApexChart
            options={getChartOptions(afterData.map(item => item.date))}
            series={afterSeries}
            type={chartType}
            height={350}
          />
        </div>
      
        <div className="tkn-graphBeforeandAfter" style={{ flex: '1 1 48%', background: "#fff", padding: 10, borderRadius: 10 }}>
          <h2>น้ำก่อน - หลังบำบัด</h2>
          <Select value={chartType} onChange={val => setChartType(val)} style={{ marginBottom: 10 }}>
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          <ApexChart
            options={getChartOptions(afterData.map(item => item.date))}
            series={afterSeries}
            type={chartType}
            height={350}
          />
        </div>
      
        <div className="tkn-graphBeforeandAfter2" style={{ flex: '1 1 48%', background: "#fff", padding: 10, borderRadius: 10 }}>
          <h2>น้ำก่อน - หลังบำบัด</h2>
          <Select value={chartType} onChange={val => setChartType(val)} style={{ marginBottom: 10 }}>
            <Select.Option value="line">กราฟเส้น (Line Chart)</Select.Option>
            <Select.Option value="bar">กราฟแท่ง (Bar Chart)</Select.Option>
          </Select>
          <ApexChart
            options={getChartOptions(afterData.map(item => item.date))}
            series={afterSeries}
            type={chartType}
            height={350}
          />
        </div>
      </div>
      <div className="tkn-data">
          <h1 className="tkn-title-text">TDS DATA</h1>
          <div className="search-box" >
            <Input
              placeholder="ค้นหา"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<SearchOutlined/>}
              style={{
                  width: '100%',
                  maxWidth: 100,
                  height: 40,
                  padding: '4px 11px',
                  fontSize: 14,
                  borderRadius: 20,
                  border: '1px solid #ccc',
              }}
            />
          </div>
          <div className="list-tkndata">

          </div>
          <div className="tkn-central-statistics">
              <h1 className="tkn-title-text" >
                TKN-Cenreal Statistics
                <h2>
                  ผลการตรวจวัดค่า ปริมาณของสารต่างๆ ที่ละลายอยู่ในน้ำ บริเวณระบบบำบัดนํ้าเสียส่วนกลาง
                </h2>
              </h1>
          </div>
      </div>
  </div> 
  );
};

export default TKNdataviz;
