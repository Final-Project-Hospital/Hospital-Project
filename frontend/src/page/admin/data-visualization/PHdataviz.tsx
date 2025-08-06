//ใช้ทั้งกราฟและตาราง
import React, { useEffect, useState } from "react";
import { Input, Select, DatePicker, Modal, message, Tooltip, Button } from "antd";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LeftOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled, CloseCircleFilled, CheckCircleFilled, QuestionCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import './PHdataviz.css';
import dayjs, { Dayjs } from "dayjs";
import { GetlistPH, GetfirstPH } from "../../../services/phService";

// ใช้กับกราฟ
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { BarChart3, LineChart, Maximize2 } from "lucide-react";

//ใช้กับตาราง
import Table, { ColumnsType } from "antd/es/table";
import { GetPHbyID } from "../../../services/phService";
import UpdatePHCentralForm from "../data-management/PHcenter/updatePHcenter";
import PHCentralForm from "../data-management/PHcenter/PHcenter"
import { DeleteAllPHRecordsByDate } from "../../../services/phService";
import { GetPHTABLE } from "../../../services/phService";
import { ListStatus } from '../../../services/index';
import { ListStatusInterface } from '../../../interface/IStatus';
const normalizeString = (str: any) =>
  String(str).normalize("NFC").trim().toLowerCase();

//ใช้ตั้งค่าวันที่ให้เป็นภาษาไทย
import 'dayjs/locale/th';
import th_TH from 'antd/es/date-picker/locale/th_TH';
dayjs.locale('th');
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const PHdataviz: React.FC = () => {
  const navigate = useNavigate();

  //ใช้ทั้งกราฟและตาราง
  const [data, setData] = useState<any[]>([]); // ดึง PH ทั้งหมด
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterMode, setFilterMode] = useState<"dateRange" | "month" | "year">("year");

  //ใช้กับกราฟ
  const [chartTypeBefore, setChartTypeBefore] = useState<'bar' | 'line'>('line');
  const [chartTypeAfter, setChartTypeAfter] = useState<'bar' | 'line'>('line');
  const [chartTypeCompare, setChartTypeCompare] = useState<'bar' | 'line'>('line');
  const [chartpercentChange, setpercentChange] = useState<'bar' | 'line'>('line');
  const [compareData, setCompareData] = useState<{ date: string; before: number; after: number }[]>([]);
  const [beforeData, setBeforeData] = useState<{ date: string; data: number }[]>([]);
  const [afterData, setAfterData] = useState<{ date: string; data: number }[]>([]);
  const [colorBefore, setColorBefore] = useState<string>("#7B61FF");
  const [colorAfter, setColorAfter] = useState<string>("#33E944");
  const [colorCompareBefore, setColorCompareBefore] = useState<string>("#FF4560");
  const [colorCompareAfter, setColorCompareAfter] = useState<string>("#775DD0");
  const [unit, setUnit] = useState<string>("-");
  const [middlestandard, setMiddleStandard] = useState<number | undefined>(undefined);
  const [minstandard, setMinStandard] = useState<number | undefined>(undefined);
  const [maxstandard, setMaxStandard] = useState<number | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalGraphType, setModalGraphType] = useState<"before" | "after" | "compare" | "percentChange" | null>(null);
  const [percentChangeData, setPercentChangeData] = useState<{ date: string; percent: number }[]>([]);
  const [colorPercentChange, setcolorPercentChange] = useState<string>("#FF4560");

  //ใช้กับตาราง
  const [search, setSearch] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);  // --- Modal สำหรับเพิ่ม/แก้ไข PH (ถ้าต้องการใช้) ---
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditRecord] = useState<any>(null);
  const { confirm } = Modal;
  const [statusOptions, setStatusOptions] = useState<ListStatusInterface[]>([]);

  //ใช้กับกราฟ ---โหลดสีจาก localStorage----
  useEffect(() => {
    const storedColorBefore = localStorage.getItem('colorBefore');
    const storedColorAfter = localStorage.getItem('colorAfter');
    const storedColorCompareBefore = localStorage.getItem('colorCompareBefore');
    const storedColorCompareAfter = localStorage.getItem('colorCompareAfter');
    const storedcolorPercentChange = localStorage.getItem('colorPercentChange');
    if (storedColorBefore) setColorBefore(storedColorBefore);
    if (storedColorAfter) setColorAfter(storedColorAfter);
    if (storedColorCompareBefore) setColorCompareBefore(storedColorCompareBefore);
    if (storedColorCompareAfter) setColorCompareAfter(storedColorCompareAfter);
    if (storedcolorPercentChange) setcolorPercentChange(storedcolorPercentChange);
  }, []);

  // ใช้กับกราฟ
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lastph, response] = await Promise.all([
        GetfirstPH(),
        GetlistPH(),
      ]);

      if (response) {
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
          let curr = start.startOf(filterMode === "year" ? 'month' : 'day');
          const last = end.endOf(filterMode === "year" ? 'month' : 'day');

          while (curr.isBefore(last) || curr.isSame(last)) {
            arr.push(curr.format(filterMode === "year" ? "YYYY-MM" : "YYYY-MM-DD"));
            curr = curr.add(1, filterMode === "year" ? 'month' : 'day');
          }
          return arr;
        };

        let allDates: string[] = [];
        if (dateRange) {
          allDates = createDateRange(dateRange[0], dateRange[1]);
        } else {
          const allDatesInData = Object.keys(grouped).sort();
          if (allDatesInData.length > 0) {
            const latestDate = dayjs(allDatesInData[allDatesInData.length - 1]);
            let start;
            let end = latestDate;

            if (filterMode === "year") {
              start = latestDate.subtract(3, "year").startOf("month");
            } else if (filterMode === "month") {
              start = latestDate.startOf("month");
              end = latestDate.endOf("month");
            } else {
              start = latestDate.subtract(6, "day").startOf("day");
            }

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

        if (lastph.data.MiddleValue !== 0) {
          setMiddleStandard(lastph.data.MiddleValue);
          setMaxStandard(0);
          setMinStandard(0);
        } else {
          setMiddleStandard(0);
          setMaxStandard(lastph.data.MaxValue);
          setMinStandard(lastph.data.MinValue);
        }

        const percentageChangeData: { date: string; percent: number }[] = compare.map(item => {
          const rawPercent = item.before !== 0
            ? ((item.before - item.after) / item.before) * 100
            : 0;
          const percent = rawPercent < 0 ? 0 : rawPercent;
          return { date: item.date, percent };
        });

        setUnit(lastph.data.UnitName);
        setBeforeData(before);
        setAfterData(after);
        setCompareData(compare);
        setPercentChangeData(percentageChangeData);
      } else {
        setError("ไม่พบข้อมูล PH");
      }
    } catch (err) {
      console.error("Error fetching PH data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // เรียก fetchData เมื่อเปลี่ยน filterMode หรือ dateRange (เฉพาะกราฟ)
  useEffect(() => {
    fetchData();
  }, [dateRange, filterMode]);

  //ใช้กับตาราง
  const loadPHTable = async () => {
    try {
      const response2 = await GetPHTABLE();
      if (!response2 || response2.length === 0) {
        setError("ไม่พบข้อมูล PH ของตาราง");
        return;
      }

      const processedData = response2.map((item: any) => {
        const dt = dayjs(item.date);
        return {
          ...item,
          dateOnly: dt.format("DD-MM-YYYY"),
          timeOnly: dt.format("HH:mm:ss"),
          before_note: item.before_note || '',
          after_note: item.after_note || '',
        };
      });

      processedData.sort((a: any, b: any) =>
        dayjs(b.date).diff(dayjs(a.date))
      );

      setData(processedData);
    } catch (err) {
      console.error("Error fetching PHTABLE data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล PH");
    }
  };

  // โหลดครั้งแรก
  useEffect(() => {
    loadPHTable();
  }, []);

  useEffect(() => {
    const loadStatus = async () => {
      const data = await ListStatus();
      if (data) {
        setStatusOptions(data);
      } else {
        console.error("Failed to load status options");
      }
    };

    loadStatus();
  }, []);

  //ใช้กับกราฟ
  const getChartOptions = (
    categories: string[],
    chartType: 'line' | 'bar',
    isYearMode = false,
    dataSeries: number[],
    enableZoom = false, //ใช้บอกว่ากราฟนี้จะเปิดการซูมไหม
    isPercentChart = false //ใช้บอกว่าคือกราฟประสิทธิภาพไหม
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
        id: "ph-chart",
        toolbar: { show: true },
        zoom: { enabled: enableZoom, type: 'x', autoScaleYaxis: true },
        fontFamily: "Prompt, 'Prompt', sans-serif",
      },
      annotations: {
        yaxis: isPercentChart
          ? []   //  ถ้าเป็นกราฟเปอร์เซ็นต์ จะไม่มีเส้นมาตรฐานเลย
          : (isStandardRange
            ? [
              {
                y: minstandard ?? 0,
                borderWidth: 1.5,
                strokeDashArray: 6,
                borderColor: "rgba(255, 163, 24, 0.77)",
                label: { text: `มาตรฐานต่ำสุด ${minstandard ?? 0}`, style: { background: "rgba(255, 163, 24, 0.77)", color: "#fff" } },
              },
              {
                y: maxstandard ?? 0,
                borderWidth: 1.5,
                strokeDashArray: 6,
                borderColor: "rgba(255, 163, 24, 0.77)",
                label: { text: `มาตรฐานสูงสุด ${maxstandard ?? 0}`, style: { background: "rgba(255, 163, 24, 0.77)", color: "#fff" } },
              },
            ]
            : middlestandard !== undefined && middlestandard !== 0
              ? [
                {
                  y: middlestandard,
                  borderColor: "rgba(255, 163, 24, 0.77)",
                  borderWidth: 1.5,
                  strokeDashArray: 6,
                  label: { text: `มาตรฐาน ${middlestandard}`, style: { background: "rgba(255, 163, 24, 0.77)", color: "#fff" } },
                },
              ]
              : []
          )
      },
      xaxis: {
        categories: categoriesFormatted,
        tickAmount: 6, // ให้แสดงประมาณ 6 จุดบนแกน X (ปรับได้ เช่น 4, 5)
        labels: {
          rotate: -45, // เอียงวันที่เล็กน้อยให้อ่านง่าย
          formatter: (value: string, _timestamp?: number) => {
            // ถ้าเป็น mode รายปี => แสดงเป็น เดือน ปี (เช่น ก.ค. 2568)
            if (filterMode === "year") {
              return value;
            }
            // ถ้าเป็น mode รายวัน => แสดงเฉพาะวัน/เดือนสั้น
            return dayjs(value).format("D MMM");
          },
        },
      },

      yaxis: {
        min: 0,
        max: isPercentChart ? 100 : adjustedMax,
        title: {
          text: isPercentChart ? "เปอร์เซ็น ( % )" : (unit || "mg/L"),
        },
        labels: {
          formatter: (value: number) => isPercentChart ? `${value.toFixed(2)}%` : value.toFixed(2)
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => isPercentChart ? `${val.toFixed(2)}%` : `${val.toFixed(2)} ${unit}`,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: chartType === "line" ? { show: true, curve: "smooth", width: 3 } : { show: false },
      markers: chartType === "line"
        ? {
          size: 4.5,
          shape: ["circle", "triangle"],
          hover: { sizeOffset: 3 },
        }
        : { size: 0 },

    };
  };
  const beforeSeries = [
    { name: "PH", data: beforeData.map(item => item.data), color: colorBefore }
  ];
  const afterSeries = [
    { name: "PH", data: afterData.map(item => item.data), color: colorAfter }
  ];
  const compareSeries = [
    { name: "ก่อนบำบัด", data: compareData.map(item => item.before), color: colorCompareBefore },
    { name: "หลังบำบัด", data: compareData.map(item => item.after), color: colorCompareAfter },
  ];
  const combinedCompareData = [
    ...compareSeries[0].data,
    ...compareSeries[1].data,
  ];
  const percentChangeSeries = [
    {
      name: "เปอร์เซ็นต์การเปลี่ยนแปลง",
      data: percentChangeData.map(item => item.percent),
      color: colorPercentChange,
    },
  ];
  //ใช้กับกราฟ
  const openModal = (type: "before" | "after" | "compare" | "percentChange") => {
    setModalGraphType(type);
    setModalVisible(true);
  };
  //ใช้กับกราฟ
  const closeModal = () => {
    setModalVisible(false);
    setModalGraphType(null);
  };

  //ใช้กับกราฟ --- ฟังก์ชันช่วยแปลงชื่อเดือนไทย ---
  const monthShortNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const monthIndex = parseInt(month, 10) - 1;
    const thaiYear = parseInt(year) + 543;
    return `${monthShortNames[monthIndex]} ${thaiYear}`;
  };

  //ใช้กับตาราง
  const columns: ColumnsType<any> = [
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      width: 140,
    },
    {
      title: 'หน่วยที่วัด',
      dataIndex: 'unit',
      key: 'unit',
      width: 125,
      render: (unit: string) => unit || '-',
    },
    {
      title: 'ค่าก่อนเข้าระบบบำบัด',
      dataIndex: 'before_value',
      key: 'before_value',
      width: 120,
      render: (val: number | null) => val != null ? val.toFixed(2) : '-',
    },
    {
      title: 'ค่าหลังเข้าระบบบำบัด',
      dataIndex: 'after_value',
      key: 'after_value',
      width: 120,
      render: (afterValue: number | null, record: any) => {
        if (afterValue == null) return '-';
        const before = record.before_value;
        let arrow = null;
        const iconStyle = { fontWeight: 'bold', fontSize: '17px' };
        if (before != null) {
          if (afterValue < before) arrow = <span style={{ ...iconStyle, color: '#EE404C' }}> ↓</span>;
          else if (afterValue > before) arrow = <span style={{ ...iconStyle, color: '#14C18B' }}> ↑</span>;
        }
        return <span>{afterValue.toFixed(2)}{arrow}</span>;
      },
    },
    {
      title: <>ประสิทธิภาพ<br />(%)</>,
      key: "efficiency",
      width: 80,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Select
            allowClear
            placeholder="เลือกเงื่อนไข"
            value={selectedKeys[0]}
            onChange={(v) => { setSelectedKeys(v ? [v] : []); confirm({ closeDropdown: false }); }}
            style={{ width: 180 }}
            options={[
              { label: "มากกว่า 50%", value: "gt" },
              { label: "น้อยกว่าหรือเท่ากับ 50%", value: "lte" },
            ]}
          />
        </div>
      ),
      filterIcon: (f) => (
        <SearchOutlined style={{
          color: f ? "#007b8a" : "#6e6e76",
          fontSize: 20, fontWeight: f ? "bold" : undefined,
          borderRadius: "50%", padding: 5,
          background: f ? "#fff" : undefined,
          boxShadow: f ? "0 0 8px 4px rgba(255,255,255,1)" : undefined,
        }} />
      ),
      onFilter: (v, r) => {
        const eff = Number(r.efficiency ?? -1);
        return v === "gt" ? eff > 50 : v === "lte" ? eff <= 50 : true;
      },
      render: (_, r) => {
        const eff = Number(r.efficiency);
        return isNaN(eff) ? "-" : Math.max(eff, 0).toFixed(2);
      },
    },
    {
      title: 'ค่ามาตรฐาน',
      dataIndex: 'standard_value',
      key: 'standard_value',
      width: 160,
      render: (val: number) => val ?? '-',
    },
    {
      title: "สถานะ",
      key: "status",
      width: 200,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8, width: 190 }}>
          <Select
            allowClear
            placeholder="เลือกสถานะ"
            value={selectedKeys[0]}
            onChange={(value) => {
              setSelectedKeys(value ? [value] : []);
              confirm({ closeDropdown: false });
            }}
            style={{ width: "100%" }}
            options={statusOptions.map((item) => ({
              label: item.StatusName,
              value: item.StatusName,
            }))}
            autoFocus
            size="middle"
          />
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined
          style={{
            color: filtered ? "#007b8a" : "#6e6e76",
            backgroundColor: filtered ? "#ffffffff" : undefined,
            fontSize: 20,
            fontWeight: filtered ? "bold" : undefined,
            borderRadius: 50,
            padding: 5,
            boxShadow: filtered
              ? "0 0 8px 4px rgba(255, 255, 255, 1)"
              : undefined,
          }}
        />
      ),
      onFilter: (value: any, record: any) => {
        if (!value) return true;
        return normalizeString(record.status ?? "") === normalizeString(value);
      },
      render: (_, record) => {
        const statusName = record.status;

        if (!statusName) {
          return (
            <span className="status-badge status-none">
              <QuestionCircleFilled style={{ fontSize: 20 }} />
              ไม่มีข้อมูล
            </span>
          );
        }

        if (statusName.includes("ไม่ผ่าน")) {
          return (
            <span className="status-badge status-high">
              <CloseCircleFilled style={{ marginBottom: -4, fontSize: 18 }} />
              {statusName}
            </span>
          );
        }

        if (statusName.includes("ผ่าน")) {
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
      title: 'จัดการข้อมูล',
      key: 'action',
      className: 'darker-column',
      width: 120,
      render: (_: any, record: any) => {
        // console.log('record:', record);
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
                onClick={() => handleDelete([record.before_id, record.after_id])}
              >
                <DeleteOutlined />
              </button>
            </Tooltip>
          </div>
        );
      }
    }
  ];

  //ใช้กับตาราง
  const handleEdit = async (ids: (number | undefined)[]) => {
    console.log("IDs:", ids);

    // กรองเอาเฉพาะ id ที่ไม่ undefined และไม่ null
    const filteredIds = ids.filter((id): id is number => typeof id === 'number');

    if (filteredIds.length === 0) {
      message.error("ไม่พบ ID สำหรับแก้ไข");
      return;
    }

    try {
      const responses = await Promise.all(filteredIds.map((id) => GetPHbyID(id)));
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
      console.error("Error fetching PH data:", error);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };

  //ใช้กับตาราง
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
          await DeleteAllPHRecordsByDate(firstId);
          message.success("ลบข้อมูลสำเร็จ");
          await fetchData();
          await loadPHTable();
        } catch (error) {
          message.error("ลบข้อมูลไม่สำเร็จ");
        }
      },
    });
  };

  //ใช้กับตาราง
  const showModal = () => {
    setEditRecord(null);
    setIsModalVisible(true);
  };

  //ใช้กับตาราง ฟังก์ชันยกเลิก modal 
  const handleAddModalCancel = () => setIsModalVisible(false);
  const handleEditModalCancel = () => setIsEditModalVisible(false);


  return (
    <div>
      <div className="ph-title-header">
        <h1>PH-Central</h1>
        <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดค่า PH น้ำเสีย</p>
      </div>
      <div style={{ padding: "30px" }}>
        <div className="ph-title">
          <div>
            <h1
              className="ph-title-text"
              onClick={() => navigate(-1)}
              style={{ cursor: 'pointer' }}
            >
              <LeftOutlined className="ph-back-icon" />
              PH-GRAPH
            </h1>
          </div>
          <div className="ph-select-date">
            <div>
              <Select

                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  setDateRange(null); // เคลียร์ช่วงวันที่เดิม
                }}
                className="ph-select-filter"
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
                  locale={th_TH}
                  allowClear={false}
                  format={(value) => value ? `${value.date()} ${value.locale('th').format('MMMM')} ${value.year() + 543}` : ''}
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
                  locale={th_TH}
                  placeholder="เลือกเดือน"
                  style={{ width: 150 }}
                  allowClear={false}
                  value={dateRange ? dayjs(dateRange[0]) : null}
                  format={(value) => value ? `${value.locale('th').format('MMMM')} ${value.year() + 543}` : ''}
                />
              )}
              {filterMode === "year" && (
                <DatePicker.RangePicker
                  picker="year"
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      const start = dates[0].startOf('year');
                      const end = dates[1].endOf('year');
                      setDateRange([start, end]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                  locale={th_TH}
                  placeholder={["ปีเริ่มต้น", "ปีสิ้นสุด"]}
                  style={{ width: 300 }}
                  allowClear={false}
                  value={dateRange}
                  format={(value) => value ? `${value.year() + 543}` : ''}
                />
              )}
            </div>
          </div>
        </div>
        <div className="ph-graph-container">
          {/* ตารางน้ำก่อนบำบัดนะจ๊ะ */}
          <div className="ph-graph-card">
            <div className="ph-head-graph-card">
              <div className="width25">
                <h2 className="ph-head-graph-card-text">น้ำก่อนบำบัด</h2>
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
                <Button className="expand-chat" onClick={() => openModal("before")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="ph-right-select-graph">
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
                beforeSeries[0]?.data || []
              )}
              series={beforeSeries}
              type={chartTypeBefore}
              height={350}
            />
          </div>

          <div className="ph-graph-card">
            <div className="ph-head-graph-card">
              <div className="width25">
                <h2 className="ph-head-graph-card-text">น้ำหลังบำบัด</h2>
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
                <Button className="expand-chat" onClick={() => openModal("after")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="ph-right-select-graph">
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
          <div className="ph-graph-card">
            <div className="ph-head-graph-card">
              <div className="width40">
                <h2 className="ph-head-graph-card-text" >เปรียบเทียบก่อน-หลังบำบัด</h2>
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
                <Button className="expand-chat" onClick={() => openModal("compare")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="ph-right-select-graph">
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
          <div className="ph-graph-card">
            <div className="ph-head-graph-card">
              <div className="width25">
                <h2 className="ph-head-graph-card-text" >ประสิทธิภาพ</h2>
              </div>
              <div>
                <ColorPicker
                  value={colorPercentChange}
                  onChange={(color: Color) => {
                    const hex = color.toHexString();
                    setcolorPercentChange(hex);
                    localStorage.setItem('colorPercentChange', hex);
                  }}
                />
              </div>
            </div>
            <div className="ph-right-select-graph">
              <Select
                value={chartpercentChange}
                onChange={val => setpercentChange(val)}
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
              options={getChartOptions(
                percentChangeData.map(item => item.date),
                "line",
                filterMode === "year",
                percentChangeSeries[0].data,
                false,
                true
              )}
              series={percentChangeSeries}
              type={chartpercentChange}
              height={350}
            />
          </div>
        </div>
        <div className="ph-header-vis">
          <div className="ph-title-search-vis">
            <h1 className="ph-title-text-vis">PH DATA</h1>
            <div>
              <div className="ph-search-box">
                <Input
                  placeholder="ค้นหา"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  prefix={<SearchOutlined />}
                  className="ph-search-input"
                />
              </div>
            </div>
          </div>
          <div className="ph-btn-container">
            <button className="ph-add-btn" onClick={showModal}>เพิ่มข้อมูลใหม่</button>
          </div>
        </div>

        <div className="ph-table-data">
          <h1 className="ph-title-text-table">ตารางรายงานผลการดำเนินงาน</h1>
          <Table
            className="ph-table-data"
            columns={columns.map((col) => ({ ...col, align: 'center' }))}
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

        <Modal
          title={"เพิ่มข้อมูล PH ใหม่"}
          open={isModalVisible}
          footer={null}
          width={1100}
          destroyOnClose
          closable={false}
          centered
        >
          <PHCentralForm onCancel={handleAddModalCancel}
            onSuccess={async () => {
              await fetchData();
              await loadPHTable();
            }} />
        </Modal>

        <Modal
          title="แก้ไขข้อมูล PH"
          open={isEditModalVisible}
          footer={null}
          width={1100}
          closable={false}
          destroyOnClose
          centered
          onCancel={handleEditModalCancel}
        >
          {editingRecord && (
            <UpdatePHCentralForm
              initialValues={editingRecord}
              onSuccess={() => {
                setTimeout(async () => {
                  setIsEditModalVisible(false);
                  setEditRecord(null);
                  loadPHTable();
                  await fetchData();
                }, 500);
              }}
              onCancel={handleEditModalCancel}
            />
          )}
        </Modal>

        <Modal
          visible={modalVisible}
          onCancel={closeModal}
          footer={null}
          className="ph-custom-modal"
          centered
          destroyOnClose
          maskClosable={true}
        >
          {modalGraphType === "before" && (
            <div className="ph-chat-modal" >
              <div className="ph-head-graph-card">
                <div className="ph-width25">
                  <h2 className="ph-head-graph-card-text">น้ำก่อนบำบัด</h2>
                </div>
              </div>
              <div className="ph-right-select-graph">
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
              <div className="ph-chart-container">
                <ApexChart
                  key={chartTypeBefore}
                  options={getChartOptions(
                    beforeData.map(item => item.date),
                    chartTypeBefore,
                    filterMode === "year",
                    beforeSeries[0]?.data || [],
                    true
                  )}
                  series={beforeSeries}
                  type={chartTypeBefore}
                  height="100%"
                />
              </div>
            </div>
          )}
          {modalGraphType === "after" && (
            <div className="ph-chat-modal">
              <div className="ph-head-graph-card">
                <div className="ph-width25">
                  <h2 className="ph-head-graph-card-text">น้ำหลังบำบัด</h2>
                </div>
              </div>
              <div className="ph-right-select-graph">
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
              <div className="ph-chart-container">
                <ApexChart
                  key={chartTypeAfter}
                  options={getChartOptions(
                    afterData.map(item => item.date),
                    chartTypeAfter,
                    filterMode === "year",
                    afterSeries[0]?.data || [],
                    true
                  )}
                  series={afterSeries}
                  type={chartTypeAfter}
                  height="100%"
                />
              </div>
            </div>
          )}
          {modalGraphType === "compare" && (
            <div className="ph-chat-modal">
              <div className="ph-head-graph-card" >
                <div className="ph-width40">
                  <h2 className="ph-head-graph-card-text" >เปรียบเทียบก่อน-หลังบำบัด</h2>
                </div>
              </div>
              <div className="ph-right-select-graph">
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
              <div className="ph-chart-container">
                <ApexChart
                  key={chartTypeCompare}
                  options={getChartOptions(
                    compareData.map(item => item.date),
                    chartTypeCompare,
                    filterMode === "year",
                    combinedCompareData,
                    true
                  )}
                  series={compareSeries}
                  type={chartTypeCompare}
                  height="100%"
                />
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
};

export default PHdataviz;
