//ใช้ทั้งกราฟและตาราง
import React, { useEffect, useState } from "react";
import { Select, DatePicker, Modal, message, Tooltip, Button } from "antd";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled, CloseCircleFilled, CheckCircleFilled, QuestionCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import './TKNdataviz.css';
import dayjs, { Dayjs } from "dayjs";
import { GetlistTKN, GetfirstTKN, GetBeforeAfterTKN } from "../../../../../services/wastewaterServices/tkn";
import BeforeWater from "../../../../../assets/mineral.png"
import AftereWater from "../../../../../assets/rain.png"
import Efficiency from "../../../../../assets/productivity.png"

// ใช้กับกราฟ
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { BarChart3, LineChart, Maximize2 } from "lucide-react";

//ใช้กับตาราง
import Table, { ColumnsType } from "antd/es/table";
import { GetTKNbyID, GetTKNTABLE, DeleteAllTKNRecordsByDate } from "../../../../../services/wastewaterServices/tkn";
import UpdateTKNCentralForm from "../../../data-management/wastewater/TKNcenter/updateTKNcenter";
import TKNCentralForm from "../../../data-management/wastewater/TKNcenter/TKNcenter"
import { ListStatus } from '../../../../../services/index';
import { ListStatusInterface } from '../../../../../interface/IStatus';

const normalizeString = (str: any) =>
  String(str).normalize("NFC").trim().toLowerCase();

//ใช้ตั้งค่าวันที่ให้เป็นภาษาไทย
import 'dayjs/locale/th';
import th_TH from 'antd/es/date-picker/locale/th_TH';
dayjs.locale('th');
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const TKNdataviz: React.FC = () => {
  const navigate = useNavigate();

  //ใช้ทั้งกราฟและตาราง
  const [data, setData] = useState<any[]>([]); // ดึง TKN ทั้งหมด
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterMode, setFilterMode] = useState<"dateRange" | "month" | "year">("year");
  const [BeforeAfter, setBeforeAfter] = useState<{ before: any; after: any } | null>(null);

  //ใช้กับกราฟ
  const [chartTypeBefore, setChartTypeBefore] = useState<'bar' | 'line'>('line');
  const [chartTypeAfter, setChartTypeAfter] = useState<'bar' | 'line'>('line');
  const [chartTypeCompare, setChartTypeCompare] = useState<'bar' | 'line'>('line');
  const [chartpercentChange, setpercentChange] = useState<'bar' | 'line'>('line');
  const [compareData, setCompareData] = useState<{ date: string; before: number; after: number }[]>([]);
  const [beforeData, setBeforeData] = useState<{ unit: string; date: string; data: number }[]>([]);
  const [afterData, setAfterData] = useState<{ unit: string; date: string; data: number }[]>([]);
  const [colorBefore, setColorBefore] = useState<string>("#2abdbf");
  const [colorAfter, setColorAfter] = useState<string>("#1a4b57");
  const [colorCompareBefore, setColorCompareBefore] = useState<string>("#2abdbf");
  const [colorCompareAfter, setColorCompareAfter] = useState<string>("#1a4b57");
  const [unit, setUnit] = useState<string>("-");
  const [middlestandard, setMiddleStandard] = useState<number | undefined>(undefined);
  const [minstandard, setMinStandard] = useState<number | undefined>(undefined);
  const [maxstandard, setMaxStandard] = useState<number | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalGraphType, setModalGraphType] = useState<"before" | "after" | "compare" | "percentChange" | null>(null);
  const [percentChangeData, setPercentChangeData] = useState<{ date: string; percent: number }[]>([]);
  const [colorPercentChange, setcolorPercentChange] = useState<string>("#FF6F61");

  //ใช้กับตาราง
  const [search] = useState(""); //setSearch
  const [isModalVisible, setIsModalVisible] = useState(false);  // --- Modal สำหรับเพิ่ม/แก้ไข TKN (ถ้าต้องการใช้) ---
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditRecord] = useState<any>(null);
  const { confirm } = Modal;
  const [statusOptions, setStatusOptions] = useState<ListStatusInterface[]>([]);
  const [tableFilterMode, setTableFilterMode] = useState<"dateRange" | "month" | "year">("year");
  const [tableDateRange, setTableDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [efficiencyFilter, setEfficiencyFilter] = useState<string | null>(null);
  const totalTasks = data.length;
  const doneTasks = data.filter((d: any) => {
    const status = (d.status ?? "").trim(); return status.includes("ผ่าน") && !status.includes("ไม่ผ่าน");
  }).length;
  const inProgressTasks = data.filter((d: any) => normalizeString(d.status ?? "").includes(normalizeString("ไม่ผ่าน"))).length;

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
      const [lasttkn, response, tknRes] = await Promise.all([
        GetfirstTKN(),
        GetlistTKN(),
        GetBeforeAfterTKN(),
      ]);

      if (response) {
        const grouped: Record<string, { before: number[]; after: number[]; beforeUnit?: string; afterUnit?: string }> = {};
        response.data.forEach((item: any) => {
          const key = filterMode === "year"
            ? dayjs(item.Date).format("YYYY-MM")
            : dayjs(item.Date).format("YYYY-MM-DD");

          if (!grouped[key]) grouped[key] = { before: [], after: [], beforeUnit: "", afterUnit: "" };

          if (item.BeforeAfterTreatmentID === 1) {
            grouped[key].before.push(item.Data);
            grouped[key].beforeUnit = item.UnitName;
          } else if (item.BeforeAfterTreatmentID === 2) {
            grouped[key].after.push(item.Data);
            grouped[key].afterUnit = item.UnitName;
          }
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

        //ออกเฉพาะวันที่มีข้อมูล
        let allDates: string[] = [];

        if (dateRange) {
          if (filterMode === "year") {
            // กรองเดือนที่มีข้อมูลและอยู่ในช่วงปีที่เลือก
            const startYear = dateRange[0].year();
            const endYear = dateRange[1].year();

            allDates = Object.keys(grouped)
              .filter(monthStr => {
                const year = dayjs(monthStr).year();
                return year >= startYear && year <= endYear;
              })
              .sort();
          } else if (filterMode === "month") {
            // สร้างช่วงเดือนเต็มตามช่วง dateRange ที่เลือก (จะใช้ createDateRange)
            allDates = createDateRange(dateRange[0], dateRange[1]);
          } else {
            // กรองช่วงวัน (dateRange) ใช้ createDateRange
            allDates = createDateRange(dateRange[0], dateRange[1]);
          }
        } else {
          // กรณีไม่ได้เลือก dateRange เอง
          if (filterMode === "year") {
            const monthsWithData = Object.keys(grouped).sort();
            if (monthsWithData.length > 0) {
              const latestMonth = dayjs(monthsWithData[monthsWithData.length - 1]);
              const startLimit = latestMonth.subtract(3, "year").startOf("month");

              allDates = monthsWithData.filter(monthStr => {
                const monthDate = dayjs(monthStr);
                return monthDate.isSame(startLimit) || monthDate.isAfter(startLimit);
              });
            } else {
              allDates = [];
            }
          } else if (filterMode === "month") {
            const allDatesInData = Object.keys(grouped).sort();
            if (allDatesInData.length > 0) {
              const latestDate = dayjs(allDatesInData[allDatesInData.length - 1]);
              const start = latestDate.startOf("month");
              const end = latestDate.endOf("month");
              allDates = createDateRange(start, end);
            }
          } else {
            const allDatesInData = Object.keys(grouped).sort();
            if (allDatesInData.length > 0) {
              const latestDate = dayjs(allDatesInData[allDatesInData.length - 1]);
              const start = latestDate.subtract(6, "day").startOf("day");
              const end = latestDate.endOf("day");
              allDates = createDateRange(start, end);
            }
          }
        }

        const before: { date: string; data: number; unit: string; }[] = [];
        const after: { date: string; data: number; unit: string; }[] = [];
        const compare: { date: string; before: number; after: number }[] = [];

        allDates.forEach(date => {
          const values = grouped[date];
          const avgBefore = values?.before.length
            ? values.before.reduce((a, b) => a + b, 0) / values.before.length
            : 0;
          const avgAfter = values?.after.length
            ? values.after.reduce((a, b) => a + b, 0) / values.after.length
            : 0;
          before.push({ date, data: avgBefore, unit: values?.beforeUnit || "" });
          after.push({ date, data: avgAfter, unit: values?.afterUnit || "" });
          compare.push({ date, before: avgBefore, after: avgAfter });
        });
        // console.log(lasttkn.data)
        if (lasttkn.data.MiddleValue !== -1) {
          setMiddleStandard(lasttkn.data.MiddleValue);
          setMaxStandard(-1); //แก้ให้เส้นมาตรฐานอัพเดท
          setMinStandard(-1); //แก้ให้เส้นมาตรฐานอัพเดท
        } else {
          setMiddleStandard(-1); //แก้ให้เส้นมาตรฐานอัพเดท
          setMaxStandard(lasttkn.data.MaxValue);
          setMinStandard(lasttkn.data.MinValue);
        }

        const percentageChangeData: { date: string; percent: number }[] = compare.map(item => {
          const rawPercent = item.before !== 0
            ? ((item.before - item.after) / item.before) * 100
            : 0;
          const percent = rawPercent < 0 ? 0 : rawPercent;
          return { date: item.date, percent };
        });
        console.log(response.data);
        setUnit(lasttkn.data.UnitName);
        setBeforeData(before);
        setAfterData(after);
        setCompareData(compare);
        setPercentChangeData(percentageChangeData);
        // เซ็ตข้อมูลจาก GetBeforeAfterTKN
        if (!tknRes || !tknRes.data || tknRes.data.length === 0) {
          setBeforeAfter(null); // ✅ ตรงกับ type
          setError("ไม่พบข้อมูล Before/After TKN");
        } else {
          setBeforeAfter(tknRes.data);
        }
      } else {
        setError("ไม่พบข้อมูล TKN");
      }
    } catch (err) {
      console.error("Error fetching TKN data:", err);
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
  const loadTKNTable = async () => {
    try {
      const response2 = await GetTKNTABLE();
      if (!response2 || response2.length === 0) {
        setError("ไม่พบข้อมูล TKN ของตาราง");
        setData([])//แก้ลบข้อมูลสุดท้ายแล้วตารางไม่รีเฟรช
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

      setData(processedData); // ✅ ใช้ชื่อเดิมเหมือนคุณเลย
    } catch (err) {
      console.error("Error fetching TKNTABLE data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล TKN");
    }
  };

  // โหลดครั้งแรก
  useEffect(() => {
    loadTKNTable();
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

    const standardCeil = middlestandard !== undefined && middlestandard !== -1 ? middlestandard : maxstandard ?? -1;
    const adjustedMax = Math.max(maxValueInData, standardCeil) * 1.1;

    return {
      chart: {
        id: "tkn-chart",
        toolbar: { show: true },
        zoom: { enabled: enableZoom, type: 'x', autoScaleYaxis: true },
        fontFamily: "Prompt, 'Prompt', sans-serif",
      },
      annotations: {
        yaxis: isPercentChart
          ? []   //  ถ้าเป็นกราฟเปอร์เซ็นต์ จะไม่มีเส้นมาตรฐานเลย
          : (
            // ✅ เงื่อนไขใหม่
            (middlestandard === 0 && minstandard === -1 && maxstandard === -1)
              ? [
                {
                  y: 0,
                  borderColor: "#FF6F61",
                  borderWidth: 1.5,
                  strokeDashArray: 6,
                  label: { text: "ไม่พบ", style: { background: "#ff6e61d4", color: "#fff" } },
                },
              ]
              : (isStandardRange
                ? [
                  {
                    y: minstandard ?? 0,
                    borderWidth: 1.5,
                    strokeDashArray: 6,
                    borderColor: "rgba(255, 163, 24, 0.77)",
                    label: { text: `มาตรฐานต่ำสุด ${minstandard.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 0}`, style: { background: "rgba(255, 163, 24, 0.77)", color: "#fff" } },
                  },
                  {
                    y: maxstandard ?? 0,
                    borderWidth: 1.5,
                    strokeDashArray: 6,
                    borderColor: "#035303ff",
                    label: { text: `มาตรฐานสูงสุด ${maxstandard.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 0}`, style: { background: "rgba(3, 83, 3, 0.6)", color: "#fff" } },
                  },
                ]
                : middlestandard !== undefined && middlestandard !== -1
                  ? [
                    {
                      y: middlestandard,
                      borderColor: "#FF6F61",
                      borderWidth: 1.5,
                      strokeDashArray: 6,
                      label: { text: `มาตรฐาน ${middlestandard.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, style: { background: "#FF6F61", color: "#fff" } },
                    },
                  ]
                  : []
              )
          )
      },
      xaxis: {
        categories: categoriesFormatted,
        title: { text: "วัน/เดือน/ปี" },
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
        tooltip: {
          enabled: false, // << ปิด tooltip ที่แกน X
        },
      },
      yaxis: {
        min: 0,
        max: isPercentChart ? 100 : adjustedMax,
        title: {
          text: isPercentChart ? "เปอร์เซ็น ( % )" : (unit || "mg/L"),
        },
        labels: {
          formatter: (value: number) => isPercentChart ? `${value.toFixed(2)}%` : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        },
      },
      tooltip: {
        y: {
          formatter: (val: number, opts) => {
            const seriesName = opts.w.config.series[opts.seriesIndex]?.name || '';
            const seriesIndex = opts.seriesIndex;
            const dataPointIndex = opts.dataPointIndex;

            console.log('seriesIndex:', seriesIndex, 'seriesName:', seriesName, 'val:', val);

            if (isPercentChart) {
              return `${val.toFixed(2)}%`;
            }

            // กรณี beforeSeries หรือ compareSeries "ก่อนบำบัด"
            if ((seriesName === "ก่อนบำบัด" || seriesName === "TKN") && beforeData && beforeData.length > dataPointIndex) {
              const unit = beforeData[dataPointIndex]?.unit || 'ไม่มีการตรวจวัดก่อนบำบัด';
              if (unit === 'ไม่มีการตรวจวัดก่อนบำบัด') return unit;
              return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
            }

            // กรณี afterSeries หรือ compareSeries "หลังบำบัด"
            if ((seriesName === "หลังบำบัด" || seriesName === "TKN") && afterData && afterData.length > dataPointIndex) {
              const unit = afterData[dataPointIndex]?.unit || 'ไม่มีการตรวจวัดหลังบำบัด';
              if (unit === 'ไม่มีการตรวจวัดหลังบำบัด') return unit;
              return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
            }

            // กรณีอื่น ๆ
            return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }

        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: { show: true,showForSingleSeries: true, position: 'top', horizontalAlign: 'center' },
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
    { name: "ก่อนบำบัด", data: beforeData.map(item => item.data), color: colorBefore }
  ];
  const afterSeries = [
    { name: "หลังบำบัด", data: afterData.map(item => item.data), color: colorAfter }
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
      name: "ประสิทธิภาพ",
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
      sorter: (a, b) => {
        const da = dayjs(a.date);
        const db = dayjs(b.date);
        if (!da.isValid() && !db.isValid()) return 0;
        if (!da.isValid()) return -1;
        if (!db.isValid()) return 1;
        return da.valueOf() - db.valueOf(); // เรียงจากเก่าไปใหม่
      },
      // defaultSortOrder: 'descend', // ตั้งค่าให้เริ่มต้นเรียงจากใหม่ไปเก่า
      render: (date: string) => {
        if (!date) return '-';
        const d = dayjs(date);
        if (!d.isValid()) return '-';
        return d.format('DD MMM ') + (d.year() + 543);
      }
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
      render: (val: number | null) => val != null ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
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
        return <span>{afterValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{arrow}</span>;
      },
    },
    {
      title: <>ประสิทธิภาพ<br />(%)</>,
      key: "efficiency",
      width: 80,
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
      render: (val: string | number | null | undefined) => {
        if (!val) return '-';
        // ถ้าเป็น string และมีขีด (-) ให้แยก
        if (typeof val === 'string' && val.includes('-')) {
          return val
            .split('-')
            .map(v => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
            .join(' - ');
        }
        // ถ้าเป็นตัวเลขปกติ
        return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      },
    },
    {
      title: "สถานะ",
      key: "status",
      width: 200,
      render: (_, record) => {
        const statusName = record.status;
        if (!statusName) {
          return (
            <span className="tkn-status-badge status-none">
              <QuestionCircleFilled style={{ fontSize: 20 }} />
              ไม่มีข้อมูล
            </span>
          );
        }
        if (statusName.includes("ไม่ผ่าน")) {
          return (
            <span className="tkn-status-badge status-high">
              <CloseCircleFilled style={{ marginBottom: -4, fontSize: 18 }} />
              {statusName}
            </span>
          );
        }
        if (statusName.includes("ผ่าน")) {
          return (
            <span className="tkn-status-badge status-good">
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
      width: 120,
      render: (_: any, record: any) => {
        // console.log('record:', record);
        return (
          <div className="tkn-action-buttons">
            <Tooltip title="แก้ไข">
              <button
                className="tkn-circle-btn tkn-edit-btn"
                onClick={() => handleEdit([record.before_id, record.after_id])}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title="ลบ">
              <button
                className="tkn-circle-btn tkn-delete-btn"
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
      const responses = await Promise.all(filteredIds.map((id) => GetTKNbyID(id)));
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
      console.error("Error fetching TKN data:", error);
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
          await DeleteAllTKNRecordsByDate(firstId);
          message.success("ลบข้อมูลสำเร็จ");
          await fetchData();
          await loadTKNTable();
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
      <div className="tkn-title-header">
        <div>
          <h1>TKN Central</h1>
          <p>ค่าไนโตรเจนรวมในรูปสารอินทรีย์และแอมโมเนีย</p>
        </div>
        <div className="tkn-card">
          <img src={BeforeWater} alt="Before Water" className="tkn-photo" />
          <div>
            <h4>น้ำก่อนบำบัดล่าสุด</h4>
            <div className="tkn-main">
              <span>{BeforeAfter?.before.Data !== null && BeforeAfter?.before.Data !== undefined ? (<><span className="tkn-value">{BeforeAfter.before.Data.toLocaleString()}</span>{" "}{BeforeAfter.before.UnitName || ""}</>) : "-"}</span>
            </div>
            {BeforeAfter ? (
              <p>
                มาตรฐาน{" "}
                <span>
                  {(BeforeAfter.before.MiddleValue !== null && BeforeAfter.before.MiddleValue !== -1) || (BeforeAfter.before.MinValue !== null && BeforeAfter.before.MinValue !== -1) || (BeforeAfter.before.MaxValue !== null && BeforeAfter.before.MaxValue !== -1) || (BeforeAfter.before.UnitName && BeforeAfter.before.UnitName.trim() !== "")
                    ? (BeforeAfter.before.MiddleValue !== null && BeforeAfter.before.MiddleValue !== -1
                      ? BeforeAfter.before.MiddleValue.toLocaleString() : `${(BeforeAfter.before.MinValue !== null && BeforeAfter.before.MinValue !== -1 ? BeforeAfter.before.MinValue.toLocaleString() : "-")} - ${(BeforeAfter.before.MaxValue !== null && BeforeAfter.before.MaxValue !== -1 ? BeforeAfter.before.MaxValue.toLocaleString() : "-")}`) : "-"
                  }
                </span>{" "}
                {BeforeAfter.before.UnitName || ""}
              </p>
            ) : (
              <p>Loading...</p>
            )}
          </div>
          <img src={AftereWater} alt="After Water" className="tkn-photo" />
          <div>
            <h4>น้ำหลังบำบัดล่าสุด</h4>
            <div className="tkn-main">
              <span>{BeforeAfter?.after.Data !== null && BeforeAfter?.after.Data !== undefined ? (<><span className="tkn-value">{BeforeAfter.after.Data.toLocaleString()}</span>{" "}{BeforeAfter.after.UnitName || ""}</>) : "-"}</span>
              <span className="tkn-change">
                {(() => {
                  if (BeforeAfter?.after.Data != null && BeforeAfter?.before.Data != null) {
                    const diff = BeforeAfter.after.Data - BeforeAfter.before.Data;
                    const arrowStyle = { fontWeight: 'bold', fontSize: '17px', marginLeft: 4 };
                    return (<> {diff >= 0 ? '+' : ''}{diff.toFixed(2)}{diff > 0 && <span style={{ ...arrowStyle, color: '#14C18B' }}>↑</span>}{diff < 0 && <span style={{ ...arrowStyle, color: '#EE404C' }}>↓</span>}{diff === 0 && null}</>);
                  } return '-';
                })()}
              </span>
            </div>
            {BeforeAfter ? (
              <p>
                มาตรฐาน{" "}
                <span>
                  {
                    (BeforeAfter.after.MiddleValue !== null && BeforeAfter.after.MiddleValue !== -1) || (BeforeAfter.after.MinValue !== null && BeforeAfter.after.MinValue !== -1) || (BeforeAfter.after.MaxValue !== null && BeforeAfter.after.MaxValue !== -1) || (BeforeAfter.after.UnitName && BeforeAfter.after.UnitName.trim() !== "")
                      ? (BeforeAfter.after.MiddleValue !== null && BeforeAfter.after.MiddleValue !== -1
                        ? BeforeAfter.after.MiddleValue.toLocaleString() : `${(BeforeAfter.after.MinValue !== null && BeforeAfter.after.MinValue !== -1 ? BeforeAfter.after.MinValue.toLocaleString() : "-")} - ${(BeforeAfter.after.MaxValue !== null && BeforeAfter.after.MaxValue !== -1 ? BeforeAfter.after.MaxValue.toLocaleString() : "-")}`)
                      : "-"
                  }
                </span>{" "}
                {BeforeAfter.after.UnitName || ""}
              </p>
            ) : (
              <p>Loading...</p>
            )}
          </div>
          <img src={Efficiency} alt="Before Water" className="tkn-photo" />
          <div>
            <h4>ประสิทธิภาพล่าสุด</h4>
            <div className="tkn-main">
              <span>
                {BeforeAfter?.before.Data !== null && BeforeAfter?.before.Data !== undefined &&
                  BeforeAfter.before.Data !== 0 &&
                  BeforeAfter?.after.Data !== null && BeforeAfter?.after.Data !== undefined
                  ? (
                    <>
                      <span className="tkn-value">
                        {Math.max(
                          0,
                          ((BeforeAfter.before.Data - BeforeAfter.after.Data) / BeforeAfter.before.Data) * 100
                        ).toFixed(2)}
                      </span>{" "}
                      %
                    </>
                  )
                  : "-"
                }
              </span>

            </div>
            <br />
          </div>
        </div>
      </div>
      <div style={{ padding: "20px", backgroundColor: "#F8F9FA" }}>
        <div className="tkn-title">
          <div>
            <h1
              className="tkn-title-text"
              onClick={() => navigate(-1)}
              style={{ cursor: 'pointer' }}
            >
              <LeftOutlined className="tkn-back-icon" />
              กราฟ Total Kjeldahl Nitrogen
            </h1>
          </div>
          <div className="tkn-select-date">
            <div>
              <Select

                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  setDateRange(null); // เคลียร์ช่วงวันที่เดิม
                }}
                className="tkn-select-filter"
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
                  allowClear={true}
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
                  allowClear={true}
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
                  allowClear={true}
                  value={dateRange}
                  format={(value) => value ? `${value.year() + 543}` : ''}
                />
              )}
            </div>
          </div>
        </div>
        <div className="tkn-graph-container">
          {/* ตารางน้ำก่อนบำบัดนะจ๊ะ */}
          <div className="tkn-graph-card">
            <div className="tkn-head-graph-card">
              <div className="tkn-width25">
                <h2 className="tkn-head-graph-card-text">น้ำก่อนบำบัด</h2>
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
                <Button className="tkn-expand-chat" onClick={() => openModal("before")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="tkn-right-select-graph">
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

          <div className="tkn-graph-card">
            <div className="tkn-head-graph-card">
              <div className="tkn-width25">
                <h2 className="tkn-head-graph-card-text">น้ำหลังบำบัด</h2>
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
                <Button className="tkn-expand-chat" onClick={() => openModal("after")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="tkn-right-select-graph">
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
          <div className="tkn-graph-card">
            <div className="tkn-head-graph-card">
              <div className="tkn-width40">
                <h2 className="tkn-head-graph-card-text" >เปรียบเทียบก่อน-หลังบำบัด</h2>
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
                <Button className="tkn-expand-chat" onClick={() => openModal("compare")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="tkn-right-select-graph">
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
          <div className="tkn-graph-card">
            <div className="tkn-head-graph-card">
              <div className="tkn-width25">
                <h2 className="tkn-head-graph-card-text" >ประสิทธิภาพ</h2>
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
            <div className="tkn-right-select-graph">
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
        <div className="tkn-header-vis">
          <h1 className="tkn-title-text-vis">ข้อมูล Total Kjeldahl Nitrogen</h1>
          <div className="tkn-btn-container">
            <button className="tkn-add-btn" onClick={showModal}>เพิ่มข้อมูลใหม่</button>
          </div>
        </div>
        <div className="tkn-select-date">
          <div className="tkn-filter-status-and-efficiency">
            <p>ประสิทธิภาพ</p>
            <Select
              allowClear
              placeholder="เลือกประสิทธิภาพ"
              value={efficiencyFilter}
              onChange={(v) => setEfficiencyFilter(v || null)}
              style={{ width: 200 }}
              options={[
                { label: "มากกว่า 50%", value: "gt" },
                { label: "น้อยกว่าหรือเท่ากับ 50%", value: "lte" },
              ]}
            />
            <p>สถานะ</p>
            <Select
              allowClear
              placeholder="เลือกสถานะ"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v || null)}
              style={{ width: 200 }}
              options={statusOptions.map((item) => ({
                label: item.StatusName,
                value: item.StatusName,
              }))}
            />
          </div>
          <div className="tkn-filter-date">
            <div >
              <Select
                value={tableFilterMode}
                onChange={(val) => {
                  setTableFilterMode(val);
                  setTableDateRange(null);
                }}
                className="tkn-select-filter"
                options={[
                  { label: "เลือกช่วงวัน", value: "dateRange" },
                  { label: "เลือกเดือน", value: "month" },
                  { label: "เลือกปี", value: "year" },
                ]}
              />
            </div>
            <div>
              {tableFilterMode === "dateRange" && (
                <RangePicker
                  value={tableDateRange}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setTableDateRange([dates[0], dates[1]]);
                    } else {
                      setTableDateRange(null);
                    }
                  }}
                  locale={th_TH}
                  allowClear={true}
                  format={(value) => value ? `${value.date()} ${value.locale('th').format('MMMM')} ${value.year() + 543}` : ''}
                  style={{ width: 300 }}
                  placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                />
              )}

              {tableFilterMode === "month" && (
                <DatePicker
                  picker="month"
                  onChange={(date) => {
                    if (date) {
                      const start = date.startOf('month');
                      const end = date.endOf('month');
                      setTableDateRange([start, end]);
                    } else {
                      setTableDateRange(null);
                    }
                  }}
                  locale={th_TH}
                  placeholder="เลือกเดือน"
                  style={{ width: 150 }}
                  allowClear={true}
                  value={tableDateRange ? tableDateRange[0] : null}
                  format={(value) => value ? `${value.locale('th').format('MMMM')} ${value.year() + 543}` : ''}
                />
              )}

              {tableFilterMode === "year" && (
                <DatePicker.RangePicker
                  picker="year"
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      const start = dates[0].startOf('year');
                      const end = dates[1].endOf('year');
                      setTableDateRange([start, end]);
                    } else {
                      setTableDateRange(null);
                    }
                  }}
                  locale={th_TH}
                  placeholder={["ปีเริ่มต้น", "ปีสิ้นสุด"]}
                  style={{ width: 300 }}
                  allowClear={true}
                  value={tableDateRange}
                  format={(value) => value ? `${value.year() + 543}` : ''}
                />
              )}
            </div>
          </div>
        </div>
        <br />
        <div className="tkn-table-data">
          <div className="tkn-width40">
            <h1 className="tkn-title-text-table">ตารางรายงานผลการดำเนินงาน</h1>
          </div>
          <div className="tkn-task-summary">
            <div className="tkn-task-total">จำนวนทั้งหมด <span style={{ color: "#1a4b57", fontWeight: "bold" }}>{totalTasks}</span> วัน</div>
            <div className="tkn-task-stats">
              <div className="tkn-task-item">
                <div className="tkn-task-number status-good">{doneTasks}</div>
                <div className="tkn-task-label">ผ่านเกณฑ์มาตรฐาน</div>
              </div>
              <div className="tkn-task-divider" />
              <div className="tkn-task-item">
                <div className="tkn-task-number status-high">{inProgressTasks}</div>
                <div className="tkn-task-label">ไม่ผ่านเกณฑ์มาตรฐาน</div>
              </div>
            </div>
          </div>
          <Table
            locale={{
              triggerAsc: "คลิกเพื่อเรียงจากเก่าไปใหม่",
              triggerDesc: "คลิกเพื่อเรียงจากใหม่ไปเก่า",
              cancelSort: "คลิกเพื่อยกเลิกการเรียงลำดับ",
              emptyText: "ไม่มีข้อมูล",
            }}
            columns={columns.map((col) => ({ ...col, align: 'center' }))}
            dataSource={data
              .filter((d: any) =>
                dayjs(d.date).format('YYYY-MM-DD').includes(search)
              )
              .filter((d: any) => {
                if (!tableDateRange) return true;
                const recordDate = dayjs(d.date);
                return recordDate.isBetween(tableDateRange[0], tableDateRange[1], null, '[]');
              })
              .filter((d: any) => {
                // กรองประสิทธิภาพ
                if (!efficiencyFilter) return true;
                const eff = Number(d.efficiency ?? -1);
                if (efficiencyFilter === "gt") return eff > 50;
                if (efficiencyFilter === "lte") return eff <= 50;
                return true;
              })
              .filter((d: any) => {
                // กรองสถานะ
                if (!statusFilter) return true;
                return normalizeString(d.status ?? "") === normalizeString(statusFilter);
              })
            }
            rowKey="ID"
            loading={loading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['7', '10', '15', '30', '100'],
            }}

          />
        </div>

        <Modal
          title={<span style={{ color: '#1ba0a2ff' }}>เพิ่มข้อมูล TKN ใหม่</span>}
          open={isModalVisible}
          footer={null}
          width={900}
          destroyOnClose
          closable={false}
          centered
          bodyStyle={{ padding: '35px 35px 20px 35px' }}
        >
          <div className="tkn-container">
            <TKNCentralForm onCancel={handleAddModalCancel}
              onSuccess={async () => {
                await fetchData();      // โหลดข้อมูลกราฟใหม่
                await loadTKNTable();   // โหลดข้อมูลตารางใหม่
              }}
            />
          </div>
        </Modal>
        <Modal
          title={<span style={{ color: '#1ba0a2ff' }}>แก้ไขข้อมูล TKN</span>}
          open={isEditModalVisible}
          footer={null}
          width={900}
          closable={false}
          destroyOnClose
          centered
          onCancel={handleEditModalCancel}
          bodyStyle={{ padding: '35px 35px 20px 35px' }}
        >
          {editingRecord && (
            <div className="up-tds-container">
              <UpdateTKNCentralForm
                initialValues={editingRecord}
                onSuccess={() => {
                  setTimeout(async () => {
                    setIsEditModalVisible(false);
                    setEditRecord(null);
                    await loadTKNTable();
                    await fetchData();
                  }, 500);
                }}
                onCancel={handleEditModalCancel}
              />
            </div>
          )}
        </Modal>

        <Modal
          visible={modalVisible}
          onCancel={closeModal}
          footer={null}
          className="tkn-custom-modal"
          centered
          destroyOnClose
          maskClosable={true}
        >
          {modalGraphType === "before" && (
            <div className="tkn-chat-modal" >
              <div className="tkn-head-graph-card">
                <div className="tkn-width25">
                  <h2 className="tkn-head-graph-card-text">น้ำก่อนบำบัด</h2>
                </div>
              </div>
              <div className="tkn-right-select-graph">
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
              <div className="tkn-chart-containner">
                <ApexChart
                  key={chartTypeBefore}
                  options={getChartOptions(
                    beforeData.map(item => item.date),
                    chartTypeBefore,
                    filterMode === "year",
                    beforeSeries[0]?.data || [], //  ส่ง data เพื่อใช้หาค่าสูงสุด
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
            <div className="tkn-chat-modal">
              <div className="tkn-head-graph-card">
                <div className="tkn-width25">
                  <h2 className="tkn-head-graph-card-text">น้ำหลังบำบัด</h2>
                </div>
              </div>
              <div className="tkn-right-select-graph">
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
              <div className="tkn-chart-containner">
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
            <div className="tkn-chat-modal">
              <div className="tkn-head-graph-card" >
                <div className="tkn-width40">
                  <h2 className="tkn-head-graph-card-text" >เปรียบเทียบก่อน-หลังบำบัด</h2>
                </div>
              </div>
              <div className="tkn-right-select-graph">
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
              <div className="tkn-chart-containner">
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

export default TKNdataviz;
