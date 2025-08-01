import React, { useEffect, useState } from "react";
import { DatePicker, Input, Select, Tooltip, Modal, message } from "antd";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { GetTDS, DeleteTDS } from "../../../services/tdsService";
import './TDSdataviz.css';
import { LeftOutlined, SearchOutlined, ExclamationCircleFilled, CloseCircleFilled, CheckCircleFilled, QuestionCircleFilled, } from "@ant-design/icons";
import Table, { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import TDSCentralForm from '../data-management/wastewater/TDScenter/TDScenter'
import UpdateTDSCentralForm from '../data-management/wastewater/TDScenter/updateTDScenter'
import { GetTDSbyID } from '../../../services/tdsService';

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
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditRecord] = useState<any>(null);

  const handleAddModalCancel = () => setIsModalVisible(false);
  const handleEditModalCancel = () => setIsEditModalVisible(false);

  const { confirm } = Modal;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GetTDS();
      if (!response || response.length === 0) {
        setError("ไม่พบข้อมูล TDS");
        setLoading(false);
        return;
      }

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
        .map((item: any) => ({ date: item.dateOnly, data: item.Data || 0 }));

      const after = processedData
        .filter((item: any) => item.BeforeAfterTreatment?.ID === 2)
        .map((item: any) => ({ date: item.dateOnly, data: item.Data || 0 }));

      const combined = processedData
        .filter((item: any) => item.BeforeAfterTreatment?.ID === 3)
        .map((item: any) => ({
          date: item.dateOnly,
          beforeData: item.Note === "ก่อนบำบัด" ? item.Data || 0 : null,
          afterData: item.Note === "หลังบำบัด" ? item.Data || 0 : null,
        }));

      const combinedMap: Record<string, { before: number; after: number }> = {};

      combined.forEach((item: any) => {
        if (!combinedMap[item.date]) combinedMap[item.date] = { before: 0, after: 0 };
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

    } catch (err) {
      console.error("Error fetching TDS data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      width: 125,
    },
    {
      title: 'เวลา',
      dataIndex: 'timeOnly',
      key: 'timeOnly',
      width: 55,
    },
    {
      title: 'หน่วยที่วัด',
      key: 'unit',
      width: 145,
      render: (_, record: any) => record.Unit?.UnitName || '-',
    },
    {
      title: 'มาตรฐาน',
      key: 'standard',
      width: 100,
      render: (_: any, record: any) => {
        const std = record.Standard;
        if (std) {
          if (typeof std.MiddleValue === 'number' && std.MiddleValue > 0) {
            return std.MiddleValue;
          }
          if (
            typeof std.MinValue === 'number' &&
            typeof std.MaxValue === 'number' &&
            (std.MinValue !== 0 || std.MaxValue !== 0)
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
      width: 100,
      render: (_, record: any) => (record.BeforeAfterTreatment?.ID === 1 ? record.Data : '-'),
    },
    {
      title: 'ค่าหลังเข้าระบบบำบัด',
      key: 'afterValue',
      width: 100,
      render: (_, record: any) => (record.BeforeAfterTreatment?.ID === 2 ? record.Data : '-'),
    },
    {
      title: 'หมายเหตุ',
      key: 'note',
      width: 120,
      render: (_, record: any) => record.Note || '-',
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 200,
      render: (_, record) => {
        const statusName = record.Status?.StatusName;

        if (!statusName) {
          return (
            <span className="status-badge status-none">
              <QuestionCircleFilled style={{ fontSize: 20 }} />
              ไม่มีข้อมูล
            </span>
          );
        }

        if (statusName.includes("ตํ่ากว่า")) {
          return (
            <span className="status-badge status-low">
              <ExclamationCircleFilled style={{ marginBottom: -4, fontSize: 18 }} />
              {statusName}
            </span>
          );
        }

        if (statusName.includes("เกิน")) {
          return (
            <span className="status-badge status-high">
              <CloseCircleFilled style={{ marginBottom: -4, fontSize: 18 }} />
              {statusName}
            </span>
          );
        }

        if (statusName.includes("อยู่ใน")) {
          return (
            <span className="status-badge status-good">
              <CheckCircleFilled style={{ marginBottom: -4, fontSize: 18 }} />
              {statusName}
            </span>
          );
        }
      }
    },
    {
      title: 'จัดการข้อมูล',
      key: 'action',
      className: 'darker-column',
      width: 120,
      render: (_: any, record: any) => (
        <div className="action-buttons">
          <Tooltip title="แก้ไข">
            <button className="circle-btn edit-btn" onClick={() => handleEdit(record.ID)}>
              <EditOutlined />
            </button>
          </Tooltip>
          <Tooltip title="ลบ">
            <button className="circle-btn delete-btn" onClick={() => handleDelete(record.ID)}>
              <DeleteOutlined />
            </button>
          </Tooltip>
        </div>
      ),
    }
  ];

  const showModal = () => {
    setEditRecord(null);
    setIsModalVisible(true);
  };
 
  const handleEdit = async (id: number) => {
    try {
      const response = await GetTDSbyID(id);
      if (response.status === 200) {
        setEditRecord(response.data);
        console.log(response.data);
        setIsEditModalVisible(true);
      } else {
        message.error("ไม่พบข้อมูลสำหรับแก้ไข");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };

  // เมื่อกดปุ่มลบ
  const handleDelete = (id: number) => {
    confirm({
      title: 'คุณแน่ใจหรือไม่?',
      icon: <ExclamationCircleFilled />,
      content: 'คุณต้องการลบข้อมูลรายการนี้ใช่หรือไม่?',
      okText: 'ใช่, ลบเลย',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk() {
        deleteTDSRecord(id);
      },
    });
  };

  const deleteTDSRecord = async (id: number) => {
    try {
      await DeleteTDS(id);
      message.success('ลบข้อมูล TDS สำเร็จ');
      fetchData();
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
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

      {/*ส่วนตาราง*/}
      <div className="tds-header-vis">
        <div className="tds-title-search-vis">
          <h1 className="tds-title-text">TDS DATA</h1>
          <div>
            <div className="search-box-tds">
              <Input
                placeholder="ค้นหา"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<SearchOutlined />}
                className="search-input"
              />
            </div>
          </div>
        </div>
        <div className="btn-container">
          <button className="add-btn" onClick={showModal}>เพิ่มข้อมูลใหม่</button>
        </div>
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

      <Modal
        title={"เพิ่มข้อมูล TDS ใหม่"}
        open={isModalVisible}
        footer={null}
        width={1100}
        destroyOnClose
        closable={false}
      >
        <TDSCentralForm onCancel={handleAddModalCancel} />
      </Modal>

      <Modal
        title="แก้ไขข้อมูล TDS"
        open={isEditModalVisible}
        footer={null}
        width={1100}
        closable={false}
      >
        {editingRecord && (
          <UpdateTDSCentralForm
            initialValues={editingRecord}
            onSuccess={() => {
              setIsEditModalVisible(false);
              setEditRecord(null);
              fetchData();
            }}
            onCancel={handleEditModalCancel}
          />
        )}
      </Modal>

    </div >
  );
};

export default TDSdataviz;
