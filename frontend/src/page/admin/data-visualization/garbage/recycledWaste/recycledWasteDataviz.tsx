//ใช้ทั้งกราฟและตาราง
import React, { useEffect, useRef, useState } from "react";
import { Select, DatePicker, Modal, message, Tooltip, Button } from "antd";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import './recycledWasteDataviz.css';
import dayjs, { Dayjs } from "dayjs";
import { GetlistRecycled, GetfirstRecycled, GetLastDayRecycled } from "../../../../../services/garbageServices/recycledWaste";
import PhotoMonthlyGarbage from "../../../../../assets/waste/container.png"
import PhotoDailyGarbage from "../../../../../assets/waste/garbage-bag.png"
import { listChemicalInterface } from "../../../../../interface/Igarbage/IchemicalWaste";
const isMobile = window.innerWidth <= 768;
import { FormOutlined } from '@ant-design/icons';

// ใช้กับกราฟ
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { BarChart3, LineChart, Maximize2 } from "lucide-react";
import Chart from "react-apexcharts";

//ใช้กับตาราง
import Table, { ColumnsType } from "antd/es/table";
import { GetRecycledbyID, GetRecycledTABLE, DeleteAllRecycledRecordsByDate } from "../../../../../services/garbageServices/recycledWaste";
import UpdateRecycledCentralForm from "../../../data-management/garbage/recycledWaste/updateRecycledCenter";
import RecycledCentralForm from "../../../data-management/garbage/recycledWaste/recycledWaste"

//ใช้ตั้งค่าวันที่ให้เป็นภาษาไทย
import 'dayjs/locale/th';
dayjs.locale('th');
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const Recycleddataviz: React.FC = () => {
  const navigate = useNavigate();

  //ใช้ทั้งกราฟและตาราง
  const [data, setData] = useState<any[]>([]); // ดึง Recycled ทั้งหมด
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterMode, setFilterMode] = useState<"dateRange" | "month" | "year">("year");
  const [lastDayRecycled, setlastDayRecycled] = useState<listChemicalInterface | null>(null);

  //ใช้กับกราฟ
  const [listdata, setListData] = useState<{ unit: string; date: string; avgValue: number }[]>([]);
  const [TotalSaleData, setTotalSaleData] = useState<{ date: string; avgValue: number; unit: string }[]>([]);
  const [compareMonthlyGarbageQuantity, setcompareMonthlyGarbageQuantity] = useState<{ date: string; monthlyGarbage: number; quantity: number; unit: string }[]>([]);
  const [chartTypeData, setChartTypeData] = useState<'bar' | 'line'>('line');
  const [chartTypeTotalSale, setChartTypeTotalSale] = useState<'bar' | 'line'>('line');
  const [chartTypeCompareMonthlyGarbageQuantity, setChartTypeCompareMonthlyGarbageQuantity] = useState<'bar' | 'line'>('line');
  const [colorGarbage, setColorGarbage] = useState<string>("#2abdbf");
  const [colorAadc, setColorAadc] = useState<string>("#1a4b57");
  const [colorCompareMonthlyGarbage, setColorCompareMonthlyGarbage] = useState<string>("#2abdbf");
  const [colorCompareQuantity, setColorCompareQuantity] = useState<string>("#1a4b57");
  const [totalMonthlyGarbage, setTotalMonthlyGarbage] = useState(0);
  const [latestYear, setLatestYear] = useState<number | null>(null);
  const [monthlyDataLatestYear, setMonthlyDataLatestYear] = useState<{ month: string; value: number; unit: string }[]>([]);
  const [middleTarget, setMiddleTarget] = useState<number | undefined>(undefined);
  const [, setMinTarget] = useState<number | undefined>(undefined); //minTarget
  const [maxTarget, setMaxTarget] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState<string>("-");
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const [monthlyQuantityLatestYear, setMonthlyQuantityLatestYear] = useState<{ month: string; value: number; unit: string }[]>([]);
  const [totalTotalSale, setTotalSale] = useState<number>(0);
  const [monthlyTotalSaleLatestYear, setMonthlyTotalSaleLatestYear] = useState<{ month: string; value: number; unit: string }[]>([]);
  const [modalGraphType, setModalGraphType] = useState<"garbage" | "garbageperpeople" | "totalsale" | null>(null);//modalGraphType
  const [modalVisible, setModalVisible] = useState(false);


  //ใช้กับตาราง
  const [search] = useState(""); //setSearch
  const [isModalVisible, setIsModalVisible] = useState(false);  // --- Modal สำหรับเพิ่ม/แก้ไข Recycled (ถ้าต้องการใช้) ---
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditRecord] = useState<any>(null);
  const { confirm } = Modal;
  const [tableFilterMode, setTableFilterMode] = useState<"dateRange" | "month" | "year">("year");
  const [tableDateRange, setTableDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const totalTasks = data.length;

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
  const fetchRecycledData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lastRecycled, response, lastDayRecycled] = await Promise.all([
        GetfirstRecycled(),
        GetlistRecycled(),
        GetLastDayRecycled(),
      ]);
      console.log(response.data)
      // const response = await GetlistRecycled();
      if (response) {
        // กลุ่มข้อมูลตามวันที่
        const grouped: Record<string, { value: number[]; TotalSale: number[]; quantity: number[]; unit: string }> = {};

        response.data.forEach((item: any) => {
          const key = filterMode === "year"
            ? dayjs(item.Date).format("YYYY-MM")  // กลุ่มตามเดือน
            : dayjs(item.Date).format("YYYY-MM-DD"); // กลุ่มตามวัน

          if (!grouped[key]) grouped[key] = { value: [], TotalSale: [], quantity: [], unit: "" };
          grouped[key].value.push(item.MonthlyGarbage);
          grouped[key].TotalSale.push(item.TotalSale);
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

        // รวมค่า TotalSale ของปีล่าสุด
        const totalSaleLatestYear = response.data
          .filter((item: any) => dayjs(item.Date).year() === latestYear)
          .reduce((sum: number, item: any) => sum + (item.TotalSale || 0), 0);

        // ดึงข้อมูลรายเดือนของปีล่าสุด และรวมค่าเดือนเดียวกัน
        // ใช้ object ที่เก็บ { value, unit }
        const monthlyDataLatestYearMap: Record<string, { value: number; unit: string }> = {};
        const monthlyQuantityLatestYearMap: Record<string, { value: number; unit: string }> = {};
        const monthlyTotalSaleLatestYearMap: Record<string, { value: number; unit: string }> = {};

        response.data
          .filter((item: any) => dayjs(item.Date).year() === latestYear)
          .forEach((item: any) => {
            const month = dayjs(item.Date).format("MMM");

            // MonthlyGarbage
            if (!monthlyDataLatestYearMap[month]) {
              monthlyDataLatestYearMap[month] = { value: 0, unit: item.UnitName };
            }
            monthlyDataLatestYearMap[month].value += item.MonthlyGarbage || 0;

            // Quantity (fix unit = "คน")
            if (!monthlyQuantityLatestYearMap[month]) {
              monthlyQuantityLatestYearMap[month] = { value: 0, unit: "คน" };
            }
            monthlyQuantityLatestYearMap[month].value += item.Quantity || 0;

            // TotalSale (fix unit = "บาท")
            if (!monthlyTotalSaleLatestYearMap[month]) {
              monthlyTotalSaleLatestYearMap[month] = { value: 0, unit: "บาท" };
            }
            monthlyTotalSaleLatestYearMap[month].value += item.TotalSale || 0;
          });

        // แปลงเป็น array
        const monthlyDataLatestYear = Object.entries(monthlyDataLatestYearMap).map(
          ([month, { value, unit }]) => ({ month, value, unit })
        );

        const monthlyQuantityLatestYear = Object.entries(monthlyQuantityLatestYearMap).map(
          ([month, { value, unit }]) => ({ month, value, unit })
        );

        const monthlyTotalSaleLatestYear = Object.entries(monthlyTotalSaleLatestYearMap).map(
          ([month, { value, unit }]) => ({ month, value, unit })
        );

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
        const recycledArr: { date: string; avgValue: number; unit: string }[] = [];
        const TotalSaleArr: { date: string; avgValue: number; unit: string }[] = [];
        const compareArr: { date: string; monthlyGarbage: number; quantity: number; unit: string; }[] = [];


        allDates.forEach(date => {
          const values = grouped[date] || { value: [], TotalSale: [], quantity: [], unit: "" }; // ป้องกัน undefined

          // avg ขยะรีไซเคิล
          const avgRecycled = values.value.length
            ? values.value.reduce((a, b) => a + b, 0) / values.value.length
            : 0;
          recycledArr.push({ date, avgValue: avgRecycled, unit: values.unit });

          // avg TotalSale
          const avgTotalSale = values.TotalSale.length
            ? values.TotalSale.reduce((a, b) => a + b, 0) / values.TotalSale.length
            : 0;
          TotalSaleArr.push({ date, avgValue: avgTotalSale, /*unit: "TotalSale" */ unit: values.unit });

          // avg Quantity
          const avgQuantity = values.quantity.length
            ? values.quantity.reduce((a, b) => a + b, 0) / values.quantity.length
            : 0;

          // ชุดเปรียบเทียบ MonthlyGarbage vs Quantity
          compareArr.push({ date, monthlyGarbage: avgRecycled, quantity: avgQuantity, unit: values.unit, });
        });

        if (lastRecycled.data.MiddleTarget !== 0) {
          setMiddleTarget(lastRecycled.data.MiddleTarget);
          setMaxTarget(0); //แก้ให้เส้นมาตรฐานอัพเดท
          setMinTarget(0); //แก้ให้เส้นมาตรฐานอัพเดท
        } else {
          setMiddleTarget(0); //แก้ให้เส้นมาตรฐานอัพเดท
          setMaxTarget(lastRecycled.data.MaxTarget);
          setMinTarget(lastRecycled.data.MinTarget);
        }
        console.log("monthlyDataLatestYear")
        console.log(monthlyDataLatestYear)
        setListData(recycledArr);
        setTotalSaleData(TotalSaleArr);
        setcompareMonthlyGarbageQuantity(compareArr);
        setTotalMonthlyGarbage(totalMonthlyGarbageLatestYear);
        setLatestYear(latestYearThai);
        setMonthlyDataLatestYear(monthlyDataLatestYear);
        setUnit(lastRecycled.data.UnitName);
        setTotalQuantity(totalQuantityLatestYear);
        setMonthlyQuantityLatestYear(monthlyQuantityLatestYear);
        setTotalSale(totalSaleLatestYear);
        setMonthlyTotalSaleLatestYear(monthlyTotalSaleLatestYear);
        if (!lastDayRecycled || !lastDayRecycled.data || lastDayRecycled.data.length === 0) {
          setlastDayRecycled(null); // ✅ ตรงกับ type
          setError("ไม่พบข้อมูล Before/After FOG");
        } else {
          setlastDayRecycled(lastDayRecycled.data);
        }
        console.log(lastDayRecycled.data)
      } else {
        setError("ไม่พบข้อมูลขยะรีไซเคิล");
      }
    } catch (err) {
      console.error("Error fetching Recycled data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // โหลดใหม่เมื่อเปลี่ยน filter
  useEffect(() => {
    fetchRecycledData();
  }, [dateRange, filterMode]);

  const listdataRef = useRef(listdata);
  const compareRef = useRef(compareMonthlyGarbageQuantity);
  useEffect(() => {
    listdataRef.current = listdata;
  }, [listdata]);
  useEffect(() => {
    compareRef.current = compareMonthlyGarbageQuantity;
  }, [compareMonthlyGarbageQuantity]);

  //ใช้กับตาราง
  const loadRecycledTable = async () => {
    try {
      const response2 = await GetRecycledTABLE();
      if (!response2 || response2.length === 0) {
        setError("ไม่พบข้อมูล Recycled ของตาราง");
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
      console.error("Error fetching RecycledTABLE data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล Recycled");
    }
  };

  // โหลดครั้งแรก
  useEffect(() => {
    loadRecycledTable();
  }, []);

  //ใช้กับกราฟ
  const getChartOptions = (
    categories: string[],
    chartType: 'line' | 'bar',
    isYearMode = false,
    dataSeries: number[],
    enableZoom = false,
    isTotalsaleChart = false,
    isDualAxis = false,
  ): ApexOptions => {
    // จัด format ตาม filterMode
    const categoriesFormatted =
      isYearMode
        ? categories.map((month) => formatMonthLabel(month))
        : categories;

    const maxValueInData = Math.max(...dataSeries);
    // const isStandardRange = minTarget !== undefined && maxTarget !== undefined && minTarget !== maxTarget;

    const standardCeil = middleTarget !== undefined && middleTarget !== 0 ? middleTarget : maxTarget ?? 0;
    const adjustedMax = Math.max(maxValueInData, standardCeil) * 1.1;

    return {
      chart: {
        type: chartType,
        zoom: { enabled: enableZoom, type: 'x', autoScaleYaxis: true },
        fontFamily: "Prompt, 'Prompt', sans-serif",
        toolbar: {
          show: true,
          tools: {
            download: true, selection: true, zoom: true, zoomin: !isMobile, zoomout: !isMobile, pan: !isMobile, reset: true
          }
        },
      },
      xaxis: {
        categories: categoriesFormatted,
        title: { text: "วัน/เดือน/ปี" },
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
      yaxis: isDualAxis
        ? [
          {
            min: 0,
            max: 1,
            labels: {
              formatter: (val) => val.toFixed(2)  // แสดง 0.00, 0.25, 0.50 ...
            },
            title: { text: "Normalized" }
          },
        ]
        : {
          min: 0,
          max: adjustedMax,
          title: {
            text: isTotalsaleChart ? "ค่า (บาท)" : unit || "ค่า"
          },
          labels: {
            formatter: (value: number) =>
              value >= 1000
                ? `${(value / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}k` // value ≥ 1000 → ย่อ k
                : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            // isTotalsaleChart
            //   ? `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`         // ใช้บาท, ไม่ย่อ k
            //   : value >= 1000
            //     ? `${(value / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}k` // ใช้ unit, ย่อ k
            //     : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),               // ใช้ unit, ไม่ย่อ k
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

            // ค่าขยะรีไซเคิล
            if (seriesName === "ค่าขยะรีไซเคิล" && listdataRef.current.length > dataPointIndex) {
              const unit = listdataRef.current[dataPointIndex]?.unit || 'ไม่มีการตรวจวัด';
              if (unit === 'ไม่มีการตรวจวัด') return unit;
              return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
            }

            // ค่า TotalSale
            if (seriesName === "ยอดขายขยะรีไซเคิล" && TotalSaleData && TotalSaleData.length > dataPointIndex) {
              const unit = TotalSaleData[dataPointIndex]?.unit || 'ไม่มีการตรวจวัด';
              if (unit === 'ไม่มีการตรวจวัด') return unit;
              return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
            }

            // MonthlyGarbage / Quantity (normalized แต่ tooltip ต้องแสดงค่าจริง)
            if (["ค่าขยะรีไซเคิล (Normalize)", "จำนวนคน (Normalize)"].includes(seriesName)
              && compareRef.current.length > dataPointIndex) {

              if (seriesName === "ค่าขยะรีไซเคิล (Normalize)") {
                const realVal = compareRef.current[dataPointIndex]?.monthlyGarbage ?? 0;
                const unit = compareRef.current[dataPointIndex]?.unit;
                return unit
                  ? `${realVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`
                  : 'ไม่มีการตรวจวัด';
              }

              if (seriesName === "จำนวนคน (Normalize)") {
                const realVal = compareRef.current[dataPointIndex]?.quantity ?? 0;
                const unit = compareRef.current[dataPointIndex]?.unit;
                return unit ? `${realVal.toLocaleString()} คน` : 'ไม่มีการตรวจวัด';
              }
            }

            // Default fallback
            return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
        }
      },
      stroke: chartType === "line" ? { show: true, curve: "smooth", width: 3 } : { show: false },
      markers: chartType === "line" ? { size: isMobile ? 0 : 4.5, shape: ["circle", "triangle"], hover: { sizeOffset: 3 }, } : { size: 0 },
      legend: { show: true, showForSingleSeries: true, position: 'top', horizontalAlign: 'center', },
    };
  };

  const series = [{ name: "ค่าขยะรีไซเคิล", data: listdata.map(item => item.avgValue), color: colorGarbage }];
  const seriesTotalSale = [{ name: "ยอดขายขยะรีไซเคิล", data: TotalSaleData.map(item => item.avgValue), color: colorAadc }];
  // ฟังก์ชัน Normalize (Min-Max)
  const normalizeData = (data: number[]): number[] => {
    if (data.length === 0) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);

    if (min === max) {
      if (min === 0) {
        return data.map(() => 0);      // ทุกค่า = 0 → normalize เป็น 0
      } else {
        return data.map(() => 0.5);    // ทุกค่าเท่ากัน แต่ไม่ใช่ 0 → normalize เป็น 0.5
      }
    }

    return data.map(val => (val - min) / (max - min));
  };

  // ดึงข้อมูลดิบ
  const garbageRaw = compareMonthlyGarbageQuantity.map(item => item.monthlyGarbage);
  const quantityRaw = compareMonthlyGarbageQuantity.map(item => item.quantity);

  // Normalize
  const garbageNormalized = normalizeData(garbageRaw);
  const quantityNormalized = normalizeData(quantityRaw);

  // สร้าง series แบบ normalize
  const seriesMonthlyGarbageQuantityNormalized = [
    { name: "ค่าขยะรีไซเคิล (Normalize)", data: garbageNormalized, color: colorCompareMonthlyGarbage },
    { name: "จำนวนคน (Normalize)", data: quantityNormalized, color: colorCompareQuantity },
  ];

  //  ใช้ normalized มาคำนวณ combinedCompareData
  const combinedCompareData = [
    ...garbageNormalized,
    ...quantityNormalized,
  ];

  const getPieOptions = (isQuantityChart = false, isTotalSaleChart = false): ApexCharts.ApexOptions => ({
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
      position: "right",
      horizontalAlign: "left",
      offsetY: -23,  // ปรับค่าลบเพื่อดันขึ้น (ลองปรับจนเสมอ donut)
      offsetX: 0,
      markers: { size: 5, },
      itemMargin: { horizontal: 8, vertical: 4, },
      fontSize: "10px",
      labels: { colors: "#ffffffff", },
    },
    stroke: {
      show: false, // ปิดขอบ
    },
    tooltip: {
      y: {
        formatter: (val: number, opts) => {
          const index = opts.dataPointIndex;

          if (isQuantityChart) {
            const unit = monthlyQuantityLatestYear[index]?.unit || "";
            return `${val.toLocaleString()} ${unit}`;
          }
          if (isTotalSaleChart) {
            const unit = monthlyTotalSaleLatestYear[index]?.unit || "";
            return `${val.toLocaleString()} ${unit}`;
          }
          const unit = monthlyDataLatestYear[index]?.unit || "";
          return `${val.toLocaleString()} ${unit}`;
        },
      },
    },
    colors: [
      "#a3faffff", "#fff4a3ff", "#a3ffb2ff", "#ffa3a3ff", "#f9a3ffff", "#aba3ffff", "#26a69a", "#D10CE8", "#FF9800", "#A569BD", "#CD6155", "#5DADE2"
    ],
  });
  const pieSeries = monthlyDataLatestYear.map(d => d.value); monthlyQuantityLatestYear
  const pieSeriesQuantity = monthlyQuantityLatestYear.map(d => d.value);
  const pieSeriesTotalsale = monthlyTotalSaleLatestYear.map(d => d.value);

  //ใช้กับกราฟ --- ฟังก์ชันช่วยแปลงชื่อเดือนไทย ---
  const monthShortNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const monthIndex = parseInt(month, 10) - 1;
    const thaiYear = parseInt(year) + 543;
    return `${monthShortNames[monthIndex]} ${thaiYear}`;
  };

  const openModal = (type: "garbage" | "garbageperpeople" | "totalsale") => {
    setModalGraphType(type);
    setModalVisible(true);
  };
  //ใช้กับกราฟ
  const closeModal = () => {
    setModalVisible(false);
    setModalGraphType(null);
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
      title: 'จำนวนคน',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (val: number | null) => val != null ? val.toLocaleString() : '-',
    },
    {
      title: 'ปริมาณขยะต่อเดือน',
      dataIndex: 'monthly_garbage',
      key: 'monthly_garbage',
      width: 150,
      render: (val: number | null) => val != null ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
    },
    {
      title: 'ปริมาณขยะต่อวัน',
      dataIndex: 'average_daily_garbage',
      key: 'average_daily_garbage',
      width: 150,
      render: (val: number | null) => val != null ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
    },
    {
      title: 'ยอดขาย',
      dataIndex: 'total_sale',
      key: 'total_sale',
      width: 120,
      render: (val: number | null) => val != null ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'note',
      key: 'note',
      width: 150,
      render: (note: string) => note || '-', // ✅ แสดงตรงๆ
    },
    {
      title: 'จัดการข้อมูล',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => {
        // console.log('record:', record);
        return (
          <div className="recycled-action-buttons">
            <Tooltip title="แก้ไข">
              <button
                className="recycled-circle-btn recycled-edit-btn"
                // onClick={() => handleEdit([record.before_id, record.after_id])}
                onClick={() => handleEdit(record.ID)}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title="ลบ">
              <button
                className="recycled-circle-btn recycled-delete-btn"
                onClick={() => handleDelete(record.ID)}
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
  // const handleEdit = async (ids: (number | undefined)[]) => {
  //   console.log("IDs:", ids);

  //   // กรองเอาเฉพาะ id ที่ไม่ undefined และไม่ null
  //   const filteredIds = ids.filter((id): id is number => typeof id === 'number');

  //   if (filteredIds.length === 0) {
  //     message.error("ไม่พบ ID สำหรับแก้ไข");
  //     return;
  //   }

  //   try {
  //     const responses = await Promise.all(filteredIds.map((id) => GetRecycledbyID(id)));
  //     const validData = responses
  //       .filter((res) => res && res.status === 200)
  //       .map((res) => res.data);

  //     if (validData.length === 0) {
  //       message.error("ไม่พบข้อมูลสำหรับแก้ไข");
  //       return;
  //     }

  //     setEditRecord(validData);
  //     setIsEditModalVisible(true);
  //   } catch (error) {
  //     console.error("Error fetching Recycled data:", error);
  //     message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
  //   }
  // };
  const handleEdit = async (ID?: number) => {
    console.log("ID:", ID);

    if (typeof ID !== 'number') {
      message.error("ไม่พบ ID สำหรับแก้ไข");
      return;
    }

    try {
      const res = await GetRecycledbyID(ID);

      if (!res || res.status !== 200) {
        message.error("ไม่พบข้อมูลสำหรับแก้ไข");
        return;
      }

      setEditRecord([res.data]); // ถ้า state เดิมเก็บ array ให้ wrap เป็น array
      setIsEditModalVisible(true);
    } catch (error) {
      console.error("Error fetching Recycled data:", error);
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
          await DeleteAllRecycledRecordsByDate(id);
          message.success("ลบข้อมูลสำเร็จ");
          await fetchRecycledData();
          await loadRecycledTable();
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
      <div className="recycled-title-header">
        <div>
          <h1>Recycled Waste</h1>
          <p>ขยะที่สามารถนำกลับมาใช้ใหม่ได้ เช่น กระดาษ พลาสติก แก้ว และโลหะ</p>
        </div>
        <div className="recycled-card">
          <img src={PhotoMonthlyGarbage} alt="Quantity People" className="recycled-photo" />
          <div>
            <h4>ขยะรีไซเคิลต่อเดือนล่าสุด</h4>
            <div className="recycled-main">
              <span>
                {lastDayRecycled !== null ? (
                  <>
                    <span className="recycled-value">{lastDayRecycled.MonthlyGarbage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>{" "}
                    {lastDayRecycled.UnitName || ""}
                  </>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <br />
          </div>
          <img src={PhotoDailyGarbage} alt="After Water" className="recycled-photo" />
          <div>
            <h4>ขยะรีไซเคิลต่อเดือนวันล่าสุด</h4>
            <div className="recycled-main">
              <span>
                {lastDayRecycled !== null ? (
                  <>
                    <span className="recycled-value">{lastDayRecycled.AverageDailyGarbage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>{" "}
                    {lastDayRecycled.UnitName || ""}
                  </>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <br />
          </div>
        </div>
      </div>
      <div style={{ padding: "20px", backgroundColor: "#F8F9FA" }}>
        <div className="recycled-title">
          <div>
            <h1
              className="recycled-title-text"
            >
              <LeftOutlined className="recycled-back-icon" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
              กราฟ Recycled Waste
            </h1>
          </div>
          <div className="recycled-select-date">
            <div>
              <Select

                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  setDateRange(null); // เคลียร์ช่วงวันที่เดิม
                }}
                className="recycled-select-filter"
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
        <div className="recycled-graph-container">
          <div className="recycled-graph-card">
            <div className="recycled-head-graph-card">
              <div className="recycled-width25">
                <h2 className="recycled-head-graph-card-text">ขยะรีไซเคิล</h2>
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
                <Button className="recycled-expand-chat" onClick={() => openModal("garbage")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="recycled-right-select-graph">
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
                false,
                false,             // isPercentChart (true/false)
              )} series={series}
              type={chartTypeData}
              height={350}
            />
          </div>
          <div className="recycled-graph-card">
            <div className="recycled-head-graph-card">
              <div className="recycled-width40">
                <h2 className="recycled-head-graph-card-text">ขยะรีไซเคิลต่อคนที่เข้าใช้บริการ</h2>
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
                <Button className="recycled-expand-chat" onClick={() => openModal("garbageperpeople")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="recycled-right-select-graph">
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
                false,
                true            // isPercentChart (true/false)
              )} series={seriesMonthlyGarbageQuantityNormalized}
              type={chartTypeCompareMonthlyGarbageQuantity}
              height={350}
            />
          </div>
          <div className="recycled-graph-card">
            <div className="recycled-head-graph-card">
              <div className="recycled-width40">
                <h2 className="recycled-head-graph-card-text">ยอดขายขยะรีไซเคิล</h2>
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
                <Button className="recycled-expand-chat" onClick={() => openModal("totalsale")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="recycled-right-select-graph">
              <Select
                value={chartTypeTotalSale}
                onChange={val => setChartTypeTotalSale(val)}
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
              key={chartTypeTotalSale}
              options={getChartOptions(
                TotalSaleData.map(item => item.date),      // array ของวันที่/เดือน/ปี
                chartTypeTotalSale,          // ประเภท chart
                filterMode === "year",   // 'day' | 'month' | 'year'
                seriesTotalSale[0]?.data || [],
                false,          // array ของตัวเลข
                true,
                false,           // isPercentChart (true/false)
              )} series={seriesTotalSale}
              type={chartTypeTotalSale}
              height={350}
            />
          </div>
          <div className="recycled-graph-for-total">
            <div className="recycled-box">
              <div className="recycled-box-title">จำนวนขยะรวมปี {latestYear}</div>
              <div className="recycled-box-number">
                <div>
                  <div >
                    {new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2, }).format(totalMonthlyGarbage)} Kg
                  </div >
                  <div>
                    <Chart
                      options={getPieOptions(false, false)}
                      series={pieSeries}
                      type="donut"
                      width={180}
                      height={180}
                    />
                  </div>
                </div>
              </div>
              <span className="recycled-box-date">{lastDayRecycled && lastDayRecycled.Date ? `ข้อมูลล่าสุด: ${dayjs(lastDayRecycled.Date).locale('th').add(543, 'year').format("D MMMM YYYY")}` : "ไม่มีข้อมูล"}</span>
            </div>
            <div className="recycled-box">
              <div className="recycled-box-title">จำนวนคนที่เข้าใช้บริการโรงพยาบาลรวมปี {latestYear}</div>
              <div className="recycled-box-number">
                <div>
                  <div >
                    {totalQuantity.toLocaleString()} คน
                  </div >
                  <div>
                    <Chart
                      options={getPieOptions(true, false)}
                      series={pieSeriesQuantity}
                      type="donut"
                      width={180}
                      height={180}
                    />
                  </div>
                </div>
              </div>
              <span className="recycled-box-date">{lastDayRecycled && lastDayRecycled.Date ? `ข้อมูลล่าสุด: ${dayjs(lastDayRecycled.Date).locale('th').add(543, 'year').format("D MMMM YYYY")}` : "ไม่มีข้อมูล"}</span>
            </div>
            <div className="recycled-box">
              <div className="recycled-box-title">จำนวนยอดขายขยะรีไซเคิลรวมปี {latestYear}</div>
              <div className="recycled-box-number">
                <div>
                  <div >
                    {new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2, }).format(totalTotalSale)} บาท
                  </div >
                  <div>
                    <Chart
                      options={getPieOptions(false, true)}
                      series={pieSeriesTotalsale}
                      type="donut"
                      width={180}
                      height={180}
                    />
                  </div>
                </div>
              </div>
              <span className="recycled-box-date">{lastDayRecycled && lastDayRecycled.Date ? `ข้อมูลล่าสุด: ${dayjs(lastDayRecycled.Date).locale('th').add(543, 'year').format("D MMMM YYYY")}` : "ไม่มีข้อมูล"}</span>
            </div>
          </div>
        </div>
        <div className="recycled-header-vis">
          <h1 className="recycled-title-text-vis">ข้อมูล Recycled Waste</h1>
          <div className="recycled-btn-container">
            <button className="recycled-add-btn" onClick={showModal}>{isMobile ? <FormOutlined /> : 'เพิ่มข้อมูลใหม่'}</button>
          </div>
        </div>
        <div className="recycled-select-date2">
          <div className="recycled-filter-status-and-efficiency">
          </div>
          <div className="recycled-filter-date">
            <div >
              <Select
                value={tableFilterMode}
                onChange={(val) => {
                  setTableFilterMode(val);
                  setTableDateRange(null);
                }}
                className="recycled-select-filter"
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
        <div className="recycled-table-data">
          <div className="recycled-width40">
            <h1 className="recycled-title-text-table">ตารางรายงานผลการดำเนินงาน</h1>
          </div>
          <div className="recycled-task-summary">
            <div className="recycled-task-total">จำนวนทั้งหมด <span style={{ color: "#1a4b57", fontWeight: "bold" }}>{totalTasks}</span> วัน</div>
            <div className="recycled-task-stats">
              <div className="recycled-task-item">
                <div className="recycled-task-number">{ }</div>
                <div className="recycled-task-label"></div>
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
          title={<span style={{ color: '#1ba0a2ff' }}>เพิ่มข้อมูล Recycled Waste ใหม่</span>}
          open={isModalVisible}
          footer={null}
          width={1000}
          destroyOnClose
          closable={false}
          centered
          bodyStyle={{ padding: '35px 35px 20px 35px' }}
          className="modal-create"
        >
          <div className="recy-container">
            <RecycledCentralForm onCancel={handleAddModalCancel}
              onSuccess={async () => {
                await fetchRecycledData();   // โหลดข้อมูลกราฟใหม่
                await loadRecycledTable();   // โหลดข้อมูลตารางใหม่
              }}
            />
          </div>
        </Modal>

        <Modal
          title={<span style={{ color: '#1ba0a2ff' }}>แก้ไขข้อมูล Recycled Waste</span>}
          open={isEditModalVisible}
          footer={null}
          width={1000}
          closable={false}
          destroyOnClose
          centered
          onCancel={handleEditModalCancel}
          bodyStyle={{ padding: '35px 35px 20px 35px' }}
          className="modal-create"
        >
          <div className="up-recy-container">
            {editingRecord && (
              <UpdateRecycledCentralForm
                initialValues={editingRecord}
                onSuccess={() => {
                  setTimeout(async () => {
                    setIsEditModalVisible(false);
                    setEditRecord(null);
                    await loadRecycledTable();
                    await fetchRecycledData();
                  }, 500);
                }}
                onCancel={handleEditModalCancel}
              />
            )}
          </div>
        </Modal>

        <Modal
          visible={modalVisible}
          onCancel={closeModal}
          footer={null}
          className="recycled-custom-modal"
          centered
          destroyOnClose
          maskClosable={true}
        >
          {modalGraphType === "garbage" && (
            <div className="recycled-chat-modal">
              <div className="recycled-head-graph-card">
                <div className="recycled-width25">
                  <h2 className="recycled-head-graph-card-text">ขยะรีไซเคิล</h2>
                </div>
              </div>
              <div className="recycled-right-select-graph">
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
              <div className="recycled-chart-containner">
                <ApexChart
                  key={chartTypeData}
                  options={getChartOptions(
                    listdata.map(item => item.date),      // array ของวันที่/เดือน/ปี
                    chartTypeData,          // ประเภท chart
                    filterMode === "year",   // 'day' | 'month' | 'year'
                    series[0]?.data || [],
                    true,          // array ของตัวเลข
                    false,
                    false,             // isPercentChart (true/false)
                  )} series={series}
                  type={chartTypeData}
                  height="100%"
                />
              </div>
            </div>
          )}
          {modalGraphType === "garbageperpeople" && (
            <div className="recycled-chat-modal">
              <div className="recycled-head-graph-card" >
                <div className="recycled-width40">
                  <h2 className="recycled-head-graph-card-text" >ขยะรีไซเคิลต่อคนที่เข้าใช้บริการ</h2>
                </div>
              </div>
              <div className="recycled-right-select-graph">
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
              <div className="recycled-chart-containner">
                <ApexChart
                  key={chartTypeCompareMonthlyGarbageQuantity}
                  options={getChartOptions(
                    compareMonthlyGarbageQuantity.map(item => item.date),      // array ของวันที่/เดือน/ปี
                    chartTypeCompareMonthlyGarbageQuantity,          // ประเภท chart
                    filterMode === "year",   // 'day' | 'month' | 'year'
                    combinedCompareData,
                    true,          // array ของตัวเลข
                    false,
                    true            // isPercentChart (true/false)
                  )} series={seriesMonthlyGarbageQuantityNormalized}
                  type={chartTypeCompareMonthlyGarbageQuantity}
                  height="100%"
                />
              </div>
            </div>
          )}
          {modalGraphType === "totalsale" && (
            <div className="recycled-chat-modal">
              <div className="recycled-head-graph-card" >
                <div className="recycled-width40">
                  <h2 className="recycled-head-graph-card-text" >ยอดขายขยะรีไซเคิล</h2>
                </div>
              </div>
              <div className="recycled-right-select-graph">
                <Select
                  value={chartTypeTotalSale}
                  onChange={val => setChartTypeTotalSale(val)}
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
              <div className="recycled-chart-containner">
                <ApexChart
                  key={chartTypeTotalSale}
                  options={getChartOptions(
                    TotalSaleData.map(item => item.date),      // array ของวันที่/เดือน/ปี
                    chartTypeTotalSale,          // ประเภท chart
                    filterMode === "year",   // 'day' | 'month' | 'year'
                    seriesTotalSale[0]?.data || [],
                    true,          // array ของตัวเลข
                    true,
                    false,           // isPercentChart (true/false)
                  )} series={seriesTotalSale}
                  type={chartTypeTotalSale}
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

export default Recycleddataviz;
