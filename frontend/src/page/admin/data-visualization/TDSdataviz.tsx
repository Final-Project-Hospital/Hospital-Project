import React, { useEffect, useState } from "react";
import { DatePicker, Input, Select, Tooltip, Modal, message } from "antd";
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { GetTDS, DeleteAllTDSRecordsByDate } from "../../../services/tdsService";
import './TDSdataviz.css';
import { LeftOutlined, SearchOutlined, ExclamationCircleFilled, CloseCircleFilled, CheckCircleFilled, QuestionCircleFilled, } from "@ant-design/icons";
import Table, { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import TDSCentralForm from '../data-management/TDScenter/TDScenter'
import UpdateTDSCentralForm from '../data-management/TDScenter/updateTDScenter'
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

  // อันใหม่
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GetTDS();
      if (!response || response.length === 0) {
        setError("ไม่พบข้อมูล TDS");
        console.log(error);
        setLoading(false);
        return;
      }
      const processedData = response.map((item: any) => {
        const dt = dayjs(item.date);
        return {
          ...item,
          dateOnly: dt.format("DD-MM-YYYY"),
          timeOnly: dt.format("HH:mm:ss"),

          // ใช้ before_note และ after_note ที่ได้จาก backend เลย
          before_note: item.before_note || '',
          after_note: item.after_note || '',
        };
      });

      // เรียงวันที่ใหม่ → เก่า
      processedData.sort((a: any, b: any) =>
        dayjs(b.date).diff(dayjs(a.date))
      );

      console.log(processedData)
      setData(processedData);

      const before = processedData
        .filter((item: any) => item.before_value !== undefined && item.before_value !== null)
        .map((item: any) => ({ date: item.dateOnly, data: item.before_value || 0 }));

      const after = processedData
        .filter((item: any) => item.after_value !== undefined && item.after_value !== null)
        .map((item: any) => ({ date: item.dateOnly, data: item.after_value || 0 }));

      const combinedMap: Record<string, { before: number; after: number }> = {};

      // รวมข้อมูล before & after โดยใช้ date เป็น key
      processedData.forEach((item: any) => {
        if (!combinedMap[item.dateOnly]) {
          combinedMap[item.dateOnly] = { before: 0, after: 0 };
        }
        if (item.before_value !== undefined && item.before_value !== null) {
          combinedMap[item.dateOnly].before = item.before_value;
        }
        if (item.after_value !== undefined && item.after_value !== null) {
          combinedMap[item.dateOnly].after = item.after_value;
        }
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

  //ใช้กับกราฟ
  const getChartOptions = (categories: string[]): ApexOptions => ({
    chart: { id: 'tds-chart', toolbar: { show: true } },
    xaxis: { categories, title: { text: 'วันที่' } },
    yaxis: { title: { text: 'mg/L' } },
    tooltip: { enabled: true },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
  });
  //ใช้กับกราฟ
  const beforeSeries = [{ name: "TDS", data: beforeData.map((item) => item.data) }];
  const afterSeries = [{ name: "TDS", data: afterData.map((item) => item.data) }];
  const compareSeries = [
    { name: "ก่อนบำบัด", data: compareData.map(item => item.before) },
    { name: "หลังบำบัด", data: compareData.map(item => item.after) },
  ];

  // อันใหม่
  const columns: ColumnsType<any> = [
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      width: 130,
    },
    {
      title: 'หน่วยที่วัด',
      dataIndex: 'unit',
      key: 'unit',
      width: 145,
      render: (unit: string) => unit || '-',
    },
    {
      title: 'ค่ามาตรฐาน',
      dataIndex: 'standard_value',
      key: 'standard_value',
      width: 130,
      render: (val: number) => val ?? '-',
    },
    {
      title: 'ค่าก่อนเข้าระบบบำบัด',
      dataIndex: 'before_value',
      key: 'before_value',
      width: 120,
      render: (val: number | null) => val ?? '-',
    },
    {
      title: 'ค่าหลังเข้าระบบบำบัด',
      dataIndex: 'after_value',
      key: 'after_value',
      width: 120,
      render: (val: number | null) => val ?? '-',
    },
    {
      title: (
        <>
          หมายเหตุ
          <br />
          ( ก่อน / หลัง )
        </>
      ),
      dataIndex: 'note',
      key: 'note',
      width: 150,
      render: (_: any, record: any) => {
        const beforeNote = record.before_note || '-';
        const afterNote = record.after_note || '-';
        return [beforeNote, afterNote].filter(Boolean).join(' / ');
      },
    },
    {
      title: (
        <>
          ประสิทธิภาพ
          <br />
          ( % )
        </>
      ),
      key: 'efficiency',
      width: 120,
      render: (_: any, record: any) => {
        const { efficiency } = record;
        if (typeof efficiency === 'number') {
          const safeEff = efficiency < 0 ? 0 : efficiency; // ✅ ถ้าติดลบให้เป็น 0
          return safeEff.toFixed(2);
        }
        return '-';
      },
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 200,
      render: (_, record) => {
        const statusName = record.status;  // 👈 เปลี่ยนตรงนี้

        if (!statusName) {
          return (
            <span className="status-badge status-none">
              <QuestionCircleFilled style={{ fontSize: 20 }} />
              ไม่มีข้อมูล
            </span>
          );
        }

        if (statusName.includes("ต่ำกว่า")) {
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
      render: (_: any, record: any) => {
        console.log('record:', record);
        return (
          <div className="action-buttons">
            <Tooltip title="แก้ไข">
              <button
                className="circle-btn edit-btn"
                onClick={() => handleEdit([record.before_id, record.after_id])}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title="ลบ">
              <button
                className="circle-btn delete-btn"
                onClick={() => handleDelete([record.before_id, record.after_id])}  // ✅ ส่ง ID เดียว
              >
                <DeleteOutlined />
              </button>
            </Tooltip>
          </div>
        );
      }
    }
  ];

  const showModal = () => {
    setEditRecord(null);
    setIsModalVisible(true);
  };

  // อันใหม่
  const handleEdit = async (ids: (number | undefined)[]) => {
    console.log("IDs:", ids);

    // กรองเอาเฉพาะ id ที่ไม่ undefined และไม่ null
    const filteredIds = ids.filter((id): id is number => typeof id === 'number');

    if (filteredIds.length === 0) {
      message.error("ไม่พบ ID สำหรับแก้ไข");
      return;
    }

    try {
      const responses = await Promise.all(filteredIds.map((id) => GetTDSbyID(id)));
      const validData = responses
        .filter((res) => res && res.status === 200)
        .map((res) => res.data);

      if (validData.length === 0) {
        message.error("ไม่พบข้อมูลสำหรับแก้ไข");
        return;
      }

      setEditRecord(validData);
      setIsEditModalVisible(true);
    } catch (error) {
      console.error("Error fetching TDS data:", error);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };

  // ใหม่
  const handleDelete = (ids: (number | null | undefined)[] | number | null | undefined) => {
    let validIds: number[] = [];

    if (Array.isArray(ids)) {
      validIds = ids.filter((id): id is number => typeof id === "number" && id !== null);
    } else if (typeof ids === "number") {
      validIds = [ids];
    }

    if (validIds.length === 0) {
      message.error("ไม่มี ID ที่จะลบ");
      return;
    }

    const firstId = validIds[0];

    confirm({
      title: "คุณแน่ใจหรือไม่?",
      icon: <ExclamationCircleFilled />,
      content: "คุณต้องการลบข้อมูลรายการนี้ใช่หรือไม่?",
      okText: "ใช่, ลบเลย",
      okType: "danger",
      cancelText: "ยกเลิก",
      async onOk() {
        try {
          await DeleteAllTDSRecordsByDate(firstId);
          message.success("ลบข้อมูลสำเร็จ");
          await fetchData();
        } catch (error) {
          message.error("ลบข้อมูลไม่สำเร็จ");
        }
      },
    });
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
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['7', '10', '15', '30', '100'],
          }}
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
