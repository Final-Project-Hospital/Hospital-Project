//ใช้ทั้งกราฟและตาราง
import React, { useEffect, useRef, useState } from "react";
import { Select, DatePicker, Modal, message, Tooltip, Button } from "antd";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled, CloseCircleFilled, CheckCircleFilled, QuestionCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import './PTdataviz.css';
import dayjs, { Dayjs } from "dayjs";
import { GetlistPT, GetfirstPT, GetBeforeAfterPT } from "../../../../../services/tapwaterServices/pt";
import AftereWater from "../../../../../assets/rain.png"
const isMobile = window.innerWidth <= 768;
import { FormOutlined } from '@ant-design/icons';

// ใช้กับกราฟ
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { BarChart3, LineChart, Maximize2 } from "lucide-react";

//ใช้กับตาราง
import Table, { ColumnsType } from "antd/es/table";
import { GetPTbyID, GetPTTABLE, DeleteAllPTRecordsByDate } from "../../../../../services/tapwaterServices/pt";
import UpdatePTCentralForm from "../../../data-management/tapwater/ptcenter/updatePTcenter";
import PTCentralForm from "../../../data-management/tapwater/ptcenter/ptcenter"
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

const PTdataviz: React.FC = () => {
  const navigate = useNavigate();

  //ใช้ทั้งกราฟและตาราง
  const [data, setData] = useState<any[]>([]); // ดึง PT ทั้งหมด
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterMode, setFilterMode] = useState<"dateRange" | "month" | "year">("year");
  const [BeforeAfter, setBeforeAfter] = useState<{ before: any; after: any } | null>(null);

  //ใช้กับกราฟ
  const [chartTypeAfter, setChartTypeAfter] = useState<'bar' | 'line'>('line');
  const [chartTypeMinMax, setChartTypeMinMax] = useState<'bar' | 'line'>('line');
  const [beforeData, setBeforeData] = useState<{ unit: string; date: string; data: number }[]>([]);
  const [afterData, setAfterData] = useState<{ unit: string; date: string; data: number }[]>([]);
  const [colorAfter, setColorAfter] = useState<string>("#1a4b57");
  const [colorMin, setColorMin] = useState<string>("#2abdbf");
  const [colorMax, setColorMax] = useState<string>("#1a4b57");
  const [colorAvg, setColorAvg] = useState<string>("#f39c12");
  const [unit, setUnit] = useState<string>("-");
  const [middlestandard, setMiddleStandard] = useState<number | undefined>(undefined);
  const [minstandard, setMinStandard] = useState<number | undefined>(undefined);
  const [maxstandard, setMaxStandard] = useState<number | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalGraphType, setModalGraphType] = useState<"after" | "minmax" | null>(null);
  const [afterMaxMinData, setAfterMaxMinData] = useState<{ date: string; max: number; min: number; avg?: number; maxDate?: string; minDate?: string; avgYear?: string; maxUnit?: string; minUnit?: string; avgUnit?: string; }[]>([]);
  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = dayjs(dateStr).locale('th');
    return `${d.date()} ${d.format('MMM')} ${d.year() + 543}`;
  };

  //ใช้กับตาราง
  const [search] = useState(""); //setSearch
  const [isModalVisible, setIsModalVisible] = useState(false);  // --- Modal สำหรับเพิ่ม/แก้ไข PT (ถ้าต้องการใช้) ---
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditRecord] = useState<any>(null);
  const { confirm } = Modal;
  const [statusOptions, setStatusOptions] = useState<ListStatusInterface[]>([]);
  const [tableFilterMode, setTableFilterMode] = useState<"dateRange" | "month" | "year">("year");
  const [tableDateRange, setTableDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const totalTasks = data.length;
  const doneTasks = data.filter((d: any) => {
    const status = (d.status ?? "").trim(); return status.includes("ผ่าน") && !status.includes("ไม่ผ่าน");
  }).length;
  const inProgressTasks = data.filter((d: any) => normalizeString(d.status ?? "").includes(normalizeString("ไม่ผ่าน"))).length;

  //ใช้กับกราฟ ---โหลดสีจาก localStorage----
  useEffect(() => {
    const storedColorAfter = localStorage.getItem('colorAfter');
    const storedMin = localStorage.getItem('colorMin');
    const storedMax = localStorage.getItem('colorMax');
    if (storedColorAfter) setColorAfter(storedColorAfter);
    if (storedMin) setColorMin(storedMin);
    if (storedMax) setColorMax(storedMax);
  }, []);

  // ใช้กับกราฟ
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lastpt, response, ptRes] = await Promise.all([
        GetfirstPT(),
        GetlistPT(),
        GetBeforeAfterPT(),
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
        // console.log(lastpt.data)
        if (lastpt.data.MiddleValue !== -1) {
          setMiddleStandard(lastpt.data.MiddleValue);
          setMaxStandard(-1); //แก้ให้เส้นมาตรฐานอัพเดท
          setMinStandard(-1); //แก้ให้เส้นมาตรฐานอัพเดท
        } else {
          setMiddleStandard(-1); //แก้ให้เส้นมาตรฐานอัพเดท
          setMaxStandard(lastpt.data.MaxValue);
          setMinStandard(lastpt.data.MinValue);
        }

        // ================== คำนวณ Max/Min ==================
        const afterMaxMin: typeof afterMaxMinData = [];

        const processGroups = (keyFunc: (dateStr: string) => string) => {
          const groups: Record<string, { value: number; date: string }[]> = {};

          allDates.forEach(dateStr => {
            const key = keyFunc(dateStr);
            if (!groups[key]) groups[key] = [];

            response.data.forEach((item: any) => {
              if (item.BeforeAfterTreatmentID === 2) {
                const actualDate = dayjs(item.Date).format("YYYY-MM-DD");
                if (
                  (filterMode === "year" && dayjs(actualDate).year().toString() === key) ||
                  (filterMode === "month" && dayjs(actualDate).format("YYYY-MM") === key) ||
                  (filterMode === "dateRange" && actualDate === key)
                ) {
                  groups[key].push({ value: item.Data, date: actualDate });
                }
              }
            });
          });

          Object.keys(groups).forEach(key => {
            const entries = groups[key];
            if (entries.length) {
              const maxEntry = entries.reduce((prev, curr) => curr.value > prev.value ? curr : prev, entries[0]);
              const minEntry = entries.reduce((prev, curr) => curr.value < prev.value ? curr : prev, entries[0]);
              const avgValue = entries.reduce((sum, curr) => sum + curr.value, 0) / entries.length;

              // หา unit ของ Max/Min
              const maxUnit = response.data.find((i: any) =>
                i.BeforeAfterTreatmentID === 2 &&
                dayjs(i.Date).format("YYYY-MM-DD") === maxEntry.date &&
                i.Data === maxEntry.value
              )?.UnitName ?? "";

              const minUnit = response.data.find((i: any) =>
                i.BeforeAfterTreatmentID === 2 &&
                dayjs(i.Date).format("YYYY-MM-DD") === minEntry.date &&
                i.Data === minEntry.value
              )?.UnitName ?? "";

              // เก็บปีของค่าเฉลี่ย
              const avgYear = dayjs(entries[0].date).format("YYYY"); // ✅ เก็บเฉพาะปี

              // หา unit ของค่าเฉลี่ย ใช้ปีตรงกับ avgYear
              const avgUnit = response.data.find((i: any) =>
                i.BeforeAfterTreatmentID === 2 &&
                dayjs(i.Date).format("YYYY") === avgYear
              )?.UnitName ?? "";

              afterMaxMin.push({
                date: key,
                max: maxEntry.value,
                min: minEntry.value,
                avg: avgValue,   //  เพิ่มค่าเฉลี่ยเก็บไว้ใน object
                avgYear,       //  เพิ่ม field avgYear
                avgUnit,       //  เพิ่ม field avgUnit
                maxDate: formatThaiDate(maxEntry.date),
                minDate: formatThaiDate(minEntry.date),
                maxUnit,
                minUnit
              });
            } else {
              afterMaxMin.push({ date: key, max: 0, min: 0, avg: 0, maxDate: "", minDate: "", avgYear: "", maxUnit: "", minUnit: "", avgUnit: "", });
            }
          });
        };

        if (filterMode === "year") {
          processGroups(dateStr => dayjs(dateStr).year().toString());
        } else if (filterMode === "month") {
          processGroups(dateStr => dayjs(dateStr).format("YYYY-MM"));
        } else {
          processGroups(dateStr => dateStr); // รายวัน
        }

        setAfterMaxMinData(afterMaxMin);
        setUnit(lastpt.data.UnitName);
        setBeforeData(before);
        setAfterData(after);
        // เซ็ตข้อมูลจาก GetBeforeAfterPT
        if (!ptRes || !ptRes.data || ptRes.data.length === 0) {
          setBeforeAfter(null); // ✅ ตรงกับ type
          setError("ไม่พบข้อมูล Before/After PT");
        } else {
          setBeforeAfter(ptRes.data);
        }
      } else {
        setError("ไม่พบข้อมูล PT");
      }
    } catch (err) {
      console.error("Error fetching PT data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // เรียก fetchData เมื่อเปลี่ยน filterMode หรือ dateRange (เฉพาะกราฟ)
  useEffect(() => {
    fetchData();
  }, [dateRange, filterMode]);

  const afterDataRef = useRef(afterData);
  useEffect(() => {
    afterDataRef.current = afterData;
  }, [afterData]);

  const afterMaxMinRef = useRef(afterMaxMinData);
  useEffect(() => {
    afterMaxMinRef.current = afterMaxMinData;
  }, [afterMaxMinData]);

  //ใช้กับตาราง
  const loadPTTable = async () => {
    try {
      const response2 = await GetPTTABLE();
      if (!response2 || response2.length === 0) {
        setError("ไม่พบข้อมูล PT ของตาราง");
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
      console.error("Error fetching PTTABLE data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล PT");
    }
  };

  // โหลดครั้งแรก
  useEffect(() => {
    loadPTTable();
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
    isPercentChart = false, //ใช้บอกว่าคือกราฟประสิทธิภาพไหม
    isMaxMinPercent = false
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
        id: "pt-chart",
        toolbar: {
          show: true,
          tools: {
            download: true, selection: true, zoom: true, zoomin: !isMobile, zoomout: !isMobile, pan: !isMobile, reset: true
          }
        },
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
                  label: { text: "ไม่พบ", style: { background: "#ff6e61e4", color: "#fff" } },
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
                      label: { text: `มาตรฐาน ${middlestandard.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, style: { background: "#ff6e61e4", color: "#fff" } },
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
            if (isMaxMinPercent) {
              // แสดงเฉพาะปีสำหรับ year mode
              if (filterMode === "year") return dayjs(value).year().toString();
              // แสดงเดือน+ปี สำหรับ month mode
              if (filterMode === "month") return dayjs(value).format("MMM");
              // แสดงวัน+เดือน สำหรับ day mode
              return dayjs(value).format("D MMM");
            }
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
            if (seriesName === "ค่าสูงสุด" && afterMaxMinRef.current && afterMaxMinRef.current.length > dataPointIndex) {
              const item = afterMaxMinRef.current[dataPointIndex];
              const unit = item.maxUnit || 'ไม่มีการตรวจวัด';
              if (unit === 'ไม่มีการตรวจวัด') return unit;
              return `${(item.max ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit} (วันที่: ${item.maxDate})`;
            }

            if (seriesName === "ค่าต่ำสุด" && afterMaxMinRef.current && afterMaxMinRef.current.length > dataPointIndex) {
              const item = afterMaxMinRef.current[dataPointIndex];
              const unit = item.minUnit || 'ไม่มีการตรวจวัด';
              if (unit === 'ไม่มีการตรวจวัด') return unit;
              return `${(item.min ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit} (วันที่: ${item.minDate})`;
            }

            if (seriesName === "ค่าเฉลี่ย" && afterMaxMinRef.current && afterMaxMinRef.current.length > dataPointIndex) {
              const item = afterMaxMinRef.current[dataPointIndex];
              const unit = item.avgUnit || 'ไม่มีการตรวจวัด';
              if (unit === 'ไม่มีการตรวจวัด') return unit;
              const thaiYear = item.avgYear ? (parseInt(item.avgYear) + 543) : "";
              return `${(item.avg ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit} (ปี: ${thaiYear})`; // ✅ แสดงปี + ค่า + หน่วย
            }

            // กรณี beforeSeries หรือ compareSeries "ก่อนบำบัด"
            if ((seriesName === "ก่อนบำบัด" || seriesName === "PT") && beforeData && beforeData.length > dataPointIndex) {
              const unit = beforeData[dataPointIndex]?.unit || 'ไม่มีการตรวจวัดก่อนบำบัด';
              if (unit === 'ไม่มีการตรวจวัดก่อนบำบัด') return unit;
              return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
            }

            // กรณี afterSeries หรือ compareSeries "หลังบำบัด"
            if ((seriesName === "Total Phosphorus" || seriesName === "PT") && afterDataRef.current && afterDataRef.current.length > dataPointIndex) {
              const unit = afterDataRef.current[dataPointIndex]?.unit || 'ไม่มีการตรวจวัด Total Phosphorus';
              if (unit === 'ไม่มีการตรวจวัด Total Phosphorus') return unit;
              return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
            }

            // // กรณี afterSeries หรือ compareSeries "หลังบำบัด"
            // if ((seriesName === "หลังบำบัด" || seriesName === "PT") && afterData && afterData.length > dataPointIndex) {
            //   const unit = afterData[dataPointIndex]?.unit || 'ไม่มีการตรวจวัดหลังบำบัด';
            //   if (unit === 'ไม่มีการตรวจวัดหลังบำบัด') return unit;
            //   return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
            // }

            // กรณีอื่น ๆ
            return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }

        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: { show: true, showForSingleSeries: true, position: 'top', horizontalAlign: 'center' },
      stroke: chartType === "line" ? { show: true, curve: "smooth", width: 3, dashArray: [0, 0, 8], } : { show: false },
      markers: chartType === "line"
        ? {
          size: isMobile ? 0 : 4.5,
          shape: ["circle", "triangle", "star"],
          hover: { sizeOffset: 3 },
        }
        : { size: 0 },

    };
  };
  const afterSeries = [
    { name: "Total Phosphorus", data: afterData.map(item => item.data), color: colorAfter }
  ];
  const afterMaxMinSeries = [
    {
      name: "ค่าสูงสุด",
      data: afterMaxMinData.map(item => item.max),
      color: colorMax,
    },
    {
      name: "ค่าต่ำสุด",
      data: afterMaxMinData.map(item => item.min),
      color: colorMin,
    },
    {
      name: "ค่าเฉลี่ย", //  เพิ่ม series ใหม่
      data: afterMaxMinData.map(item => item.avg ?? 0),
      color: colorAvg,  // สีต่างจาก min/max
    }
  ];
  //ใช้กับกราฟ
  const openModal = (type: "after" | "minmax") => {
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
      width: 180,
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
      width: 180,
      render: (unit: string) => unit || '-',
    },
    {
      title: 'ค่าที่วัดได้',
      dataIndex: 'after_value',
      key: 'after_value',
      width: 180,
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
      title: 'ค่ามาตรฐาน',
      dataIndex: 'standard_value',
      key: 'standard_value',
      width: 180,
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
      width: 180,
      render: (_, record) => {
        const statusName = record.status;
        if (!statusName) {
          return (
            <span className="pt-status-badge status-none">
              <QuestionCircleFilled style={{ fontSize: 20 }} />
              ไม่มีข้อมูล
            </span>
          );
        }
        if (statusName.includes("ไม่ผ่าน")) {
          return (
            <span className="pt-status-badge status-high">
              <CloseCircleFilled style={{ marginBottom: -4, fontSize: 18 }} />
              {statusName}
            </span>
          );
        }
        if (statusName.includes("ผ่าน")) {
          return (
            <span className="pt-status-badge status-good">
              <CheckCircleFilled style={{ marginBottom: -4, fontSize: 18 }} />
              {statusName}
            </span>
          );
        }
      }
    },
    {
      title: (
        <>หมายเหตุ</>
      ),
      dataIndex: 'note',
      key: 'note',
      width: 140,
      render: (_: any, record: any) => {
        return record.after_note || '-';
      },
    },
    {
      title: 'จัดการข้อมูล',
      key: 'action',
      width: 140,
      render: (_: any, record: any) => {
        // console.log('record:', record);
        return (
          <div className="pt-action-buttons">
            <Tooltip title="แก้ไข">
              <button
                className="pt-circle-btn pt-edit-btn"
                onClick={() => handleEdit([record.before_id, record.after_id])}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title="ลบ">
              <button
                className="pt-circle-btn pt-delete-btn"
                onClick={() => handleDelete([record.before_id, record.after_id])}  // ส่ง ID เดียว
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
      const responses = await Promise.all(filteredIds.map((id) => GetPTbyID(id)));
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
      console.error("Error fetching PT data:", error);
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
          await DeleteAllPTRecordsByDate(firstId);
          message.success("ลบข้อมูลสำเร็จ");
          await fetchData();
          await loadPTTable();
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
      <div className="pt-title-header">
        <div>
          <h1>PT Central</h1>
          <p>ฟอสฟอรัสรวม เป็นธาตุอาหารที่กระตุ้นการเกิดสาหร่าย</p>
        </div>
        <div className="pt-card">
          <img src={AftereWater} alt="After Water" className="pt-photo" />
          <div>
            <h4>ค่า Total Phosphorus ล่าสุด</h4>
            <div className="pt-main">
              <span>{BeforeAfter?.after.Data !== null && BeforeAfter?.after.Data !== undefined ? (<><span className="pt-value">{BeforeAfter.after.Data.toLocaleString()}</span>{" "}{BeforeAfter.after.UnitName || ""}</>) : "-"}</span>
            </div>
            {BeforeAfter ? (
              <p>
                มาตรฐาน{" "}
                <span>
                  {(() => {
                    const { MiddleValue, MinValue, MaxValue, UnitName } = BeforeAfter.after;
                    if (MiddleValue === 0 && MinValue === -1 && MaxValue === -1) { return "ไม่พบ"; }
                    // ✅ เงื่อนไขเดิม
                    if ((MiddleValue !== null && MiddleValue !== -1) || (MinValue !== null && MinValue !== -1) || (MaxValue !== null && MaxValue !== -1) || (UnitName && UnitName.trim() !== "")
                    ) {
                      return MiddleValue !== null && MiddleValue !== -1 ? MiddleValue.toLocaleString() : `${MinValue !== null && MinValue !== -1 ? MinValue.toLocaleString() : "-"} - ${MaxValue !== null && MaxValue !== -1 ? MaxValue.toLocaleString() : "-"}`;
                    }
                    return "-";
                  })()}
                </span>{" "}
                {BeforeAfter.after.UnitName || ""}
              </p>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: "20px", backgroundColor: "#F8F9FA" }}>
        <div className="pt-title">
          <div>
            <h1
              className="pt-title-text"
            >
              <LeftOutlined className="pt-back-icon" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
              กราฟ Total Phosphorus
            </h1>
          </div>
          <div className="pt-select-date">
            <div>
              <Select

                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  setDateRange(null); // เคลียร์ช่วงวันที่เดิม
                }}
                className="pt-select-filter"
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
        <div className="pt-graph-container">
          <div className="pt-graph-card">
            <div className="pt-head-graph-card">
              <div className="pt-width40">
                <h2 className="pt-head-graph-card-text">ค่า Total Phosphorus</h2>
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
                <Button className="pt-expand-chat" onClick={() => openModal("after")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="pt-right-select-graph">
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
          <div className="pt-graph-card">
            <div className="pt-head-graph-card">
              <div className="pt-width60">
                <h2 className="pt-head-graph-card-text">ค่า Total Phosphorus ต่ำสุด/สูงสุด/เฉลี่ย</h2>
              </div>
              <div>
                <ColorPicker
                  value={colorMin}
                  onChange={(color: Color) => {
                    const hex = color.toHexString();
                    setColorMin(hex);
                    localStorage.setItem('colorMin', hex);
                  }}
                />
                <ColorPicker
                  value={colorMax}
                  onChange={(color: Color) => {
                    const hex = color.toHexString();
                    setColorMax(hex);
                    localStorage.setItem('colorMax', hex);
                  }}
                />
                <ColorPicker
                  value={colorAvg}
                  onChange={(color: Color) => {
                    const hex = color.toHexString();
                    setColorAvg(hex);
                    localStorage.setItem('colorAvg', hex);
                  }}
                />
                <Button className="pt-expand-chat" onClick={() => openModal("minmax")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="pt-right-select-graph">
              <Select
                value={chartTypeMinMax}
                onChange={val => setChartTypeMinMax(val)}
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
              key={chartTypeMinMax}
              options={getChartOptions(
                afterMaxMinData.map(item => item.date),
                chartTypeMinMax,
                filterMode === "year",
                [
                  ...afterMaxMinData.map(item => item.max),
                  ...afterMaxMinData.map(item => item.min),
                ],
                false,
                false,
                true
              )}
              series={afterMaxMinSeries}
              type={chartTypeMinMax}
              height={350}
            />
          </div>
        </div>
        <div className="pt-header-vis">
          <h1 className="pt-title-text-vis">ข้อมูล Total Phosphorus</h1>
          <div className="pt-btn-container">
            <button className="pt-add-btn" onClick={showModal}>{isMobile ? <FormOutlined /> : 'เพิ่มข้อมูลใหม่'}</button>
          </div>
        </div>
        <div className="pt-select-date2">
          <div className="pt-filter-status-and-efficiency">
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
          <div className="pt-filter-date">
            <div >
              <Select
                value={tableFilterMode}
                onChange={(val) => {
                  setTableFilterMode(val);
                  setTableDateRange(null);
                }}
                className="pt-select-filter"
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
        <div className="pt-table-data">
          <div className="pt-width40">
            <h1 className="pt-title-text-table">ตารางรายงานผลการดำเนินงาน</h1>
          </div>
          <div className="pt-task-summary">
            <div className="pt-task-total">จำนวนทั้งหมด <span style={{ color: "#1a4b57", fontWeight: "bold" }}>{totalTasks}</span> วัน</div>
            <div className="pt-task-stats">
              <div className="pt-task-item">
                <div className="pt-task-number status-good">{doneTasks}</div>
                <div className="pt-task-label">ผ่านเกณฑ์มาตรฐาน</div>
              </div>
              <div className="pt-task-divider" />
              <div className="pt-task-item">
                <div className="pt-task-number status-high">{inProgressTasks}</div>
                <div className="pt-task-label">ไม่ผ่านเกณฑ์มาตรฐาน</div>
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
              showQuickJumper: true,
              responsive: true,
              position: isMobile ? ['bottomCenter'] : ['bottomRight'],
            }}
            scroll={isMobile ? { x: 'max-content' } : undefined}
          />
        </div>

        <Modal
          title={<span style={{ color: '#1ba0a2ff' }}>เพิ่มข้อมูล PT ใหม่</span>}
          open={isModalVisible}
          footer={null}
          width={900}
          destroyOnClose
          closable={false}
          centered
          bodyStyle={{ padding: '35px 35px 20px 35px' }}
          className="modal-create"
        >
          <div className="pt-container">
            <PTCentralForm onCancel={handleAddModalCancel}
              onSuccess={async () => {
                await fetchData();       // โหลดข้อมูลกราฟใหม่
                await loadPTTable();   // โหลดข้อมูลตารางใหม่
              }}
            />
          </div>
        </Modal>
        <Modal
          title={<span style={{ color: '#1ba0a2ff' }}>แก้ไขข้อมูล PT</span>}
          open={isEditModalVisible}
          footer={null}
          width={900}
          closable={false}
          destroyOnClose
          centered
          onCancel={handleEditModalCancel}
          bodyStyle={{ padding: '35px 35px 20px 35px' }}
          className="modal-create"
        >
          {editingRecord && (
            <div className="up-tds-container">
              <UpdatePTCentralForm
                initialValues={editingRecord}
                onSuccess={() => {
                  setTimeout(async () => {
                    setIsEditModalVisible(false);
                    setEditRecord(null);
                    await loadPTTable();
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
          className="pt-custom-modal"
          centered
          destroyOnClose
          maskClosable={true}
        >

          {modalGraphType === "after" && (
            <div className="pt-chat-modal">
              <div className="pt-head-graph-card">
                <div className="pt-width25">
                  <h2 className="pt-head-graph-card-text">ค่า Total Phosphorus</h2>
                </div>
              </div>
              <div className="pt-right-select-graph">
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
              <div className="pt-chart-containner">
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
          {modalGraphType === "minmax" && (
            <div className="pt-chat-modal">
              <div className="pt-head-graph-card" >
                <div className="pt-width40">
                  <h2 className="pt-head-graph-card-text" >ค่า Total Phosphorus ต่ำสุด/สูงสุด/เฉลี่ย</h2>
                </div>
              </div>
              <div className="pt-right-select-graph">
                <Select
                  value={chartTypeMinMax}
                  onChange={val => setChartTypeMinMax(val)}
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
              <div className="pt-chart-containner">
                <ApexChart
                  key={chartTypeMinMax}
                  options={getChartOptions(
                    afterMaxMinData.map(item => item.date),
                    chartTypeMinMax,
                    filterMode === "year",
                    [
                      ...afterMaxMinData.map(item => item.max),
                      ...afterMaxMinData.map(item => item.min),
                    ],
                    true,
                    false,
                    true
                  )}
                  series={afterMaxMinSeries}
                  type={chartTypeMinMax}
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

export default PTdataviz;