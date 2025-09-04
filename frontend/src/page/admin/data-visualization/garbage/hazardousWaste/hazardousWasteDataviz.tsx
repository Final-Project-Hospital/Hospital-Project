//ใช้ทั้งกราฟและตาราง
import React, { useEffect, useRef, useState } from "react";
import { Select, DatePicker, Modal, message, Tooltip } from "antd";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import './hazardousWasteDataviz.css';
import dayjs, { Dayjs } from "dayjs";
import { GetlistHazardous, GetfirstHazardous, GetLastDayHazardous } from "../../../../../services/garbageServices/hazardousWaste";
import PhotoMonthlyGarbage from "../../../../../assets/waste/container.png"
import PhotoDailyGarbage from "../../../../../assets/waste/garbage-bag.png"
// import PhotoAADC from "../../../../../assets/waste/garbage-truck.png"
import { listHazardousInterface } from "../../../../../interface/Igarbage/IhazardousWaste";

// ใช้กับกราฟ
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { BarChart3, LineChart } from "lucide-react";

//ใช้กับตาราง
import Table, { ColumnsType } from "antd/es/table";
import { GetHazardousbyID, GetHazardousTABLE, DeleteAllHazardousRecordsByDate } from "../../../../../services/garbageServices/hazardousWaste";
import UpdateHazardousCentralForm from "../../../data-management/garbage/hazardousWaste/updateHazardousCenter";
import HazardousCentralForm from "../../../data-management/garbage/hazardousWaste/hazardousWaste"

//ใช้ตั้งค่าวันที่ให้เป็นภาษาไทย
import 'dayjs/locale/th';
import th_TH from 'antd/es/date-picker/locale/th_TH';
dayjs.locale('th');
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const HazardousWaste: React.FC = () => {
  const navigate = useNavigate();

  //ใช้ทั้งกราฟและตาราง
  const [data, setData] = useState<any[]>([]); // ดึง Hazardous ทั้งหมด
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterMode, setFilterMode] = useState<"dateRange" | "month" | "year">("year");
  const [lastDayHazardous, setlastDayHazardous] = useState<listHazardousInterface | null>(null);

  //ใช้กับกราฟ
  const [listdata, setListData] = useState<{ unit: string; date: string; avgValue: number }[]>([]);
  const [aadcData, setAADCData] = useState<{ date: string; avgValue: number; unit: string }[]>([]);
  const [compareMonthlyGarbageQuantity, setcompareMonthlyGarbageQuantity] = useState<{ date: string; monthlyGarbage: number; quantity: number; unit: string }[]>([]);
  const [chartTypeData, setChartTypeData] = useState<'bar' | 'line'>('line');
  // const [chartTypeAadc, setChartTypeAadc] = useState<'bar' | 'line'>('line');
  const [chartTypeCompareMonthlyGarbageQuantity, setChartTypeCompareMonthlyGarbageQuantity] = useState<'bar' | 'line'>('line');
  const [colorGarbage, setColorGarbage] = useState<string>("#2abdbf");
  const [, setColorAadc] = useState<string>("#1a4b57");//colorAadc
  const [colorCompareMonthlyGarbage, setColorCompareMonthlyGarbage] = useState<string>("#2abdbf");
  const [colorCompareQuantity, setColorCompareQuantity] = useState<string>("#1a4b57");
  const [, setTotalMonthlyGarbage] = useState(0);//totalMonthlyGarbage
  const [, setLatestYear] = useState<number | null>(null);//latestYear
  const [, setMonthlyDataLatestYear] = useState<{ month: string; value: number }[]>([]);//monthlyDataLatestYear
  const [middleTarget, setMiddleTarget] = useState<number | undefined>(undefined);
  const [minTarget, setMinTarget] = useState<number | undefined>(undefined);
  const [maxTarget, setMaxTarget] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState<string>("-");
  const [, setTotalQuantity] = useState<number>(0);//totalQuantity
  const [, setMonthlyQuantityLatestYear] = useState<{ month: string; value: number }[]>([]);//monthlyQuantityLatestYear

  //ใช้กับตาราง
  const [search] = useState(""); //setSearch
  const [isModalVisible, setIsModalVisible] = useState(false);  // --- Modal สำหรับเพิ่ม/แก้ไข Hazardous (ถ้าต้องการใช้) ---
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
  const fetchHazardousData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lastHazardous, response, lastDayHazardous] = await Promise.all([
        GetfirstHazardous(),
        GetlistHazardous(),
        GetLastDayHazardous(),
      ]);
      console.log(lastDayHazardous.data)
      // const response = await GetlistHazardous();
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
        const hazardousArr: { date: string; avgValue: number; unit: string }[] = [];
        const aadcArr: { date: string; avgValue: number; unit: string }[] = [];
        const compareArr: { date: string; monthlyGarbage: number; quantity: number; unit: string; }[] = [];


        allDates.forEach(date => {
          const values = grouped[date] || { value: [], aadc: [], quantity: [], unit: "" }; // ป้องกัน undefined

          // avg ขยะอันตราย
          const avgHazardous = values.value.length
            ? values.value.reduce((a, b) => a + b, 0) / values.value.length
            : 0;
          hazardousArr.push({ date, avgValue: avgHazardous, unit: values.unit });

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
          compareArr.push({ date, monthlyGarbage: avgHazardous, quantity: avgQuantity, unit: values.unit, });
        });

        if (lastHazardous.data.MiddleTarget !== 0) {
          setMiddleTarget(lastHazardous.data.MiddleTarget);
          setMaxTarget(0); //แก้ให้เส้นมาตรฐานอัพเดท
          setMinTarget(0); //แก้ให้เส้นมาตรฐานอัพเดท
        } else {
          setMiddleTarget(0); //แก้ให้เส้นมาตรฐานอัพเดท
          setMaxTarget(lastHazardous.data.MaxTarget);
          setMinTarget(lastHazardous.data.MinTarget);
        }
        setListData(hazardousArr);
        setAADCData(aadcArr);
        setcompareMonthlyGarbageQuantity(compareArr);
        setTotalMonthlyGarbage(totalMonthlyGarbageLatestYear);
        setLatestYear(latestYearThai);
        setMonthlyDataLatestYear(monthlyDataLatestYear);
        setUnit(lastHazardous.data.UnitName);
        setTotalQuantity(totalQuantityLatestYear);
        setMonthlyQuantityLatestYear(monthlyQuantityLatestYear);
        if (!lastDayHazardous || !lastDayHazardous.data || lastDayHazardous.data.length === 0) {
          setlastDayHazardous(null); // ✅ ตรงกับ type
          setError("ไม่พบข้อมูล Before/After FOG");
        } else {
          setlastDayHazardous(lastDayHazardous.data);
        }
        console.log(lastDayHazardous.data)
      } else {
        setError("ไม่พบข้อมูลขยะอันตราย");
      }
    } catch (err) {
      console.error("Error fetching Hazardous data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // โหลดใหม่เมื่อเปลี่ยน filter
  useEffect(() => {
    fetchHazardousData();
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
  const loadHazardousTable = async () => {
    try {
      const response2 = await GetHazardousTABLE();
      if (!response2 || response2.length === 0) {
        setError("ไม่พบข้อมูล Hazardous ของตาราง");
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
      console.error("Error fetching HazardousTABLE data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล Hazardous");
    }
  };

  // โหลดครั้งแรก
  useEffect(() => {
    loadHazardousTable();
  }, []);

  //ใช้กับกราฟ
  const getChartOptions = (
    categories: string[],
    chartType: 'line' | 'bar',
    isYearMode = false,
    dataSeries: number[],
    enableZoom = false,
    isPercentChart = false,
    isDualAxis = false,
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
                label: { text: `มาตรฐานต่ำสุด ${minTarget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 0}`, style: { background: "rgba(255, 163, 24, 0.77)", color: "#fff" } },
              },
              {
                y: maxTarget ?? 0,
                borderWidth: 1.5,
                strokeDashArray: 6,
                borderColor: "#035303ff",
                label: { text: `มาตรฐานสูงสุด ${maxTarget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 0}`, style: { background: "rgba(3, 83, 3, 0.6)", color: "#fff" } },
              },
            ]
            : middleTarget !== undefined && middleTarget !== 0
              ? [
                {
                  y: middleTarget,
                  borderColor: "#FF6F61",
                  borderWidth: 2.5,
                  strokeDashArray: 6,
                  label: { text: `มาตรฐาน ${middleTarget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, style: { background: "#FF6F61", color: "#fff" } },
                },
              ]
              : []
          )
      },
      xaxis: {
        categories: categoriesFormatted,
        title: { text: "วัน/เดือน/ปี" },
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
      yaxis: isDualAxis
        ? [
          {
            title: { text: `ค่าขยะอันตราย (${unit || ""})` },
            min: 0,
            max: adjustedMax,
            labels: { formatter: (v: number) => `${(v / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}k` },
          },
          {
            opposite: true,
            title: { text: "จำนวนคน (คน)" },
            min: 0,
            max: adjustedMax,
            labels: { formatter: (v: number) => `${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
          },
        ]
        : {
          min: 0,
          max: adjustedMax,
          title: {
            text: unit || "ค่า", // ไม่ต้องใช้ isPercentChart แล้ว
          },
          labels: {
            formatter: (value: number) =>
              value >= 1000
                ? `${(value / 1000).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}k`
                : value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
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

            // ค่าขยะอันตราย
            // if (seriesName === "ค่าขยะอันตราย" && listdata && listdata.length > dataPointIndex) {
            //   const unit = listdata[dataPointIndex]?.unit || 'ไม่มีการตรวจวัด';
            //   if (unit === 'ไม่มีการตรวจวัด') return unit;
            //   return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
            // }
            if (seriesName === "ค่าขยะอันตราย" && listdataRef.current.length > dataPointIndex) {
              const unit = listdataRef.current[dataPointIndex]?.unit || 'ไม่มีการตรวจวัด';
              if (unit === 'ไม่มีการตรวจวัด') return unit;
              return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
            }

            // ค่า AADC
            if (seriesName === "ค่า AADC" && aadcData && aadcData.length > dataPointIndex) {
              const unit = aadcData[dataPointIndex]?.unit || 'ไม่มีการตรวจวัด';
              if (unit === 'ไม่มีการตรวจวัด') return unit;
              return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
            }

            // MonthlyGarbage / Quantity
            // if (["ค่าขยะอันตราย", "จำนวนคน"].includes(seriesName)
            //   && compareMonthlyGarbageQuantity
            //   && compareMonthlyGarbageQuantity.length > dataPointIndex) {
            //   if (seriesName === "ค่าขยะอันตราย") {
            //     const unit = compareMonthlyGarbageQuantity[dataPointIndex]?.unit;
            //     return unit ? `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}` : 'ไม่มีการตรวจวัด';
            //   } else if (seriesName === "จำนวนคน") {
            //     const quantity = compareMonthlyGarbageQuantity[dataPointIndex]?.quantity;
            //     return quantity ? `${quantity.toLocaleString()} คน` : 'ไม่มีการตรวจวัด';
            //   }
            // }
            if (["ค่าขยะอันตราย", "จำนวนคน"].includes(seriesName)
              && compareRef.current.length > dataPointIndex) {
              if (seriesName === "ค่าขยะอันตราย") {
                const unit = compareRef.current[dataPointIndex]?.unit;
                return unit ? `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}` : 'ไม่มีการตรวจวัด';
              } else if (seriesName === "จำนวนคน") {
                const unit = compareRef.current[dataPointIndex]?.unit;
                const quantity = compareRef.current[dataPointIndex]?.quantity;
                return unit ? `${quantity.toLocaleString()} คน` : 'ไม่มีการตรวจวัด';
              }
            }

            // Default fallback
            return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
        }
      },
      stroke: chartType === "line" ? { show: true, curve: "smooth", width: 3 } : { show: false },
      markers: chartType === "line" ? { size: 4.5, shape: ["circle", "triangle"], hover: { sizeOffset: 3 }, } : { size: 0 },
      legend: { show: true, showForSingleSeries: true, position: 'top', horizontalAlign: 'center', },
    };
  };

  const series = [{ name: "ค่าขยะอันตราย", data: listdata.map(item => item.avgValue), color: colorGarbage }];
  // const seriesAADC = [{ name: "ค่า AADC", data: aadcData.map(item => item.avgValue), color: colorAadc }];
  const seriesMonthlyGarbageQuantity = [
    { name: "ค่าขยะอันตราย", data: compareMonthlyGarbageQuantity.map(item => item.monthlyGarbage), color: colorCompareMonthlyGarbage },
    { name: "จำนวนคน", data: compareMonthlyGarbageQuantity.map(item => item.quantity), color: colorCompareQuantity },
  ];
  const combinedCompareData = [
    ...seriesMonthlyGarbageQuantity[0].data,
    ...seriesMonthlyGarbageQuantity[1].data,
  ];
  // //ใช้กับกราฟ
  // const openModal = (type: "before" | "after" | "compare" | "percentChange") => {
  //   setModalGraphType(type);
  //   setModalVisible(true);
  // };
  // //ใช้กับกราฟ
  // const closeModal = () => {
  //   setModalVisible(false);
  //   setModalGraphType(null);
  // };

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
          <div className="hazardous-action-buttons">
            <Tooltip title="แก้ไข">
              <button
                className="hazardous-circle-btn hazardous-edit-btn"
                // onClick={() => handleEdit([record.before_id, record.after_id])}
                onClick={() => handleEdit(record.ID)}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            <Tooltip title="ลบ">
              <button
                className="hazardous-circle-btn hazardous-delete-btn"
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

  const handleEdit = async (ID?: number) => {
    console.log("ID:", ID);

    if (typeof ID !== 'number') {
      message.error("ไม่พบ ID สำหรับแก้ไข");
      return;
    }

    try {
      const res = await GetHazardousbyID(ID);

      if (!res || res.status !== 200) {
        message.error("ไม่พบข้อมูลสำหรับแก้ไข");
        return;
      }

      setEditRecord([res.data]); // ถ้า state เดิมเก็บ array ให้ wrap เป็น array
      setIsEditModalVisible(true);
    } catch (error) {
      console.error("Error fetching Hazardous data:", error);
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
          await DeleteAllHazardousRecordsByDate(id);
          message.success("ลบข้อมูลสำเร็จ");
          await fetchHazardousData();
          await loadHazardousTable();
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
      <div className="hazardous-title-header">
        <div>
          <h1>Hazardous Waste</h1>
          <p>ขยะที่มีคุณสมบัติเป็นพิษ ติดไฟ ระเบิด กัดกร่อน หรือก่อให้เกิดอันตราย</p>
        </div>
        <div className="hazardous-card">
          <img src={PhotoMonthlyGarbage} alt="Quantity People" className="hazardous-photo" />
          <div>
            <h4>ขยะอันตรายต่อเดือนล่าสุด</h4>
            <div className="hazardous-main">
              <span>
                {lastDayHazardous !== null ? (
                  <>
                    <span className="hazardous-value">{lastDayHazardous.MonthlyGarbage.toLocaleString()}</span>{" "}
                    {lastDayHazardous.UnitName || ""}
                  </>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <br />
          </div>
          <img src={PhotoDailyGarbage} alt="After Water" className="hazardous-photo" />
          <div>
            <h4>ขยะอันตรายต่อเดือนวันล่าสุด</h4>
            <div className="hazardous-main">
              <span>
                {lastDayHazardous !== null ? (
                  <>
                    <span className="hazardous-value">{lastDayHazardous.AverageDailyGarbage.toLocaleString()}</span>{" "}
                    {lastDayHazardous.UnitName || ""}
                  </>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <br />
          </div>
          {/* <img src={PhotoAADC} alt="Before Water" className="hazardous-photo" /> */}
          {/* <div>
            <h4>ค่า AADC ล่าสุด</h4>
            <div className="hazardous-main">
              <span>
                {lastDayHazardous !== null ? (
                  <>
                    <span className="hazardous-value">{lastDayHazardous.AADC}</span>{" "}
                    {lastDayHazardous.UnitName || ""}
                  </>
                ) : (
                  "-"
                )}
              </span>
            </div>
            {lastDayHazardous ? (
              <p>
                มาตรฐาน{" "}
                <span>
                  {
                    (lastDayHazardous.MiddleTarget !== null && lastDayHazardous.MiddleTarget !== 0) || (lastDayHazardous.MinTarget !== null && lastDayHazardous.MinTarget !== 0) || (lastDayHazardous.MaxTarget !== null && lastDayHazardous.MaxTarget !== 0) || (lastDayHazardous.UnitName && lastDayHazardous.UnitName.trim() !== "")
                      ? (lastDayHazardous.MiddleTarget !== null && lastDayHazardous.MiddleTarget !== 0
                        ? lastDayHazardous.MiddleTarget : `${(lastDayHazardous.MinTarget !== null && lastDayHazardous.MinTarget !== 0 ? lastDayHazardous.MinTarget : "-")} - ${(lastDayHazardous.MaxTarget !== null && lastDayHazardous.MaxTarget !== 0 ? lastDayHazardous.MaxTarget : "-")}`)
                      : "-"
                  }
                </span>{" "}
                {lastDayHazardous.UnitName || ""}
              </p>
            ) : (
              <p>Loading...</p>
            )}
          </div> */}
        </div>
      </div>
      <div style={{ padding: "20px", backgroundColor: "#F8F9FA" }}>
        <div className="hazardous-title">
          <div>
            <h1
              className="hazardous-title-text"
              onClick={() => navigate(-1)}
              style={{ cursor: 'pointer' }}
            >
              <LeftOutlined className="hazardous-back-icon" />
              กราฟ Hazardous Waste
            </h1>
          </div>
          <div className="hazardous-select-date">
            <div>
              <Select

                value={filterMode}
                onChange={(val) => {
                  setFilterMode(val);
                  setDateRange(null); // เคลียร์ช่วงวันที่เดิม
                }}
                className="hazardous-select-filter"
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
        <div className="hazardous-graph-container">
          <div className="hazardous-graph-card">
            <div className="hazardous-head-graph-card">
              <div className="hazardous-width25">
                <h2 className="hazardous-head-graph-card-text">ขยะอันตราย</h2>
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
            <div className="hazardous-right-select-graph">
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
                true,
                false              // isPercentChart (true/false)
              )} series={series}
              type={chartTypeData}
              style={{ flex: 1 }}
            />
          </div>
          <div className="hazardous-graph-card">
            <div className="hazardous-head-graph-card">
              <div className="hazardous-width50">
                <h2 className="hazardous-head-graph-card-text">ขยะอันตรายต่อคนที่เข้าใช้บริการ</h2>
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
            <div className="hazardous-right-select-graph">
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
                true,
                true              // isPercentChart (true/false)
              )} series={seriesMonthlyGarbageQuantity}
              type={chartTypeCompareMonthlyGarbageQuantity}
              style={{ flex: 1 }}
            />
          </div>
        </div>
        <div className="hazardous-header-vis">
          <h1 className="hazardous-title-text-vis">ข้อมูล Hazardous Waste</h1>
          <div className="hazardous-btn-container">
            <button className="hazardous-add-btn" onClick={showModal}>เพิ่มข้อมูลใหม่</button>
          </div>
        </div>
        <div className="hazardous-select-date">
          <div className="hazardous-filter-status-and-efficiency">
          </div>
          <div className="hazardous-filter-date">
            <div >
              <Select
                value={tableFilterMode}
                onChange={(val) => {
                  setTableFilterMode(val);
                  setTableDateRange(null);
                }}
                className="hazardous-select-filter"
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
        <div className="hazardous-table-data">
          <div className="hazardous-width40">
            <h1 className="hazardous-title-text-table">ตารางรายงานผลการดำเนินงาน</h1>
          </div>
          <div className="hazardous-task-summary">
            <div className="hazardous-task-total">จำนวนทั้งหมด <span style={{ color: "#1a4b57", fontWeight: "bold" }}>{totalTasks}</span> วัน</div>
            <div className="hazardous-task-stats">
              <div className="hazardous-task-item">
                <div className="hazardous-task-number">{ }</div>
                <div className="hazardous-task-label"></div>
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
            }}

          />
        </div>

        <Modal
          title={<span style={{ color: '#1ba0a2ff' }}>เพิ่มข้อมูล Hazardous Waste ใหม่</span>}
          open={isModalVisible}
          footer={null}
          width={1000}
          destroyOnClose
          closable={false}
          centered
          bodyStyle={{ padding: '35px 35px 20px 35px' }}
        >
          <div className="gen-container">
            <HazardousCentralForm onCancel={handleAddModalCancel}
              onSuccess={async () => {
                await fetchHazardousData();   // โหลดข้อมูลกราฟใหม่
                await loadHazardousTable();   // โหลดข้อมูลตารางใหม่
              }}
            />
          </div>
        </Modal>

        <Modal
          title={<span style={{ color: '#1ba0a2ff' }}>แก้ไขข้อมูล Hazardous Waste</span>}
          open={isEditModalVisible}
          footer={null}
          width={1000}
          closable={false}
          destroyOnClose
          centered
          onCancel={handleEditModalCancel}
          bodyStyle={{ padding: '35px 35px 20px 35px' }}
        >
          {editingRecord && (
            <div className="up-recy-container">
              <UpdateHazardousCentralForm
                initialValues={editingRecord}
                onSuccess={() => {
                  setTimeout(async () => {
                    setIsEditModalVisible(false);
                    setEditRecord(null);
                    await loadHazardousTable();
                    await fetchHazardousData();
                  }, 500);
                }}
                onCancel={handleEditModalCancel}
              />
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
};

export default HazardousWaste;
