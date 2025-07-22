import React, { useEffect, useState } from "react";
import { Input, Select } from "antd";
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import dayjs from "dayjs";
import { GetlistBOD } from "../../../services/bodService";
import './BODdataviz.css';
import { LeftOutlined, SearchOutlined } from "@ant-design/icons";
import Table, { ColumnsType } from "antd/es/table";
import { listBODInterface } from "../../../interface/IBodCenter";
import { ColorPicker } from "antd";
import type { Color } from 'antd/es/color-picker';
import { GetfirstBOD } from "../../../services/bodService";


const BODdataviz: React.FC = () => {
  const [chartTypeBefore, setChartTypeBefore] = useState<'bar' | 'line'>('bar');
  const [chartTypeAfter, setChartTypeAfter] = useState<'bar' | 'line'>('bar');
  const [chartTypeCompare, setChartTypeCompare] = useState<'bar' | 'line'>('bar');
  const [data, setData] = useState<listBODInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<{ date: string; before: number; after: number }[]>([]);
  const [beforeData, setBeforeData] = useState<{ date: string; data: number }[]>([]);
  const [afterData, setAfterData] = useState<{ date: string; data: number }[]>([]);
  const [search, setSearch] = useState("");
  const [colorBefore, setColorBefore] = useState<string>("#7B61FF");
  const [colorAfter, setColorAfter] = useState<string>("#33E944");
  const [colorCompareBefore, setColorCompareBefore] = useState<string>("#FF4560");
  const [colorCompareAfter, setColorCompareAfter] = useState<string>("#775DD0");
  const [unit, setUnit] = useState<string>("-");

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const lastbod = await GetfirstBOD();
      const response = await GetlistBOD();

      if (response) {
        setData(response.data);

        // เตรียมตัวแปรเก็บค่าต่อวันและประเภท
        const grouped: Record<
          string,
          { before: number[]; after: number[] }
        > = {};

        response.data.forEach((item: listBODInterface) => {
          const date = item.Date;
          if (!grouped[date]) {
            grouped[date] = { before: [], after: [] };
          }

          if (item.BeforeAfterTreatmentID === 1) {
            grouped[date].before.push(item.Data);
          } else if (item.BeforeAfterTreatmentID === 2) {
            grouped[date].after.push(item.Data);
          }
        });

        // สร้างข้อมูลกราฟใหม่หลังจากเฉลี่ยแล้ว
        const before: { date: string; data: number }[] = [];
        const after: { date: string; data: number }[] = [];
        const compare: { date: string; before: number; after: number }[] = [];

        Object.entries(grouped).forEach(([date, values]) => {
          const avgBefore =
            values.before.reduce((sum, val) => sum + val, 0) /
            (values.before.length || 1);

          const avgAfter =
            values.after.reduce((sum, val) => sum + val, 0) /
            (values.after.length || 1);

          before.push({ date, data: avgBefore });
          after.push({ date, data: avgAfter });
          compare.push({ date, before: avgBefore, after: avgAfter });
        });

        setUnit(lastbod.data.UnitName);
        setBeforeData(before);
        setAfterData(after);
        setCompareData(compare);
      } else {
        setError("ไม่พบข้อมูล BOD");
      }
    } catch (err) {
      console.error("Error fetching BOD data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     setLoading(true);
  //     setError(null);
  //     try {
  //       const lastbod = await GetfirstBOD();
  //       const response = await GetlistBOD();

  //       if (response) {
  //         setData(response.data);

  //         const before = response.data
  //           .filter((item: listBODInterface) => item.BeforeAfterTreatmentID === 1)
  //           .map((item: listBODInterface) => ({
  //             date: item.Date,
  //             data: item.Data,
  //           }));

  //         const after = response.data
  //           .filter((item: listBODInterface) => item.BeforeAfterTreatmentID === 2)
  //           .map((item: listBODInterface) => ({
  //             date: item.Date,
  //             data: item.Data,
  //           }));

  //         const grouped: Record<string, { before?: number; after?: number }> = {};

  //         response.data.forEach((item: listBODInterface) => {
  //           const date = item.Date;
  //           if (!grouped[date]) grouped[date] = {};
  //           if (item.BeforeAfterTreatmentID === 1) grouped[date].before = item.Data;
  //           if (item.BeforeAfterTreatmentID === 2) grouped[date].after = item.Data;
  //         });

  //         const compare = Object.entries(grouped).map(([date, value]) => ({
  //           date,
  //           before: value.before ?? 0,
  //           after: value.after ?? 0,
  //         }));
  //         setUnit(lastbod.data.UnitName)
  //         setBeforeData(before);
  //         setAfterData(after);
  //         setCompareData(compare);
  //       } else {
  //         setError("ไม่พบข้อมูล BOD");
  //       }
  //     } catch (err) {
  //       console.error("Error fetching BOD data:", err);
  //       setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);

  const getChartOptions = (categories: string[], chartType: 'line' | 'bar'): ApexOptions => ({
    chart: {
      id: 'bod-chart',
      toolbar: { show: true },
      zoom: {
        enabled: false,  // ปิด zoom เพื่อไม่ให้เลื่อนหรือซูมได้
      },
      animations: {
        enabled: true,
        speed: 600,
        animateGradually: { enabled: true, delay: 100 },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    plotOptions: chartType === 'bar' ? {
      bar: {
        columnWidth: '50%',
        borderRadius: 4,
      },
    } : {},
    xaxis: {
      categories,
      title: { text: 'วันที่' },
    },
    yaxis: {
      title: {
        text: unit,
      },
    },
    tooltip: { enabled: true },
    dataLabels: { enabled: false },
    stroke: chartType === 'line' ? {
      show: true,
      curve: "smooth",
    } : {
      show: false,
    },
  });


  // const beforeSeries = [{ name: "BOD", data: beforeData.map((item) => item.data) }];
  // const afterSeries = [{ name: "BOD", data: afterData.map((item) => item.data) }];
  // const compareSeries = [
  //   { name: "ก่อนบำบัด", data: compareData.map((item) => item.before) },
  //   { name: "หลังบำบัด", data: compareData.map((item) => item.after) },
  // ];

  // กำหนดสีใน series ของกราฟ
  const beforeSeries = [
    { name: "BOD", data: beforeData.map((item) => item.data), color: colorBefore }
  ];
  const afterSeries = [
    { name: "BOD", data: afterData.map((item) => item.data), color: colorAfter }
  ];
  const compareSeries = [
    { name: "ก่อนบำบัด", data: compareData.map((item) => item.before), color: colorCompareBefore },
    { name: "หลังบำบัด", data: compareData.map((item) => item.after), color: colorCompareAfter },
  ];

  const columns: ColumnsType<listBODInterface> = [
    {
      title: 'วันที่',
      dataIndex: 'Date',
      key: 'date',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'หน่วยที่วัด',
      dataIndex: 'UnitName',
      key: 'unit',
    },
    {
      title: 'มาตรฐาน',
      dataIndex: 'StandardID',
      key: 'standard',
    },
    {
      title: 'ค่าที่วัดได้',
      dataIndex: 'Data',
      key: 'data',
    },
    {
      title: 'สถานะ',
      dataIndex: 'TreatmentName',
      key: 'treatment',
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'Note',
      key: 'note',
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_, record) => (<a href={`#edit/${record.ID}`}>แก้ไข</a>),
    },
  ];

  return (
    <div>
      <div className="bod-title-header">
        <h1>BOD-Central</h1>
        <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดค่า BOD น้ำเสีย</p>
      </div>

      <div className="bod-title">
        <h1 className="bod-title-text"><LeftOutlined className="bod-back-icon" />BOD-GRAPH</h1>
      </div>

      <div className="bod-graph-container">
        <div className="bod-graph-card">
          <h2>น้ำก่อนบำบัด</h2>
          <ColorPicker
            value={colorBefore}
            onChange={(color: Color) => setColorBefore(color.toHexString())}
          // showText
          />
          <Select
            value={chartTypeBefore}
            onChange={val => setChartTypeBefore(val)}
            style={{ marginBottom: 10 }}
          >
            <Select.Option value="line">กราฟเส้น</Select.Option>
            <Select.Option value="bar">กราฟแท่ง</Select.Option>
          </Select>
          <ApexChart
            key={chartTypeBefore}
            options={getChartOptions(beforeData.map(item => item.date), chartTypeBefore)}
            series={beforeSeries}
            type={chartTypeBefore}
            height={350}
          />
        </div>

        <div className="bod-graph-card">
          <h2>น้ำหลังบำบัด</h2>
          <ColorPicker
            value={colorAfter}
            onChange={(color: Color) => setColorAfter(color.toHexString())}
          // showText
          />
          <Select
            value={chartTypeAfter}
            onChange={val => setChartTypeAfter(val)}
            style={{ marginBottom: 10 }}
          >
            <Select.Option value="line">กราฟเส้น</Select.Option>
            <Select.Option value="bar">กราฟแท่ง</Select.Option>
          </Select>
          <ApexChart
            key={chartTypeAfter}
            options={getChartOptions(afterData.map(item => item.date), chartTypeAfter)}
            series={afterSeries}
            type={chartTypeAfter}
            height={350}
          />
        </div>

        <div className="bod-graph-card">
          <h2>เปรียบเทียบก่อน-หลังบำบัด</h2>
          <ColorPicker
            value={colorCompareBefore}
            onChange={(color: Color) => setColorCompareBefore(color.toHexString())}
          // showText
          />
          <ColorPicker
            value={colorCompareAfter}
            onChange={(color: Color) => setColorCompareAfter(color.toHexString())}
          // showText
          />
          <Select
            value={chartTypeCompare}
            onChange={val => setChartTypeCompare(val)}
            style={{ marginBottom: 10 }}
          >
            <Select.Option value="line">กราฟเส้น</Select.Option>
            <Select.Option value="bar">กราฟแท่ง</Select.Option>
          </Select>
          <ApexChart
            key={chartTypeCompare}
            options={getChartOptions(compareData.map(item => item.date), chartTypeCompare)}
            series={compareSeries}
            type={chartTypeCompare}
            height={350}
          />
        </div>
      </div>

      <div className="bod-data">
        <h1 className="bod-title-text">BOD DATA</h1>
        <div className="bod-search-box">
          <Input
            placeholder="ค้นหา"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 200, marginBottom: 10 }}
          />
        </div>
        <Table
          columns={columns}
          dataSource={data.filter(d => dayjs(d.Date).format('YYYY-MM-DD').includes(search))}
          rowKey="ID"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default BODdataviz;
