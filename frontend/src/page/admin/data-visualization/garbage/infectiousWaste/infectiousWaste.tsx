// ใช้กับกราฟ
import React, { useEffect, useState } from "react";
import ApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ColorPicker } from "antd";
import type { Color } from "antd/es/color-picker";
import { BarChart3, LineChart, Maximize2 } from "lucide-react";
import "./infectiousWaste.css"
import { GetlistInfectious } from "../../../../../services/garbageServices/infectiousWaste";
import dayjs, { Dayjs } from "dayjs";

const InfectiousWaste: React.FC = () => {
  const [listdata, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterMode, setFilterMode] = useState<"dateRange" | "month" | "year">("year");

  const fetchInfectiousData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GetlistInfectious();
      console.log(response.data)
      if (response) {
        // กลุ่มข้อมูลตามวันที่
        const grouped: Record<string, { value: number[]; unit?: string }> = {};

        response.data.forEach((item: any) => {
          const key = filterMode === "year"
            ? dayjs(item.Date).format("YYYY-MM")  // กลุ่มตามเดือน
            : dayjs(item.Date).format("YYYY-MM-DD"); // กลุ่มตามวัน

          if (!grouped[key]) grouped[key] = { value: [], unit: "" };
          grouped[key].value.push(item.MonthlyGarbage);
          grouped[key].unit = item.UnitName;
        });

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

        // สร้างข้อมูลสำหรับกราฟ
        const chartData: { date: string; avgValue: number; unit: string }[] = [];
        allDates.forEach(date => {
          const values = grouped[date];
          const avgValue = values?.value.length
            ? values.value.reduce((a, b) => a + b, 0) / values.value.length
            : 0;
          chartData.push({ date, avgValue, unit: values?.unit || "" });
        });
        console.log(chartData)
        setListData(chartData);
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


  const categories = listdata.map(item => item.date);
  const seriesData = listdata.map(item => item.avgValue
);

  const chartOptions: ApexOptions = {
    chart: { type: "line", toolbar: { show: true } },
    xaxis: { categories },
    yaxis: { title: { text: "จำนวน (หน่วย)" } },
    dataLabels: { enabled: true }
  };

  const series = [
    { name: "ค่าขยะติดเชื้อ", data: seriesData }
  ];

  return (
    <div>
      <div className="Infectious-title-header">
        <div>
          <h1>Infectious-Waste</h1>
          <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี ได้ดำเนินการตรวจวัดคุณภาพสิ่งแวดล้อม</p>
        </div>
      </div>
      <div className="Infectious-graph-container">
        {/* ฝั่งซ้าย */}
        <div className="Infectious-graph-left">
          <div className="Infectious-graph-card">กราฟขยะ
            <ApexChart options={chartOptions} series={series} type="line" height="100%" />

          </div>
          <div className="Infectious-graph-card">กราฟขยะต่อคน</div>
        </div>

        {/* ฝั่งขวา */}
        <div className="Infectious-graph-right">
          <div className="Infectious-graph-card">AADC</div>
          <div className="Infectious-small-card-container">
            <div className="Infectious-graph-card">ผลรวมขยะต่อปี</div>
            <div className="Infectious-graph-card">เฉลี่ยขยะต่อวัน</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InfectiousWaste;