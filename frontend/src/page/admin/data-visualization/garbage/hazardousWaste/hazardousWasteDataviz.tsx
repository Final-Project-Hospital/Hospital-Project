//ใช้ทั้งกราฟและตาราง
import React, { useEffect, useState } from "react";
import { Select, DatePicker, Modal, message, Tooltip, Button } from "antd";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import './hazardousWasteDataviz.css';
import dayjs, { Dayjs } from "dayjs";
import { GetlistHazardous, GetfirstHazardous, GetBeforeAfterHazardous } from "../../../../../services/garbageServices/hazardousWaste";
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
import { GetHazardousbyID, GetHazardousTABLE, DeleteAllHazardousRecordsByDate } from "../../../../../services/garbageServices/hazardousWaste";
import UpdateHazardousCentralForm from "../../../data-management/garbage/hazardousWaste/updateHazardousCenter";
import HazardousCentralForm from "../../../data-management/garbage/hazardousWaste/hazardousWaste"
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

const HazardousWaste: React.FC = () => {
  const navigate = useNavigate();

  //ใช้ทั้งกราฟและตาราง
  const [data, setData] = useState<any[]>([]); // ดึง Hazardous ทั้งหมด
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
  const [isModalVisible, setIsModalVisible] = useState(false);  // --- Modal สำหรับเพิ่ม/แก้ไข Hazardous (ถ้าต้องการใช้) ---
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
      const [lastrecyc, response, recycRes] = await Promise.all([
        GetfirstHazardous(),
        GetlistHazardous(),
        GetBeforeAfterHazardous(),
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
        // console.log(lastrecyc.data)
        if (lastrecyc.data.MiddleValue !== 0) {
          setMiddleStandard(lastrecyc.data.MiddleValue);
          setMaxStandard(0); //แก้ให้เส้นมาตรฐานอัพเดท
          setMinStandard(0); //แก้ให้เส้นมาตรฐานอัพเดท
        } else {
          setMiddleStandard(0); //แก้ให้เส้นมาตรฐานอัพเดท
          setMaxStandard(lastrecyc.data.MaxValue);
          setMinStandard(lastrecyc.data.MinValue);
        }

        const percentageChangeData: { date: string; percent: number }[] = compare.map(item => {
          const rawPercent = item.before !== 0
            ? ((item.before - item.after) / item.before) * 100
            : 0;
          const percent = rawPercent < 0 ? 0 : rawPercent;
          return { date: item.date, percent };
        });
        console.log(response.data);
        setUnit(lastrecyc.data.UnitName);
        setBeforeData(before);
        setAfterData(after);
        setCompareData(compare);
        setPercentChangeData(percentageChangeData);
        // เซ็ตข้อมูลจาก GetBeforeAfterHazardous
        if (recycRes) {
          setBeforeAfter(recycRes.data);
        }
      } else {
        setError("ไม่พบข้อมูล Hazardous");
      }
    } catch (err) {
      console.error("Error fetching Hazardous data:", err);
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
        id: "hazardous-chart",
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
                borderColor: "#035303ff",
                label: { text: `มาตรฐานสูงสุด ${maxstandard ?? 0}`, style: { background: "rgba(3, 83, 3, 0.6)", color: "#fff" } },
              },
            ]
            : middlestandard !== undefined && middlestandard !== 0
              ? [
                {
                  y: middlestandard,
                  borderColor: "#FF6F61",
                  borderWidth: 1.5,
                  strokeDashArray: 6,
                  label: { text: `มาตรฐาน ${middlestandard}`, style: { background: "#FF6F61", color: "#fff" } },
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
          formatter: (value: number) => isPercentChart ? `${value.toFixed(2)}%` : value.toFixed(2)
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
            if ((seriesName === "ก่อนบำบัด" || seriesName === "Hazardous") && beforeData && beforeData.length > dataPointIndex) {
              const unit = beforeData[dataPointIndex]?.unit || 'ไม่มีการตรวจวัดก่อนบำบัด';
              if (unit === 'ไม่มีการตรวจวัดก่อนบำบัด') return unit;
              return `${val.toFixed(2)} ${unit}`;
            }

            // กรณี afterSeries หรือ compareSeries "หลังบำบัด"
            if ((seriesName === "หลังบำบัด" || seriesName === "Hazardous") && afterData && afterData.length > dataPointIndex) {
              const unit = afterData[dataPointIndex]?.unit || 'ไม่มีการตรวจวัดหลังบำบัด';
              if (unit === 'ไม่มีการตรวจวัดหลังบำบัด') return unit;
              return `${val.toFixed(2)} ${unit}`;
            }

            // กรณีอื่น ๆ
            return `${val.toFixed(2)}`;
          }

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
      render: (val: number | null) => val != null ? val : '-',
    },
    {
      title: 'ปริมาณขยะต่อเดือน',
      dataIndex: 'monthly_garbage',
      key: 'monthly_garbage',
      width: 150,
      render: (val: number | null) => val != null ? val.toFixed(2) : '-',
    },
    {
      title: 'ปริมาณขยะต่อวัน',
      dataIndex: 'average_daily_garbage',
      key: 'average_daily_garbage',
      width: 150,
      render: (val: number | null) => val != null ? val.toFixed(2) : '-',
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
          await fetchData();
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
          <img src={BeforeWater} alt="Before Water" className="hazardous-photo" />
          <div>
            <h4>น้ำก่อนบำบัดล่าสุด</h4>
            <div className="hazardous-main">
              <span>{BeforeAfter?.before.Data !== null && BeforeAfter?.before.Data !== undefined ? (<><span className="hazardous-value">{BeforeAfter.before.Data}</span>{" "}{BeforeAfter.before.UnitName || ""}</>) : "-"}</span>
            </div>
            {BeforeAfter ? (
              <p>
                มาตรฐาน{" "}
                <span>
                  {(BeforeAfter.before.MiddleValue !== null && BeforeAfter.before.MiddleValue !== 0) || (BeforeAfter.before.MinValue !== null && BeforeAfter.before.MinValue !== 0) || (BeforeAfter.before.MaxValue !== null && BeforeAfter.before.MaxValue !== 0) || (BeforeAfter.before.UnitName && BeforeAfter.before.UnitName.trim() !== "")
                    ? (BeforeAfter.before.MiddleValue !== null && BeforeAfter.before.MiddleValue !== 0
                      ? BeforeAfter.before.MiddleValue : `${(BeforeAfter.before.MinValue !== null && BeforeAfter.before.MinValue !== 0 ? BeforeAfter.before.MinValue : "-")} - ${(BeforeAfter.before.MaxValue !== null && BeforeAfter.before.MaxValue !== 0 ? BeforeAfter.before.MaxValue : "-")}`) : "-"
                  }
                </span>{" "}
                {BeforeAfter.before.UnitName || ""}
              </p>
            ) : (
              <p>Loading...</p>
            )}
          </div>
          <img src={AftereWater} alt="After Water" className="hazardous-photo" />
          <div>
            <h4>น้ำหลังบำบัดล่าสุด</h4>
            <div className="hazardous-main">
              <span>{BeforeAfter?.after.Data !== null && BeforeAfter?.after.Data !== undefined ? (<><span className="hazardous-value">{BeforeAfter.after.Data}</span>{" "}{BeforeAfter.after.UnitName || ""}</>) : "-"}</span>
              <span className="hazardous-change">
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
                    (BeforeAfter.after.MiddleValue !== null && BeforeAfter.after.MiddleValue !== 0) || (BeforeAfter.after.MinValue !== null && BeforeAfter.after.MinValue !== 0) || (BeforeAfter.after.MaxValue !== null && BeforeAfter.after.MaxValue !== 0) || (BeforeAfter.after.UnitName && BeforeAfter.after.UnitName.trim() !== "")
                      ? (BeforeAfter.after.MiddleValue !== null && BeforeAfter.after.MiddleValue !== 0
                        ? BeforeAfter.after.MiddleValue : `${(BeforeAfter.after.MinValue !== null && BeforeAfter.after.MinValue !== 0 ? BeforeAfter.after.MinValue : "-")} - ${(BeforeAfter.after.MaxValue !== null && BeforeAfter.after.MaxValue !== 0 ? BeforeAfter.after.MaxValue : "-")}`)
                      : "-"
                  }
                </span>{" "}
                {BeforeAfter.after.UnitName || ""}
              </p>
            ) : (
              <p>Loading...</p>
            )}
          </div>
          <img src={Efficiency} alt="Before Water" className="hazardous-photo" />
          <div>
            <h4>ประสิทธิภาพล่าสุด</h4>
            <div className="hazardous-main">
              <span>
                {BeforeAfter?.before.Data !== null && BeforeAfter?.before.Data !== undefined &&
                  BeforeAfter.before.Data !== 0 &&
                  BeforeAfter?.after.Data !== null && BeforeAfter?.after.Data !== undefined
                  ? (
                    <>
                      <span className="hazardous-value">
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
          {/* ตารางน้ำก่อนบำบัดนะจ๊ะ */}
          <div className="hazardous-graph-card">
            <div className="hazardous-head-graph-card">
              <div className="hazardous-width25">
                <h2 className="hazardous-head-graph-card-text">น้ำก่อนบำบัด</h2>
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
                <Button className="hazardous-expand-chat" onClick={() => openModal("before")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="hazardous-right-select-graph">
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

          <div className="hazardous-graph-card">
            <div className="hazardous-head-graph-card">
              <div className="hazardous-width25">
                <h2 className="hazardous-head-graph-card-text">น้ำหลังบำบัด</h2>
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
                <Button className="hazardous-expand-chat" onClick={() => openModal("after")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="hazardous-right-select-graph">
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
          <div className="hazardous-graph-card">
            <div className="hazardous-head-graph-card">
              <div className="hazardous-width40">
                <h2 className="hazardous-head-graph-card-text" >เปรียบเทียบก่อน-หลังบำบัด</h2>
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
                <Button className="hazardous-expand-chat" onClick={() => openModal("compare")}><Maximize2 /></Button>
              </div>
            </div>
            <div className="hazardous-right-select-graph">
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
          <div className="hazardous-graph-card">
            <div className="hazardous-head-graph-card">
              <div className="hazardous-width25">
                <h2 className="hazardous-head-graph-card-text" >ประสิทธิภาพ</h2>
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
            <div className="hazardous-right-select-graph">
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
        <div className="hazardous-header-vis">
          <h1 className="hazardous-title-text-vis">ข้อมูล Hazardous Waste</h1>
          <div className="hazardous-btn-container">
            <button className="hazardous-add-btn" onClick={showModal}>เพิ่มข้อมูลใหม่</button>
          </div>
        </div>
        <div className="hazardous-select-date">
          <div className="hazardous-filter-status-and-efficiency">
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
                <div className="hazardous-task-number">{doneTasks}</div>
                <div className="hazardous-task-label">ผ่านเกณฑ์มาตรฐาน</div>
              </div>
              <div className="hazardous-task-divider" />
              <div className="hazardous-task-item">
                <div className="hazardous-task-number">{inProgressTasks}</div>
                <div className="hazardous-task-label">ไม่ผ่านเกณฑ์มาตรฐาน</div>
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
          title={"เพิ่มข้อมูล Hazardous Waste ใหม่"}
          open={isModalVisible}
          footer={null}
          width={1100}
          destroyOnClose
          closable={false}
          centered
        >
          <HazardousCentralForm onCancel={handleAddModalCancel}
            onSuccess={async () => {
              await fetchData();      // ✅ โหลดข้อมูลกราฟใหม่
              await loadHazardousTable();   // ✅ โหลดข้อมูลตารางใหม่
            }}
          />
        </Modal>
        <Modal
          title="แก้ไขข้อมูล Hazardous Waste"
          open={isEditModalVisible}
          footer={null}
          width={1100}
          closable={false}
          destroyOnClose
          centered
          onCancel={handleEditModalCancel}
        >
          {editingRecord && (
            <UpdateHazardousCentralForm
              initialValues={editingRecord}
              onSuccess={() => {
                setTimeout(async () => {
                  setIsEditModalVisible(false);
                  setEditRecord(null);
                  await loadHazardousTable();
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
          className="hazardous-custom-modal"
          centered
          destroyOnClose
          maskClosable={true}
        >
          {modalGraphType === "before" && (
            <div className="hazardous-chat-modal" >
              <div className="hazardous-head-graph-card">
                <div className="hazardous-width25">
                  <h2 className="hazardous-head-graph-card-text">น้ำก่อนบำบัด</h2>
                </div>
              </div>
              <div className="hazardous-right-select-graph">
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
              <div className="hazardous-chart-containner">
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
            <div className="hazardous-chat-modal">
              <div className="hazardous-head-graph-card">
                <div className="hazardous-width25">
                  <h2 className="hazardous-head-graph-card-text">น้ำหลังบำบัด</h2>
                </div>
              </div>
              <div className="hazardous-right-select-graph">
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
              <div className="hazardous-chart-containner">
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
            <div className="hazardous-chat-modal">
              <div className="hazardous-head-graph-card" >
                <div className="hazardous-width40">
                  <h2 className="hazardous-head-graph-card-text" >เปรียบเทียบก่อน-หลังบำบัด</h2>
                </div>
              </div>
              <div className="hazardous-right-select-graph">
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
              <div className="hazardous-chart-containner">
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

export default HazardousWaste;
