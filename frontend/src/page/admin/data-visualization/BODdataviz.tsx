import React, { useEffect, useState } from "react";
import { Input, Select, DatePicker, Modal, message, Tooltip } from "antd";
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LeftOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled, CloseCircleFilled, CheckCircleFilled, QuestionCircleFilled } from "@ant-design/icons";
import Table, { ColumnsType } from "antd/es/table";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { useNavigate } from "react-router-dom";
import { BarChart3, LineChart } from "lucide-react";
import { GetlistBOD, GetfirstBOD,DeleteBOD } from "../../../services/bodService"; // ใช้ BOD service
import { GetTDSbyID } from "../../../services/tdsService"; // สำหรับแก้ไข/ลบ TDS (ถ้าต้องการ)
import UpdateTDSCentralForm from '../data-management/wastewater/TDScenter/updateTDScenter';
import './BODdataviz.css';
import BODCentralForm from "../data-management/wastewater/BODcenter/BODcenter";

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const BODdataviz: React.FC = () => {
  const navigate = useNavigate();

  // --- State กราฟ BOD ---
  const [chartTypeBefore, setChartTypeBefore] = useState<'bar' | 'line'>('bar');
  const [chartTypeAfter, setChartTypeAfter] = useState<'bar' | 'line'>('bar');
  const [chartTypeCompare, setChartTypeCompare] = useState<'bar' | 'line'>('bar');
  const [data, setData] = useState<any[]>([]); // ดึง BOD ทั้งหมด
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<{ date: string; before: number; after: number }[]>([]);
  const [beforeData, setBeforeData] = useState<{ date: string; data: number }[]>([]);
  const [afterData, setAfterData] = useState<{ date: string; data: number }[]>([]);
  const [search, setSearch] = useState("");
  const [colorBefore, setColorBefore] = useState<string>("#7B61FF");
  const [colorAfter, setColorAfter] = useState<string>("#33E944");
  const [colorCompareBefore, setColorCompareBefore] = useState<string>("#FF4560");
  const [colorCompareAfter, setColorCompareAfter] = useState<string>("#775DD0");
  const [unit, setUnit] = useState<string>("-");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterMode, setFilterMode] = useState<"dateRange" | "month" | "year">("year");
  const [middlestandard, setMiddleStandard] = useState<number | undefined>(undefined);
  const [minstandard, setMinStandard] = useState<number | undefined>(undefined);
  const [maxstandard, setMaxStandard] = useState<number | undefined>(undefined);

  // // --- State ตาราง (เดิมชื่อ data2 แต่เราใช้ข้อมูล BOD แทน) ---
  // const [data2, setData2] = useState<any[]>([]);

  // --- Modal สำหรับเพิ่ม/แก้ไข TDS (ถ้าต้องการใช้) ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditRecord] = useState<any>(null);
  const { confirm } = Modal;

  // --- โหลดสีจาก localStorage ---
  useEffect(() => {
    const storedColorBefore = localStorage.getItem('colorBefore');
    const storedColorAfter = localStorage.getItem('colorAfter');
    const storedColorCompareBefore = localStorage.getItem('colorCompareBefore');
    const storedColorCompareAfter = localStorage.getItem('colorCompareAfter');
    if (storedColorBefore) setColorBefore(storedColorBefore);
    if (storedColorAfter) setColorAfter(storedColorAfter);
    if (storedColorCompareBefore) setColorCompareBefore(storedColorCompareBefore);
    if (storedColorCompareAfter) setColorCompareAfter(storedColorCompareAfter);
  }, []);

  // --- ฟังก์ชันโหลดข้อมูล BOD สำหรับกราฟและตาราง ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const lastbod = await GetfirstBOD();
      const response = await GetlistBOD();
      if (response) {
        setData(response.data);

        // จัดกลุ่มข้อมูลสำหรับกราฟ
        const grouped: Record<string, { before: number[]; after: number[] }> = {};
        response.data.forEach((item: any) => {
          const key = filterMode === "year"
            ? dayjs(item.Date).format("YYYY-MM")
            : dayjs(item.Date).format("YYYY-MM-DD");

          if (!grouped[key]) grouped[key] = { before: [], after: [] };
          if (item.BeforeAfterTreatmentID === 1) grouped[key].before.push(item.Data);
          else if (item.BeforeAfterTreatmentID === 2) grouped[key].after.push(item.Data);
        });

        const createDateRange = (start: Dayjs, end: Dayjs): string[] => {
          const arr: string[] = [];
          if (filterMode === "year") {
            let curr = start.startOf('month');
            const last = end.startOf('month');
            while (curr.isBefore(last) || curr.isSame(last)) {
              arr.push(curr.format("YYYY-MM"));
              curr = curr.add(1, 'month');
            }
          } else {
            let curr = start.startOf('day');
            const last = end.startOf('day');
            while (curr.isBefore(last) || curr.isSame(last)) {
              arr.push(curr.format("YYYY-MM-DD"));
              curr = curr.add(1, 'day');
            }
          }
          return arr;
        };

        let allDates: string[] = [];
        if (dateRange) {
          allDates = createDateRange(dateRange[0], dateRange[1]);
        } else {
          const allDatesInData = Object.keys(grouped).sort();
          if (allDatesInData.length > 0) {
            const last5Dates = allDatesInData.slice(-5);
            const start = dayjs(last5Dates[0]);
            const end = dayjs(last5Dates[last5Dates.length - 1]);
            allDates = createDateRange(start, end);
          }
        }

        const before: { date: string; data: number }[] = [];
        const after: { date: string; data: number }[] = [];
        const compare: { date: string; before: number; after: number }[] = [];

        allDates.forEach(date => {
          const values = grouped[date];
          const avgBefore = values?.before.length
            ? values.before.reduce((a, b) => a + b, 0) / values.before.length
            : 0;
          const avgAfter = values?.after.length
            ? values.after.reduce((a, b) => a + b, 0) / values.after.length
            : 0;
          before.push({ date, data: avgBefore });
          after.push({ date, data: avgAfter });
          compare.push({ date, before: avgBefore, after: avgAfter });
        });

        if (lastbod.data.MiddleValue !== 0) {
          setMiddleStandard(lastbod.data.MiddleValue);
        } else {
          setMaxStandard(lastbod.data.MaxValue);
          setMinStandard(lastbod.data.MinValue);
        }
        setUnit(lastbod.data.UnitName);
        setBeforeData(before);
        setAfterData(after);
        setCompareData(compare);

        // แปลงข้อมูลสำหรับตาราง BOD ให้มี dateOnly, timeOnly สำหรับแสดงในตาราง
        const tableData = response.data.map((item: any) => {
          const dt = dayjs(item.Date);
          return {
            ...item,
            dateOnly: dt.format("YYYY-MM-DD"),
            timeOnly: dt.format("HH:mm"),
          };
        });
        console.log(tableData)
        setData(tableData);

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

  useEffect(() => {
    fetchData();
  }, [dateRange, filterMode]);

  // --- คอลัมน์ตาราง (เหมือนของเดิม) ---
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
      render: (_, record) => record.UnitName || '-',
    },
    {
      title: 'มาตรฐาน',
      key: 'standard',
      width: 100,
      render: (_, record) => {
        // ถ้าใช้ MiddleValue, MinValue, MaxValue ที่อยู่ใน record เลย
        if (record.MiddleValue && record.MiddleValue !== 0) {
          return record.MiddleValue;
        }
        if (
          record.MinValue !== undefined &&
          record.MaxValue !== undefined &&
          (record.MinValue !== 0 || record.MaxValue !== 0)
        ) {
          return `${record.MinValue} - ${record.MaxValue}`;
        }
        return '-';
      }
    },
    {
      title: 'ค่าก่อนเข้าระบบบำบัด',
      key: 'beforeValue',
      width: 100,
      render: (_, record) => (record.BeforeAfterTreatmentID === 1 ? record.Data : '-'),
    },
    {
      title: 'ค่าหลังเข้าระบบบำบัด',
      key: 'afterValue',
      width: 100,
      render: (_, record) => (record.BeforeAfterTreatmentID === 2 ? record.Data : '-'),
    },
    {
      title: 'หมายเหตุ',
      key: 'note',
      width: 120,
      render: (_, record) => record.Note || '-',
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 200,
      render: (_, record) => {
        const statusName = record.StatusName; // <-- เปลี่ยนจาก record.Status?.StatusName เป็นตรงนี้

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
    // ปุ่มจัดการเหมือนเดิม
    {
      title: 'จัดการข้อมูล',
      key: 'action',
      className: 'darker-column',
      width: 120,
      render: (_, record) => (
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

  // --- ฟังก์ชันแก้ไขข้อมูล (ยังใช้ GetTDSbyID อยู่ ถ้าอยากแก้ BOD ต้องเปลี่ยน service ด้วย) ---
  const handleEdit = async (id: number) => {
    try {
      const response = await GetTDSbyID(id);
      if (response.status === 200) {
        setEditRecord(response.data);
        setIsEditModalVisible(true);
      } else {
        message.error("ไม่พบข้อมูลสำหรับแก้ไข");
      }
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };

  // --- ฟังก์ชันลบข้อมูล ---
  const handleDelete = (id: number) => {
    confirm({
      title: 'คุณแน่ใจหรือไม่?',
      icon: <ExclamationCircleFilled />,
      content: 'คุณต้องการลบข้อมูลรายการนี้ใช่หรือไม่?',
      okText: 'ใช่, ลบเลย',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk() {
        deleteBODRecord(id);
      },
    });
  };

  const deleteBODRecord = async (id: number) => {
    try {
      await DeleteBOD(id);
      message.success('ลบข้อมูลสำเร็จ');
      fetchData();
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  // --- ฟังก์ชันเปิด modal เพิ่มข้อมูล ---
  const showModal = () => {
    setEditRecord(null);
    setIsModalVisible(true);
  };

  // --- ฟังก์ชันยกเลิก modal ---
  const handleAddModalCancel = () => setIsModalVisible(false);
  const handleEditModalCancel = () => setIsEditModalVisible(false);

  // --- ฟังก์ชันช่วยแปลงชื่อเดือนไทย ---
  const monthShortNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthShortNames[monthIndex]} ${year}`;
  };

  // const STANDARD_VALUE = middlestandard ?? 0;

  const getChartOptions = (
    categories: string[],
    chartType: 'line' | 'bar',
    isYearMode = false,
    dataSeries: number[]
  ): ApexOptions => {
    const categoriesFormatted = isYearMode
      ? categories.map((month) => formatMonthLabel(month))
      : categories;

    const maxValueInData = Math.max(...dataSeries);
    const isStandardRange = minstandard !== undefined && maxstandard !== undefined && minstandard !== maxstandard;

    const standardCeil = middlestandard !== undefined && middlestandard !== 0 ? middlestandard : maxstandard ?? 0;
    const adjustedMax = Math.max(maxValueInData, standardCeil) * 1.1;

    return {
      chart: {
        id: "bod-chart",
        toolbar: { show: true },
        zoom: { enabled: false },
      },
      annotations: {
        yaxis: [
          ...(isStandardRange
            ? [
              {
                y: minstandard ?? 0,
                borderColor: "#CF1F2A",
                label: {
                  text: `Min Standard ${minstandard ?? 0}`,
                  style: { background: "#CF1F2A", color: "#fff" },
                },
              },
              {
                y: maxstandard ?? 0,
                borderColor: "#035303ff",
                label: {
                  text: `Max Standard ${maxstandard ?? 0}`,
                  style: { background: "#035303ff", color: "#fff" },
                },
              },
            ]
            : middlestandard !== undefined && middlestandard !== 0
              ? [
                {
                  y: middlestandard,
                  borderColor: "#CF1F2A",
                  label: {
                    text: `มาตรฐาน ${middlestandard}`,
                    style: { background: "#CF1F2A", color: "#fff" },
                  },
                },
              ]
              : []),
        ],
      },
      xaxis: {
        categories: categoriesFormatted,
      },
      yaxis: {
        min: 0,
        max: adjustedMax,
        title: {
          text: unit || "mg/L",
        },
        labels: {
          formatter: (value: number) => value.toFixed(2),
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(2)} ${unit}`,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: chartType === "line" ? { show: true, curve: "smooth" } : { show: false },
    };
  };





  const beforeSeries = [
    { name: "BOD", data: beforeData.map(item => item.data), color: colorBefore }
  ];
  const afterSeries = [
    { name: "BOD", data: afterData.map(item => item.data), color: colorAfter }
  ];
  const compareSeries = [
    { name: "ก่อนบำบัด", data: compareData.map(item => item.before), color: colorCompareBefore },
    { name: "หลังบำบัด", data: compareData.map(item => item.after), color: colorCompareAfter },
  ];
  const combinedCompareData = [
    ...compareSeries[0].data,
    ...compareSeries[1].data,
  ];

  // const columns: ColumnsType<listBODInterface> = [
  //   {
  //     title: 'วันที่',
  //     dataIndex: 'Date',
  //     key: 'date',
  //     render: (date) => dayjs(date).format('YYYY-MM-DD'),
  //   },
  //   {
  //     title: 'หน่วยที่วัด',
  //     dataIndex: 'UnitName',
  //     key: 'unit',
  //   },
  //   {
  //     title: 'มาตรฐาน',
  //     dataIndex: 'StandardID',
  //     key: 'standard',
  //   },
  //   {
  //     title: 'ค่าที่วัดได้',
  //     dataIndex: 'Data',
  //     key: 'data',
  //   },
  //   {
  //     title: 'สถานะ',
  //     dataIndex: 'TreatmentName',
  //     key: 'treatment',
  //   },
  //   {
  //     title: 'หมายเหตุ',
  //     dataIndex: 'Note',
  //     key: 'note',
  //   },
  //   {
  //     title: 'จัดการ',
  //     key: 'action',
  //     render: (_, record) => (<a href={`#edit/${record.ID}`}>แก้ไข</a>),
  //   },
  // ];


  return (
    <div>
      <div className="bod-title-header">
        <h1>BOD-Central</h1>
        <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดค่า BOD น้ำเสีย</p>
      </div>
      <div style={{ padding: "10px" }}>
        <div className="bod-title">
          <div>
            <h1
              className="bod-title-text"
              onClick={() => navigate(-1)}
              style={{ cursor: 'pointer' }}
            >
              <LeftOutlined className="bod-back-icon" />
              BOD-GRAPH
            </h1>
          </div>
          <div className="bod-select-date">
            <div>
              <Select
                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  setDateRange(null); // เคลียร์ช่วงวันที่เดิม
                }}
                className="bod-select-filter"
                options={[
                  { label: "เลือกช่วงวัน", value: "dateRange" },
                  { label: "เลือกเดือน", value: "month" },
                  { label: "เลือกปี", value: "year" },
                ]}
              />
            </div>
            {/* แสดง input ตามโหมด */}
            <div>
              {filterMode === "dateRange" && (
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setDateRange([dates[0], dates[1]]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                  allowClear={false}
                  format="YYYY-MM-DD"
                  style={{ width: 300 }}
                  placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                />
              )}

              {filterMode === "month" && (
                <DatePicker
                  picker="month"
                  onChange={(date) => {
                    if (date) {
                      const start = date.startOf('month');
                      const end = date.endOf('month');
                      setDateRange([start, end]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                  placeholder="เลือกเดือน"
                  style={{ width: 150 }}
                  allowClear={false}
                  value={dateRange ? dayjs(dateRange[0]) : null}
                />
              )}

              {filterMode === "year" && (
                <DatePicker
                  picker="year"
                  onChange={(date) => {
                    if (date) {
                      const start = date.startOf('year');
                      const end = date.endOf('year');
                      setDateRange([start, end]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                  placeholder="เลือกปี"
                  style={{ width: 150 }}
                  allowClear={false}
                  value={dateRange ? dayjs(dateRange[0]) : null}
                />
              )}
            </div>
          </div>
        </div>
        <div className="bod-graph-container">
          {/* ตารางน้ำก่อนบำบัดนะจ๊ะ */}
          <div className="bod-graph-card">
            <div className="bod-head-graph-card">
              <div className="width25">
                <h2 className="bod-head-graph-card-text">น้ำก่อนบำบัด</h2>
              </div>
              <div>
                <ColorPicker
                  value={colorBefore}
                  onChange={(color: Color) => {
                    const hex = color.toHexString();
                    setColorBefore(hex);
                    localStorage.setItem('colorBefore', hex);
                  }}
                />
              </div>
            </div>
            <div className="bod-right-select-graph">
              <Select
                value={chartTypeBefore}
                onChange={val => setChartTypeBefore(val)}
                style={{ marginBottom: 10 }}
              >
                <Select.Option value="line">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <LineChart size={16} style={{ marginRight: 6 }} />
                    <span>กราฟเส้น</span>
                  </div>
                </Select.Option>
                <Select.Option value="bar">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <BarChart3 size={16} style={{ marginRight: 6 }} />
                    <span>กราฟแท่ง</span>
                  </div>
                </Select.Option>
              </Select>
            </div>
            <ApexChart
              key={chartTypeBefore}
              options={getChartOptions(
                beforeData.map(item => item.date),
                chartTypeBefore,
                filterMode === "year",
                beforeSeries[0]?.data || [] //  ส่ง data เพื่อใช้หาค่าสูงสุด
              )}
              series={beforeSeries}
              type={chartTypeBefore}
              height={350}
            />
          </div>

          <div className="bod-graph-card">
            <div className="bod-head-graph-card">
              <div className="width25">
                <h2 className="bod-head-graph-card-text">น้ำหลังบำบัด</h2>
              </div>
              <div>
                <ColorPicker
                  value={colorAfter}
                  onChange={(color: Color) => {
                    const hex = color.toHexString();
                    setColorAfter(hex);
                    localStorage.setItem('colorAfter', hex);
                  }}
                />
              </div>
            </div>
            <div className="bod-right-select-graph">
              <Select
                value={chartTypeAfter}
                onChange={val => setChartTypeAfter(val)}
                style={{ marginBottom: 10 }}
              >
                <Select.Option value="line">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <LineChart size={16} style={{ marginRight: 6 }} />
                    <span>กราฟเส้น</span>
                  </div>
                </Select.Option>
                <Select.Option value="bar">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <BarChart3 size={16} style={{ marginRight: 6 }} />
                    <span>กราฟแท่ง</span>
                  </div>
                </Select.Option>
              </Select>
            </div>
            <ApexChart
              key={chartTypeAfter}
              options={getChartOptions(
                afterData.map(item => item.date),
                chartTypeAfter,
                filterMode === "year",
                afterSeries[0]?.data || []
              )}
              series={afterSeries}
              type={chartTypeAfter}
              height={350}
            />
          </div>
          <div className="bod-graph-card">
            <div className="bod-head-graph-card">
              <div className="width40">
                <h2 className="bod-head-graph-card-text" >เปรียบเทียบก่อน-หลังบำบัด</h2>
              </div>
              <div>
                <ColorPicker
                  value={colorCompareBefore}
                  onChange={(color: Color) => {
                    const hex = color.toHexString();
                    setColorCompareBefore(hex);
                    localStorage.setItem('colorCompareBefore', hex);
                  }}
                />
                <ColorPicker
                  value={colorCompareAfter}
                  onChange={(color: Color) => {
                    const hex = color.toHexString();
                    setColorCompareAfter(hex);
                    localStorage.setItem('colorCompareAfter', hex);
                  }}
                />
              </div>
            </div>
            <div className="bod-right-select-graph">
              <Select
                value={chartTypeCompare}
                onChange={val => setChartTypeCompare(val)}
                style={{ marginBottom: 10 }}
              >
                <Select.Option value="line">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <LineChart size={16} style={{ marginRight: 6 }} />
                    <span>กราฟเส้น</span>
                  </div>
                </Select.Option>
                <Select.Option value="bar">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <BarChart3 size={16} style={{ marginRight: 6 }} />
                    <span>กราฟแท่ง</span>
                  </div>
                </Select.Option>
              </Select>
            </div>
            <ApexChart
              key={chartTypeCompare}
              options={getChartOptions(
                compareData.map(item => item.date),
                chartTypeCompare,
                filterMode === "year",
                combinedCompareData
              )}
              series={compareSeries}
              type={chartTypeCompare}
              height={350}
            />
          </div>
        </div>
        {/* <div className="bod-data">
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
        </div> */}

        <div className="bod-header-vis">
          <div className="bod-title-search-vis">
            <h1 className="bod-title-text-vis">BOD DATA</h1>
            <div>
              <div className="bod-search-box">
                <Input
                  placeholder="ค้นหา"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  prefix={<SearchOutlined />}
                  className="bod-search-input"
                />
              </div>
            </div>
          </div>
          <div className="bod-btn-container">
            <button className="bod-add-btn" onClick={showModal}>เพิ่มข้อมูลใหม่</button>
          </div>
        </div>

        <div className="bod-table-tdsdata">
          <h1 className="bod-title-text-table">ตารางรายงานผลการดำเนินงาน</h1>
          <Table
            columns={columns}
            dataSource={data
              .filter((d) => dayjs(d.dateOnly).format('YYYY-MM-DD').includes(search))
              .sort((a, b) => dayjs(b.dateOnly).valueOf() - dayjs(a.dateOnly).valueOf()) // เรียงวันที่ล่าสุดก่อน
            }
            rowKey="ID"
            loading={loading}
            pagination={{ pageSize: 8 }}
            bordered
          />

        </div>

        <div className="bod-central-statistics">
          <h1 className="bod-title-text-statistics">BOD-Central Statistics</h1>
          <h2>ผลการตรวจวัดค่า ปริมาณของสารต่างๆ ที่ละลายอยู่ในน้ำ บริเวณระบบบำบัดนํ้าเสียส่วนกลาง</h2>
        </div>

        <Modal
          title={"เพิ่มข้อมูล BOD ใหม่"}
          open={isModalVisible}
          footer={null}
          width={1100}
          destroyOnClose
          closable={false}
        >
          <BODCentralForm onCancel={handleAddModalCancel} />
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
      </div>
    </div>
  );
};

export default BODdataviz;
