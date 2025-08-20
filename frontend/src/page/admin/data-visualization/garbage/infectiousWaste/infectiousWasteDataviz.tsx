//ใช้ทั้งกราฟและตาราง
import React, { useEffect, useState } from "react";
import { Select, DatePicker, Modal, message, Tooltip } from "antd";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled, CheckCircleFilled, QuestionCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import './infectiousWasteDataviz.css';
import dayjs, { Dayjs } from "dayjs";
import { GetlistInfectious, GetfirstInfectious, GetLastDayInfectious } from "../../../../../services/garbageServices/infectiousWaste";
import PhotoMonthlyGarbage from "../../../../../assets/waste/container.png"
import PhotoDailyGarbage from "../../../../../assets/waste/garbage-bag.png"
import PhotoAADC from "../../../../../assets/waste/garbage-truck.png"
import { listInfectiousInterface } from "../../../../../interface/Igarbage/IinfectiousWaste";

// ใช้กับกราฟ
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { BarChart3, LineChart } from "lucide-react";

//ใช้กับตาราง
import Table, { ColumnsType } from "antd/es/table";
import { GetInfectiousbyID, GetInfectiousTABLE, DeleteAllInfectiousRecordsByDate } from "../../../../../services/garbageServices/infectiousWaste";
import UpdateInfectiousCentralForm from "../../../data-management/garbage/infectiousWaste/updateinfectiousCenter";
import InfectiousCentralForm from "../../../data-management/garbage/infectiousWaste/infectiousWaste"
import { ListStatus } from '../../../../../services/index';
import { ListStatusInterface } from '../../../../../interface/IStatus';
// import "./infectiousWaste.css"
import Chart from "react-apexcharts";

const normalizeString = (str: any) =>
  String(str).normalize("NFC").trim().toLowerCase();

//ใช้ตั้งค่าวันที่ให้เป็นภาษาไทย
import 'dayjs/locale/th';
import th_TH from 'antd/es/date-picker/locale/th_TH';
dayjs.locale('th');
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const InfectiousWaste: React.FC = () => {
  const navigate = useNavigate();

  //ใช้ทั้งกราฟและตาราง
  const [data, setData] = useState<any[]>([]); // ดึง Infectious ทั้งหมด
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterMode, setFilterMode] = useState<"dateRange" | "month" | "year">("year");
  const [lastDayInfectious, setlastDayInfectious] = useState<listInfectiousInterface | null>(null);

  //ใช้กับกราฟ
  const [listdata, setListData] = useState<{ unit: string; date: string; avgValue: number }[]>([]);
  const [aadcData, setAADCData] = useState<{ date: string; avgValue: number; unit: string }[]>([]);
  const [compareMonthlyGarbageQuantity, setcompareMonthlyGarbageQuantity] = useState<{ date: string; monthlyGarbage: number; quantity: number; unit: string }[]>([]);
  const [chartTypeData, setChartTypeData] = useState<'bar' | 'line'>('line');
  const [chartTypeAadc, setChartTypeAadc] = useState<'bar' | 'line'>('line');
  const [chartTypeCompareMonthlyGarbageQuantity, setChartTypeCompareMonthlyGarbageQuantity] = useState<'bar' | 'line'>('line');
  const [colorGarbage, setColorGarbage] = useState<string>("#2abdbf");
  const [colorAadc, setColorAadc] = useState<string>("#1a4b57");
  const [colorCompareMonthlyGarbage, setColorCompareMonthlyGarbage] = useState<string>("#2abdbf");
  const [colorCompareQuantity, setColorCompareQuantity] = useState<string>("#1a4b57");
  const [totalMonthlyGarbage, setTotalMonthlyGarbage] = useState(0);
  const [latestYear, setLatestYear] = useState<number | null>(null);
  const [monthlyDataLatestYear, setMonthlyDataLatestYear] = useState<{ month: string; value: number }[]>([]);
  const [middleTarget, setMiddleTarget] = useState<number | undefined>(undefined);
  const [minTarget, setMinTarget] = useState<number | undefined>(undefined);
  const [maxTarget, setMaxTarget] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState<string>("-");
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [monthlyQuantityLatestYear, setMonthlyQuantityLatestYear] = useState<{ month: string; value: number }[]>([]);

  //ใช้กับตาราง
  const [search] = useState(""); //setSearch
  const [isModalVisible, setIsModalVisible] = useState(false);  // --- Modal สำหรับเพิ่ม/แก้ไข Infectious (ถ้าต้องการใช้) ---
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
    const storedColorGarbage = localStorage.getItem('colorGarbage');
    const storedColorAadc = localStorage.getItem('colorAadc');
    const storedColorCompareMonthlyGarbage = localStorage.getItem('colorCompareMonthlyGarbage');
    const storedColorCompareQuantity = localStorage.getItem('colorCompareQuantity');
    if (storedColorGarbage) setColorGarbage(storedColorGarbage);
    if (storedColorAadc) setColorAadc(storedColorAadc);
    if (storedColorCompareMonthlyGarbage) setColorCompareMonthlyGarbage(storedColorCompareMonthlyGarbage);
    if (storedColorCompareQuantity) setColorCompareQuantity(storedColorCompareQuantity);
  }, []);


  // ใช้กับกราฟ
  const fetchInfectiousData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lastInfectious, response, lastDayInfectious] = await Promise.all([
        GetfirstInfectious(),
        GetlistInfectious(),
        GetLastDayInfectious(),
      ]);
      // const response = await GetlistInfectious();
      if (response) {
        // กลุ่มข้อมูลตามวันที่
        const grouped: Record<string, { value: number[]; aadc: number[]; quantity: number[]; unit: string }> = {};

        response.data.forEach((item: any) => {
          const key = filterMode === "year"
            ? dayjs(item.Date).format("YYYY-MM")  // กลุ่มตามเดือน
            : dayjs(item.Date).format("YYYY-MM-DD"); // กลุ่มตามวัน

          if (!grouped[key]) grouped[key] = { value: [], aadc: [], quantity: [], unit: "" };
          grouped[key].value.push(item.MonthlyGarbage);
          grouped[key].aadc.push(item.Aadc);
          grouped[key].quantity.push(item.Quantity);
          grouped[key].unit = item.UnitName;
        });
        // หาผลรวม MonthlyGarbage ของปีล่าสุด
        const allYears = response.data.map((item: any) =>
          dayjs(item.Date).year()
        );
        const latestYear = Math.max(...allYears); // ปีล่าสุดจากข้อมูล
        const latestYearThai = latestYear + 543;
        const totalMonthlyGarbageLatestYear = response.data
          .filter((item: any) => dayjs(item.Date).year() === latestYear)
          .reduce(
            (sum: number, item: any) => sum + (item.MonthlyGarbage || 0),
            0
          );
        // หาผลรวม Quantity ของปีล่าสุด
        const totalQuantityLatestYear = response.data
          .filter((item: any) => dayjs(item.Date).year() === latestYear)
          .reduce(
            (sum: number, item: any) => sum + (item.Quantity || 0),
            0
          );

        // ดึงข้อมูลรายเดือนของปีล่าสุด และรวมค่าเดือนเดียวกัน
        const monthlyDataLatestYearMap: Record<string, number> = {};
        const monthlyQuantityLatestYearMap: Record<string, number> = {};

        response.data
          .filter((item: any) => dayjs(item.Date).year() === latestYear)
          .forEach((item: any) => {
            const month = dayjs(item.Date).format("MMM"); // ชื่อเดือน Jan, Feb,...
            if (!monthlyDataLatestYearMap[month]) monthlyDataLatestYearMap[month] = 0;
            monthlyDataLatestYearMap[month] += item.MonthlyGarbage || 0; // รวมค่าเดือนเดียวกัน
            // รวม Quantity
            if (!monthlyQuantityLatestYearMap[month]) monthlyQuantityLatestYearMap[month] = 0;
            monthlyQuantityLatestYearMap[month] += item.Quantity || 0;
          });

        // แปลงเป็น array สำหรับ ApexCharts
        const monthlyDataLatestYear = Object.entries(monthlyDataLatestYearMap).map(([month, value]) => ({ month, value }));
        const monthlyQuantityLatestYear = Object.entries(monthlyQuantityLatestYearMap).map(([month, value]) => ({ month, value }));

        // ฟังก์ชันสร้างช่วงวันที่ (ใช้ใน month/day mode)
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

        // เลือกช่วงวันที่
        let allDates: string[] = [];
        if (dateRange) {
          if (filterMode === "year") {
            const startYear = dateRange[0].year();
            const endYear = dateRange[1].year();
            allDates = Object.keys(grouped)
              .filter(monthStr => {
                const year = dayjs(monthStr).year();
                return year >= startYear && year <= endYear;
              })
              .sort();
          } else {
            allDates = createDateRange(dateRange[0], dateRange[1]);
          }
        } else {
          // ถ้าไม่ได้เลือก dateRange เอง
          const allDatesInData = Object.keys(grouped).sort();
          if (allDatesInData.length > 0) {
            if (filterMode === "year") {
              const latestMonth = dayjs(allDatesInData[allDatesInData.length - 1]);
              const startLimit = latestMonth.subtract(3, "year").startOf("month");
              allDates = allDatesInData.filter(monthStr => {
                const monthDate = dayjs(monthStr);
                return monthDate.isSame(startLimit) || monthDate.isAfter(startLimit);
              });
            } else if (filterMode === "month") {
              const latestDate = dayjs(allDatesInData[allDatesInData.length - 1]);
              allDates = createDateRange(latestDate.startOf("month"), latestDate.endOf("month"));
            } else {
              const latestDate = dayjs(allDatesInData[allDatesInData.length - 1]);
              allDates = createDateRange(latestDate.subtract(6, "day").startOf("day"), latestDate.endOf("day"));
            }
          }
        }
        const infectiousArr: { date: string; avgValue: number; unit: string }[] = [];
        const aadcArr: { date: string; avgValue: number; unit: string }[] = [];
        const compareArr: { date: string; monthlyGarbage: number; quantity: number; unit: string; }[] = [];


        allDates.forEach(date => {
          const values = grouped[date] || { value: [], aadc: [], quantity: [], unit: "" }; // ป้องกัน undefined

          // avg ขยะติดเชื้อ
          const avgInfectious = values.value.length
            ? values.value.reduce((a, b) => a + b, 0) / values.value.length
            : 0;
          infectiousArr.push({ date, avgValue: avgInfectious, unit: values.unit });

          // avg AADC
          const avgAADC = values.aadc.length
            ? values.aadc.reduce((a, b) => a + b, 0) / values.aadc.length
            : 0;
          aadcArr.push({ date, avgValue: avgAADC, /*unit: "AADC" */ unit: values.unit });

          // avg Quantity
          const avgQuantity = values.quantity.length
            ? values.quantity.reduce((a, b) => a + b, 0) / values.quantity.length
            : 0;

          // ชุดเปรียบเทียบ MonthlyGarbage vs Quantity
          compareArr.push({ date, monthlyGarbage: avgInfectious, quantity: avgQuantity, unit: values.unit, });
        });

        if (lastInfectious.data.MiddleTarget !== 0) {
          setMiddleTarget(lastInfectious.data.MiddleTarget);
          setMaxTarget(0); //แก้ให้เส้นมาตรฐานอัพเดท
          setMinTarget(0); //แก้ให้เส้นมาตรฐานอัพเดท
        } else {
          setMiddleTarget(0); //แก้ให้เส้นมาตรฐานอัพเดท
          setMaxTarget(lastInfectious.data.MaxTarget);
          setMinTarget(lastInfectious.data.MinTarget);
        }
        setListData(infectiousArr);
        setAADCData(aadcArr);
        setcompareMonthlyGarbageQuantity(compareArr);
        setTotalMonthlyGarbage(totalMonthlyGarbageLatestYear);
        setLatestYear(latestYearThai);
        setMonthlyDataLatestYear(monthlyDataLatestYear);
        setUnit(lastInfectious.data.UnitName);
        setTotalQuantity(totalQuantityLatestYear);
        setMonthlyQuantityLatestYear(monthlyQuantityLatestYear);
        console.log(lastDayInfectious)
        if (!lastDayInfectious || !lastDayInfectious.data || lastDayInfectious.data.length === 0) {
          setlastDayInfectious(null); // ✅ ตรงกับ type
          setError("ไม่พบข้อมูล Before/After FOG");
        } else {
          setlastDayInfectious(lastDayInfectious.data);
        }
      } else {
        setError("ไม่พบข้อมูลขยะติดเชื้อ");
      }
    } catch (err) {
      console.error("Error fetching Infectious data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // โหลดใหม่เมื่อเปลี่ยน filter
  useEffect(() => {
    fetchInfectiousData();
  }, [dateRange, filterMode]);

  //ใช้กับตาราง
  const loadInfectiousTable = async () => {
    try {
      const response2 = await GetInfectiousTABLE();
      if (!response2 || response2.length === 0) {
        setError("ไม่พบข้อมูล Infectious ของตาราง");
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
      console.error("Error fetching InfectiousTABLE data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล Infectious");
    }
  };

  // โหลดครั้งแรก
  useEffect(() => {
    loadInfectiousTable();
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
    enableZoom = false,
    isPercentChart = false,
  ): ApexOptions => {
    // จัด format ตาม filterMode
    const categoriesFormatted =
      isYearMode
        ? categories.map((month) => formatMonthLabel(month))
        : categories;

    const maxValueInData = Math.max(...dataSeries);
    const isStandardRange = minTarget !== undefined && maxTarget !== undefined && minTarget !== maxTarget;

    const standardCeil = middleTarget !== undefined && middleTarget !== 0 ? middleTarget : maxTarget ?? 0;
    const adjustedMax = Math.max(maxValueInData, standardCeil) * 1.1;

    return {
      chart: {
        type: chartType,
        zoom: { enabled: enableZoom, type: 'x', autoScaleYaxis: true },
        fontFamily: "Prompt, 'Prompt', sans-serif",
        toolbar: { show: true },
      },
      annotations: {
        yaxis: isPercentChart
          ? []
          : (isStandardRange
            ? [
              {
                y: minTarget ?? 0,
                borderWidth: 1.5,
                strokeDashArray: 6,
                borderColor: "rgba(255, 163, 24, 0.77)",
                label: { text: `มาตรฐานต่ำสุด ${minTarget ?? 0}`, style: { background: "rgba(255, 163, 24, 0.77)", color: "#fff" } },
              },
              {
                y: maxTarget ?? 0,
                borderWidth: 1.5,
                strokeDashArray: 6,
                borderColor: "#035303ff",
                label: { text: `มาตรฐานสูงสุด ${maxTarget ?? 0}`, style: { background: "rgba(3, 83, 3, 0.6)", color: "#fff" } },
              },
            ]
            : middleTarget !== undefined && middleTarget !== 0
              ? [
                {
                  y: middleTarget,
                  borderColor: "#FF6F61",
                  borderWidth: 2.5,
                  strokeDashArray: 6,
                  label: { text: `มาตรฐาน ${middleTarget}`, style: { background: "#FF6F61", color: "#fff" } },
                },
              ]
              : []
          )
      },
      xaxis: {
        categories: categoriesFormatted,
        // title: { text: filterMode === 'year' ? 'ปี' : filterMode === 'month' ? 'เดือน' : 'วันที่' },
        tickAmount: 6,
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
        max: adjustedMax,
        title: { text: (unit || "ค่า") },
        labels: {
          formatter: (value: number) => {
            // ถ้าเกิน 1000 แสดงเป็น k
            if (value >= 1000) {
              return `${(value / 1000).toFixed(2)}k`;
            } else {
              return value.toFixed(2);
            }

          }
        },
      },
      dataLabels: {
        enabled: false, // ถ้าเป็นกราฟ % ไม่ต้องโชว์ label บนจุด
      },
      tooltip: {
        y: {
          formatter: (val: number, opts) => {
            const seriesName = opts.w.config.series[opts.seriesIndex]?.name || '';
            const dataPointIndex = opts.dataPointIndex;

            // ค่าขยะติดเชื้อ
            if (seriesName === "ค่าขยะติดเชื้อ" && listdata && listdata.length > dataPointIndex) {
              const unit = listdata[dataPointIndex]?.unit || 'ไม่มีการตรวจวัด';
              if (unit === 'ไม่มีการตรวจวัด') return unit;
              return `${val.toFixed(2)} ${unit}`;
            }

            // ค่า AADC
            if (seriesName === "ค่า AADC" && aadcData && aadcData.length > dataPointIndex) {
              const unit = aadcData[dataPointIndex]?.unit || 'ไม่มีการตรวจวัด';
              if (unit === 'ไม่มีการตรวจวัด') return unit;
              return `${val.toFixed(2)} ${unit}`;
            }

            // MonthlyGarbage / Quantity
            if (["ค่าขยะติดเชื้อ", "จำนวนคน"].includes(seriesName)
              && compareMonthlyGarbageQuantity
              && compareMonthlyGarbageQuantity.length > dataPointIndex) {
              if (seriesName === "ค่าขยะติดเชื้อ") {
                const unit = compareMonthlyGarbageQuantity[dataPointIndex]?.unit;
                return unit ? `${val.toFixed(2)} ${unit}` : 'ไม่มีการตรวจวัด';
              } else if (seriesName === "จำนวนคน") {
                const quantity = compareMonthlyGarbageQuantity[dataPointIndex]?.quantity;
                return quantity ? `${quantity} คน` : 'ไม่มีการตรวจวัด';
              }
            }

            // Default fallback
            return `${val.toFixed(2)}`;
          }
        }
      },
      stroke: chartType === "line" ? { show: true, curve: "smooth", width: 3 } : { show: false },
      markers: chartType === "line" ? { size: 4.5, shape: ["circle", "triangle"], hover: { sizeOffset: 3 }, } : { size: 0 },
      legend: { show: true, showForSingleSeries: true, position: 'bottom', horizontalAlign: 'center', },
    };
  };

  const series = [{ name: "ค่าขยะติดเชื้อ", data: listdata.map(item => item.avgValue), color: colorGarbage }];
  const seriesAADC = [{ name: "ค่า AADC", data: aadcData.map(item => item.avgValue), color: colorAadc }];
  const seriesMonthlyGarbageQuantity = [
    { name: "ค่าขยะติดเชื้อ", data: compareMonthlyGarbageQuantity.map(item => item.monthlyGarbage), color: colorCompareMonthlyGarbage },
    { name: "จำนวนคน", data: compareMonthlyGarbageQuantity.map(item => item.quantity), color: colorCompareQuantity },
  ];
  const combinedCompareData = [
    ...seriesMonthlyGarbageQuantity[0].data,
    ...seriesMonthlyGarbageQuantity[1].data,
  ];
  const pieOptions: ApexCharts.ApexOptions = {
    labels: monthlyDataLatestYear.map(d => d.month),
    dataLabels: {
      enabled: false,
      dropShadow: {
        enabled: false // ปิดเงา label
      },
    },
    chart: {
      type: "donut",
      fontFamily: "Prompt, 'Prompt', sans-serif", // ใส่ font ทั้ง chart
    },
    legend: {
      show: false, // ปิด legend
    },
    stroke: {
      show: false, // ปิดขอบ
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()} Kg`,
      },
    },
    colors: [
      "#a3faffff", "#fff4a3ff", "#a3ffb2ff", "#ffa3a3ff",
      "#f9a3ffff", "#aba3ffff", "#26a69a", "#D10CE8",
      "#FF9800", "#A569BD", "#CD6155", "#5DADE2"
    ],
  };
  const pieSeries = monthlyDataLatestYear.map(d => d.value); monthlyQuantityLatestYear
  const pieSeriesQuantity = monthlyQuantityLatestYear.map(d => d.value);

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
      width: 150,
      sorter: (a, b) => {
        const da = dayjs(a.date);
        const db = dayjs(b.date);
        if (!da.isValid() && !db.isValid()) return 0;
        if (!da.isValid()) return -1;
        if (!db.isValid()) return 1;
        return da.valueOf() - db.valueOf(); // เรียงจากเก่าไปใหม่
      },
      render: (date: string) => {
        if (!date) return '-';
        const d = dayjs(date);
        if (!d.isValid()) return '-';
        return d.format('DD MMM ') + (d.year() + 543);
      }
    },
    {
      title: 'หน่วยที่วัด',
      dataIndex: 'unit_name',
      key: 'unit_name',
      width: 110,
      render: (unit: string) => unit || '-',
    },
    {
      title: 'จำนวนคน',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (val: number | null) => val != null ? val : '-',
    },
    {
      title: 'ปริมาณขยะต่อเดือน',
      dataIndex: 'monthly_garbage',
      key: 'monthly_garbage',
      width: 120,
      render: (val: number | null) => val != null ? val.toFixed(2) : '-',
    },
    {
      title: 'ปริมาณขยะต่อวัน',
      dataIndex: 'average_daily_garbage',
      key: 'average_daily_garbage',
      width: 120,
      render: (val: number | null) => val != null ? val.toFixed(2) : '-',
    },
    {
      title: 'ค่า AADC',
      dataIndex: 'aadc',
      key: 'aadc',
      width: 120,
      render: (val: number | null) => val != null ? val.toFixed(2) : '-',
    },
    {
      title: 'ค่า Target',
      key: 'target_value',
      width: 150,
      render: (_, r) =>
        r.min_target || r.max_target
          ? `${r.min_target.toFixed(2)} - ${r.max_target.toFixed(2)}`
          : r.target_value?.toFixed(2) ?? '-'
    },
    {
      title: "สถานะ",
      key: "status",
      width: 200,
      render: (_, record) => {
        const s = record.status;
        const getBadge = (icon: React.ReactNode, text: string, className: string) => (
          <span className={`tds-status-badge ${className}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {icon}
            <span>{text}</span>
          </span>
        );
        if (!s) return getBadge(<QuestionCircleFilled style={{ fontSize: 18 }} />, "ไม่มีข้อมูล", "status-none");
        if (s.includes("ไม่ผ่าน")) return getBadge(<CloseCircleFilled style={{ fontSize: 18 }} />, s, "status-high");
        if (s.includes("ผ่าน")) return getBadge(<CheckCircleFilled style={{ fontSize: 18 }} />, s, "status-good");
        return getBadge(<QuestionCircleFilled style={{ fontSize: 20 }} />, "ไม่มีข้อมูล", "status-none");
      }
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'note',
      key: 'note',
      width: 90,
      render: (note: string) => note || '-',
    },
    {
      title: 'จัดการข้อมูล',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => {
        // console.log('record:', record);
        return (
          <div className="infectious-action-buttons">
            <Tooltip title="แก้ไข">
              <button
                className="infectious-circle-btn infectious-edit-btn"
                // onClick={() => handleEdit([record.before_id, record.after_id])}
                onClick={() => handleEdit(record.id)}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title="ลบ">
              <button
                className="infectious-circle-btn infectious-delete-btn"
                onClick={() => handleDelete(record.id)}
              >
                <DeleteOutlined />
              </button>
            </Tooltip>
          </div>
        );
      }
    }
  ];

  const handleEdit = async (id?: number) => {
    console.log("ID:", id);

    if (typeof id !== 'number') {
      message.error("ไม่พบ ID สำหรับแก้ไข");
      return;
    }

    try {
      const res = await GetInfectiousbyID(id);

      if (!res || res.status !== 200) {
        message.error("ไม่พบข้อมูลสำหรับแก้ไข");
        return;
      }

      setEditRecord([res.data]); // ถ้า state เดิมเก็บ array ให้ wrap เป็น array
      setIsEditModalVisible(true);
    } catch (error) {
      console.error("Error fetching Infectious data:", error);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };

  //ใช้กับตาราง
  const handleDelete = (id: number | null | undefined) => {
    if (!id) {
      message.error("ID ไม่ถูกต้อง");
      return;
    }

    confirm({
      title: "คุณแน่ใจหรือไม่?",
      icon: <ExclamationCircleFilled />,
      content: "คุณต้องการลบข้อมูลรายการนี้ใช่หรือไม่?",
      okText: "ใช่, ลบเลย",
      okType: "danger",
      cancelText: "ยกเลิก",
      async onOk() {
        try {
          await DeleteAllInfectiousRecordsByDate(id);
          message.success("ลบข้อมูลสำเร็จ");
          await fetchInfectiousData();
          await loadInfectiousTable();
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
      <div className="infectious-title-header">
        <div>
          <h1>Infectious Waste</h1>
          <p>ขยะที่มีเชื้อโรคหรือปนเปื้อนสารชีวภาพอาจก่อให้เกิดการแพร่กระจายของโรคได้</p>
        </div>
        <div className="infectious-card">
          <img src={PhotoMonthlyGarbage} alt="Quantity People" className="infectious-photo" />
          <div>
            <h4>ขยะอันตรายต่อเดือนล่าสุด</h4>
            <div className="infectious-main">
              <span>
                {lastDayInfectious !== null ? (
                  <>
                    <span className="infectious-value">{lastDayInfectious.MonthlyGarbage.toLocaleString()}</span>{" "}
                    {lastDayInfectious.UnitName || ""}
                  </>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <br />
          </div>
          <img src={PhotoDailyGarbage} alt="After Water" className="infectious-photo" />
          <div>
            <h4>ขยะอันตรายต่อเดือนวันล่าสุด</h4>
            <div className="infectious-main">
              <span>
                {lastDayInfectious !== null ? (
                  <>
                    <span className="infectious-value">{lastDayInfectious.AverageDailyGarbage.toLocaleString()}</span>{" "}
                    {lastDayInfectious.UnitName || ""}
                  </>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <br />
          </div>
          <img src={PhotoAADC} alt="Before Water" className="infectious-photo" />
          <div>
            <h4>ค่า AADC ล่าสุด</h4>
            <div className="infectious-main">
              <span>
                {lastDayInfectious !== null ? (
                  <>
                    <span className="infectious-value">{lastDayInfectious.AADC}</span>{" "}
                    {lastDayInfectious.UnitName || ""}
                  </>
                ) : (
                  "-"
                )}
              </span>
            </div>
            {lastDayInfectious ? (
              <p>
                มาตรฐาน{" "}
                <span>
                  {
                    (lastDayInfectious.MiddleTarget !== null && lastDayInfectious.MiddleTarget !== 0) || (lastDayInfectious.MinTarget !== null && lastDayInfectious.MinTarget !== 0) || (lastDayInfectious.MaxTarget !== null && lastDayInfectious.MaxTarget !== 0) || (lastDayInfectious.UnitName && lastDayInfectious.UnitName.trim() !== "")
                      ? (lastDayInfectious.MiddleTarget !== null && lastDayInfectious.MiddleTarget !== 0
                        ? lastDayInfectious.MiddleTarget : `${(lastDayInfectious.MinTarget !== null && lastDayInfectious.MinTarget !== 0 ? lastDayInfectious.MinTarget : "-")} - ${(lastDayInfectious.MaxTarget !== null && lastDayInfectious.MaxTarget !== 0 ? lastDayInfectious.MaxTarget : "-")}`)
                      : "-"
                  }
                </span>{" "}
                {lastDayInfectious.UnitName || ""}
              </p>
            ) : (
              <p>Loading...</p>
            )}

          </div>
        </div>
      </div>
      <div style={{ padding: "20px", backgroundColor: "#F8F9FA" }}>
        <div className="infectious-title">
          <div>
            <h1
              className="infectious-title-text"
              onClick={() => navigate(-1)}
              style={{ cursor: 'pointer' }}
            >
              <LeftOutlined className="infectious-back-icon" />
              กราฟ Infectious Waste
            </h1>
          </div>
          <div className="infectious-select-date">
            <div>
              <Select

                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  setDateRange(null); // เคลียร์ช่วงวันที่เดิม
                }}
                className="infectious-select-filter"
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
        <div className="infectious-graph-container">
          {/* ฝั่งซ้าย */}
          <div className="infectious-graph-left">
            <div className="infectious-graph-card">
              <div className="infectious-head-graph-card">
                <div className="infectious-width25">
                  <h2 className="infectious-head-graph-card-text" >กราฟขยะ</h2>
                </div>
                <div>
                  <ColorPicker
                    value={colorGarbage}
                    onChange={(color: Color) => {
                      const hex = color.toHexString();
                      setColorGarbage(hex);
                      localStorage.setItem('colorGarbage', hex);
                    }}
                  />
                </div>
              </div>
              <div className="infectious-right-select-graph">
                <Select
                  value={chartTypeData}
                  onChange={val => setChartTypeData(val)}
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
                key={chartTypeData}
                options={getChartOptions(
                  listdata.map(item => item.date),      // array ของวันที่/เดือน/ปี
                  chartTypeData,          // ประเภท chart
                  filterMode === "year",   // 'day' | 'month' | 'year'
                  series[0]?.data || [],
                  false,          // array ของตัวเลข
                  true            // isPercentChart (true/false)
                )} series={series}
                type={chartTypeData}
                style={{ flex: 1 }}
              />
            </div>
            <div className="infectious-graph-card">
              <div className="infectious-head-graph-card">
                <div className="infectious-width40">
                  <h2 className="infectious-head-graph-card-text" >กราฟขยะต่อคน</h2>
                </div>
                <div>
                  <ColorPicker
                    value={colorCompareMonthlyGarbage}
                    onChange={(color: Color) => {
                      const hex = color.toHexString();
                      setColorCompareMonthlyGarbage(hex);
                      localStorage.setItem('colorCompareMonthlyGarbage', hex);
                    }}
                  />
                  <ColorPicker
                    value={colorCompareQuantity}
                    onChange={(color: Color) => {
                      const hex = color.toHexString();
                      setColorCompareQuantity(hex);
                      localStorage.setItem('colorCompareQuantity', hex);
                    }}
                  />
                </div>
              </div>

              <div className="infectious-right-select-graph">
                <Select
                  value={chartTypeCompareMonthlyGarbageQuantity}
                  onChange={val => setChartTypeCompareMonthlyGarbageQuantity(val)}
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
                key={chartTypeCompareMonthlyGarbageQuantity}
                options={getChartOptions(
                  compareMonthlyGarbageQuantity.map(item => item.date),      // array ของวันที่/เดือน/ปี
                  chartTypeCompareMonthlyGarbageQuantity,          // ประเภท chart
                  filterMode === "year",   // 'day' | 'month' | 'year'
                  combinedCompareData,
                  false,          // array ของตัวเลข
                  true            // isPercentChart (true/false)
                )} series={seriesMonthlyGarbageQuantity}
                type={chartTypeCompareMonthlyGarbageQuantity}
                style={{ flex: 1 }}
              />
            </div>
          </div>
          {/* ฝั่งขวา */}
          <div className="infectious-graph-right">
            <div className="infectious-graph-card">
              <div className="infectious-head-graph-card">
                <div className="infectious-width25">
                  <h2 className="infectious-head-graph-card-text" >AADC</h2>
                </div>
                <div>
                  <ColorPicker
                    value={colorAadc}
                    onChange={(color: Color) => {
                      const hex = color.toHexString();
                      setColorAadc(hex);
                      localStorage.setItem('colorAadc', hex);
                    }}
                  />
                </div>
              </div>
              <div className="infectious-right-select-graph">
                <Select
                  value={chartTypeAadc}
                  onChange={val => setChartTypeAadc(val)}
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
                key={chartTypeAadc}
                options={getChartOptions(
                  aadcData.map(item => item.date),      // array ของวันที่/เดือน/ปี
                  chartTypeAadc,          // ประเภท chart
                  filterMode === "year",   // 'day' | 'month' | 'year'
                  seriesAADC[0]?.data || [],
                  false,          // array ของตัวเลข
                  false            // isPercentChart (true/false)
                )} series={seriesAADC}
                type={chartTypeAadc}
                height="85%"
              />
            </div>
            <div className="infectious-small-card-container">
              <div className="infectious-box">
                <div className="infectious-box-title">จำนวนขยะรวมปี {latestYear}</div>
                <div className="infectious-box-number">
                  <div>
                    <div >
                      {totalMonthlyGarbage.toLocaleString()} Kg
                    </div >
                    <div>
                      <Chart
                        options={pieOptions}
                        series={pieSeries}
                        type="donut"
                        width={90}
                        height={90}
                      />
                    </div>
                  </div>
                </div>
                <span className="infectious-box-date">Date per 29 June 2024</span>
              </div>
              <div className="infectious-box">
                <div className="infectious-box-title">จำนวนคนรวมปี {latestYear}</div>
                <div className="infectious-box-number">
                  <div>
                    <div >
                      {totalQuantity.toLocaleString()} คน
                    </div >
                    <div>
                      <Chart
                        options={pieOptions}
                        series={pieSeriesQuantity}
                        type="donut"
                        width={90}
                        height={90}
                      />
                    </div>
                  </div>
                </div>
                <span className="infectious-box-date">Date per 29 June 2024</span>
              </div>
            </div>
          </div>
        </div>
        <div className="infectious-header-vis">
          <h1 className="infectious-title-text-vis">ข้อมูล Infectious Waste</h1>
          <div className="infectious-btn-container">
            <button className="infectious-add-btn" onClick={showModal}>เพิ่มข้อมูลใหม่</button>
          </div>
        </div>
        <div className="infectious-select-date">
          <div className="infectious-filter-status-and-efficiency">
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
          <div className="infectious-filter-date">
            <div >
              <Select
                value={tableFilterMode}
                onChange={(val) => {
                  setTableFilterMode(val);
                  setTableDateRange(null);
                }}
                className="infectious-select-filter"
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
        <div className="infectious-table-data">
          <div className="infectious-width40">
            <h1 className="infectious-title-text-table">ตารางรายงานผลการดำเนินงาน</h1>
          </div>
          <div className="infectious-task-summary">
            <div className="infectious-task-total">จำนวนทั้งหมด <span style={{ color: "#1a4b57", fontWeight: "bold" }}>{totalTasks}</span> วัน</div>
            <div className="infectious-task-stats">
              <div className="infectious-task-item">
                <div className="infectious-task-number">{doneTasks}</div>
                <div className="infectious-task-label">ผ่านเกณฑ์มาตรฐาน</div>
              </div>
              <div className="infectious-task-divider" />
              <div className="infectious-task-item">
                <div className="infectious-task-number">{inProgressTasks}</div>
                <div className="infectious-task-label">ไม่ผ่านเกณฑ์มาตรฐาน</div>
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
          title={"เพิ่มข้อมูล Infectious Waste ใหม่"}
          open={isModalVisible}
          footer={null}
          width={1100}
          destroyOnClose
          closable={false}
          centered
        >
          <InfectiousCentralForm onCancel={handleAddModalCancel}
            onSuccess={async () => {
              await fetchInfectiousData();      // ✅ โหลดข้อมูลกราฟใหม่
              await loadInfectiousTable();   // ✅ โหลดข้อมูลตารางใหม่
            }}
          />
        </Modal>
        <Modal
          title="แก้ไขข้อมูล Infectious Waste"
          open={isEditModalVisible}
          footer={null}
          width={1100}
          closable={false}
          destroyOnClose
          centered
          onCancel={handleEditModalCancel}
        >
          {editingRecord && (
            <UpdateInfectiousCentralForm
              initialValues={editingRecord}
              onSuccess={() => {
                setTimeout(async () => {
                  setIsEditModalVisible(false);
                  setEditRecord(null);
                  await loadInfectiousTable();
                  await fetchInfectiousData();
                }, 500);
              }}
              onCancel={handleEditModalCancel}
            />
          )}
        </Modal>

      </div>
    </div>
  );
};

export default InfectiousWaste;
