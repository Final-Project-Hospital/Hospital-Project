import { useEffect, useState } from 'react';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  LineSeries,
  DateTime,
  Legend,
  Tooltip,
} from '@syncfusion/ej2-react-charts';
import { useStateContext } from '../../../../../../contexts/ContextProvider';

interface ChartPoint {
  parameter: string;
  date: string; // ISO
  value: number;
}
type ChartMetaMap = Record<string, { unit?: string; standard?: number; standardMin?: number }>;

interface LineChartProps {
  hardwareID: number;
  timeRangeType: 'hour' | 'day' | 'month' | 'year';
  selectedRange: any;
  parameters: string[];
  colors?: string[];
  chartHeight?: string;
  reloadKey?: number;

  // จากพ่อ
  data?: ChartPoint[];
  meta?: ChartMetaMap;
  loading?: boolean;
}

/* ---------- helpers ---------- */
function getMonthStartDate(year: number, month: number) {
  return new Date(year, month, 1);
}
function getYearStartDate(year: number) {
  return new Date(year, 0, 1);
}
function groupByHourAvg(data: { x: Date; y: number }[]) {
  const groups: Record<string, number[]> = {};
  data.forEach(d => {
    const dt = new Date(d.x);
    const key = `${dt.getFullYear()}-${(dt.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')} ${dt
      .getHours()
      .toString()
      .padStart(2, '0')}:00`;
    (groups[key] ??= []).push(d.y);
  });
  return Object.entries(groups)
    .map(([k, values]) => {
      const [datePart, timePart] = k.split(' ');
      const [y, m, d] = datePart.split('-').map(Number);
      const hour = Number(timePart.split(':')[0]);
      return {
        x: new Date(y, m - 1, d, hour, 0, 0, 0),
        y: values.reduce((s, v) => s + v, 0) / values.length,
      };
    })
    .sort((a, b) => a.x.getTime() - b.x.getTime());
}
function groupByDayAvg(data: { x: Date; y: number }[]) {
  // ใช้โลคัลเดท ป้องกัน timezone ทำวันเพี้ยน
  const groups: Record<string, number[]> = {};
  data.forEach(d => {
    const dt = d.x;
    const key = `${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2,'0')}-${dt.getDate().toString().padStart(2,'0')}`;
    (groups[key] ??= []).push(d.y);
  });
  return Object.entries(groups)
    .map(([key, values]) => {
      const [y, m, d] = key.split('-').map(Number);
      return {
        x: new Date(y, m - 1, d),
        y: values.reduce((sum, val) => sum + val, 0) / values.length,
      };
    })
    .sort((a, b) => a.x.getTime() - b.x.getTime());
}
function groupByMonthAvg(data: { x: Date; y: number }[]) {
  const groups: Record<string, number[]> = {};
  data.forEach(d => {
    const key = `${d.x.getFullYear()}-${d.x.getMonth() + 1}`;
    (groups[key] ??= []).push(d.y);
  });
  return Object.entries(groups)
    .map(([key, values]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        x: getMonthStartDate(year, month - 1),
        y: values.reduce((sum, val) => sum + val, 0) / values.length,
      };
    })
    .sort((a, b) => a.x.getTime() - b.x.getTime());
}
function groupByYearAvg(data: { x: Date; y: number }[]) {
  const groups: Record<string, number[]> = {};
  data.forEach(d => {
    const key = `${d.x.getFullYear()}`;
    (groups[key] ??= []).push(d.y);
  });
  return Object.entries(groups)
    .map(([year, values]) => ({
      x: getYearStartDate(Number(year)),
      y: values.reduce((sum, val) => sum + val, 0) / values.length,
    }))
    .sort((a, b) => a.x.getTime() - b.x.getTime());
}

/* ---------- type guards ---------- */
const isDateRange = (v: any): v is [Date, Date] =>
  Array.isArray(v) && v.length === 2 && v.every((d) => d instanceof Date && !isNaN(d.getTime()));
const isYearRange = (v: any): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(n));
const isMonthSel = (v: any): v is { month: string; year: string } =>
  v && typeof v === 'object' && 'month' in v && 'year' in v;

const LineChart: React.FC<LineChartProps> = ({
  timeRangeType,
  selectedRange,
  parameters,
  colors = [],
  chartHeight = "420px",
  reloadKey,
  data = [],
  meta = {},
  loading,
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [noData, setNoData] = useState<boolean>(false);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({}); // unit -> parameter

  const parameterInfo = parameters.reduce((acc, param, idx) => {
    acc[param] = colors[idx] || '#999999';
    return acc;
  }, {} as Record<string, string>);

  useEffect(() => {
    // 1) รอโหลดจากพ่อ
    if (loading) {
      setSeriesData([]);
      setNoData(false);
      return;
    }

    // 2) กัน selectedRange ชนิดไม่ตรงกับ timeRangeType (อย่า destructure ก่อนเช็ค)
    if (timeRangeType === 'hour' || timeRangeType === 'day') {
      if (!isDateRange(selectedRange)) {
        setSeriesData([]);
        setNoData(false);
        return;
      }
    } else if (timeRangeType === 'month') {
      if (!isMonthSel(selectedRange)) {
        setSeriesData([]);
        setNoData(false);
        return;
      }
    } else if (timeRangeType === 'year') {
      if (!isYearRange(selectedRange)) {
        setSeriesData([]);
        setNoData(false);
        return;
      }
    }

    // 3) ไม่มีข้อมูล/ไม่มีพารามิเตอร์
    if (!Array.isArray(data) || data.length === 0 || parameters.length === 0) {
      setSeriesData([]);
      setNoData(true);
      return;
    }

    // 4) เตรียม map และ unit/standard
    const parameterMap: Record<string, { x: Date; y: number }[]> = {};
    const maxStandardMap: Record<string, number> = {};
    const minStandardMap: Record<string, number> = {};
    const localUnitMap: Record<string, string> = {};

    for (const p of parameters) {
      const m = meta[p];
      if (m?.unit && !localUnitMap[m.unit]) localUnitMap[m.unit] = p;
      if (typeof m?.standard === 'number') maxStandardMap[p] = m.standard;
      if (typeof m?.standardMin === 'number') minStandardMap[p] = m.standardMin;
    }

    // 5) filter ตามช่วงเวลา (หลังผ่าน type guard)
    for (const pt of data) {
      const { parameter, value, date } = pt;
      if (!parameters.includes(parameter) || typeof value !== 'number' || !date) continue;

      const d = new Date(date);
      if (isNaN(d.getTime())) continue;

      let inRange = false;
      if (timeRangeType === 'hour') {
        const [start, end] = selectedRange as [Date, Date];
        inRange = d >= start && d <= end;
      } else if (timeRangeType === 'day') {
        const [start, end] = selectedRange as [Date, Date];
        const s = new Date(start);
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        inRange = d >= s && d <= e;
      } else if (timeRangeType === 'month') {
        const { month, year } = selectedRange as { month: string; year: string };
        inRange = (d.getMonth() + 1) === Number(month) && d.getFullYear() === Number(year);
      } else {
        const [startY, endY] = selectedRange as [number, number];
        inRange = d.getFullYear() >= +startY && d.getFullYear() <= +endY;
      }

      if (!inRange) continue;
      (parameterMap[parameter] ??= []).push({ x: d, y: value });
    }

    // 6) สร้างเส้นมาตรฐาน
    const createStandardLine = (standard: number, data: { x: Date; y: number }[]) => {
      const sorted = [...data].sort((a, b) => a.x.getTime() - b.x.getTime());
      if (sorted.length === 0) return [];
      if (sorted.length === 1) {
        const d = sorted[0];
        const prev = new Date(d.x.getTime() - 1000 * 60 * 60);
        const next = new Date(d.x.getTime() + 1000 * 60 * 60);
        return [{ x: prev, y: standard }, { x: next, y: standard }];
      }
      return sorted.map(d => ({ x: d.x, y: standard }));
    };

    // 7) สร้างซีรีส์
    const series: any[] = [];

    Object.entries(parameterMap).forEach(([name, dataArray]) => {
      const sortedData = dataArray.sort((a, b) => a.x.getTime() - b.x.getTime());
      const fillColor = parameterInfo[name] || '#999999';

      const dataSource =
        timeRangeType === 'hour'
          ? groupByHourAvg(sortedData)
          : timeRangeType === 'year'
            ? ((selectedRange as [number, number])[0] === (selectedRange as [number, number])[1]
                ? groupByMonthAvg(groupByDayAvg(sortedData.filter(d => d.x.getFullYear() === (selectedRange as [number, number])[0])))
                : groupByYearAvg(sortedData))
            : timeRangeType === 'month'
              ? groupByDayAvg(sortedData)
              : groupByDayAvg(sortedData);

      // ค่าจริง
      series.push({
        dataSource,
        xName: 'x',
        yName: 'y',
        name,
        width: 2,
        marker: { visible: true, width: 8, height: 8 },
        type: 'Line',
        fill: fillColor,
        animation: { enable: false },
      });

      // เส้น Max (รองรับ 0 ด้วย hasOwnProperty)
      if (Object.prototype.hasOwnProperty.call(maxStandardMap, name)) {
        const stdData = createStandardLine(maxStandardMap[name], dataSource);
        if (stdData.length > 0) {
          series.push({
            dataSource: stdData,
            xName: 'x',
            yName: 'y',
            name: `${name} (Max)`,
            width: 2,
            dashArray: '5,5',
            marker: { visible: false },
            type: 'Line',
            fill: 'red',
            animation: { enable: false },
          });
        }
      }

      // เส้น Min
      if (Object.prototype.hasOwnProperty.call(minStandardMap, name)) {
        const stdDataMin = createStandardLine(minStandardMap[name], dataSource);
        if (stdDataMin.length > 0) {
          series.push({
            dataSource: stdDataMin,
            xName: 'x',
            yName: 'y',
            name: `${name} (Min)`,
            width: 2,
            dashArray: '5,5',
            marker: { visible: false },
            type: 'Line',
            fill: '#f59e0b',
            animation: { enable: false },
          });
        }
      }
    });

    setSeriesData(series);
    setUnitMap(localUnitMap);
    setNoData(series.length === 0);
  }, [loading, data, meta, parameters, colors, timeRangeType, selectedRange, reloadKey]);

  // สถานะ
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 text-lg text-gray-500">
        <span className="animate-spin border-4 border-teal-300 rounded-full border-t-transparent w-10 h-10 mr-4" />
        Loading...
      </div>
    );
  }
  if (noData) {
    return (
      <div className="flex items-center justify-center h-80 text-lg text-red-500 font-bold">
        ไม่มีข้อมูลในช่วงเวลาที่เลือก
      </div>
    );
  }

  // X-axis format
  const xLabelFormat =
    timeRangeType === 'hour' ? 'HH:mm'
      : timeRangeType === 'year'
        ? ((selectedRange as [number, number])?.[0] !== (selectedRange as [number, number])?.[1] ? 'yyyy' : 'MMM')
        : 'dd/MM';

  const xIntervalType =
    timeRangeType === 'hour' ? 'Hours'
      : timeRangeType === 'year'
        ? ((selectedRange as [number, number])?.[0] !== (selectedRange as [number, number])?.[1] ? 'Years' : 'Months')
        : 'Days';

  const xInterval = timeRangeType === 'day' ? 1 : timeRangeType === 'hour' ? 1 : undefined;

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '40px' }}>
      <div style={{ position: 'absolute', top: '4px', zIndex: 10 }}>
        <span className='text-black font-bold'>หน่วย : </span>
        {Object.entries(unitMap).map(([unit, param]) => {
          const color = parameterInfo[param] || (currentMode === 'Dark' ? '#fff' : '#000');
          return (
            <span
              key={unit}
              style={{
                color,
                padding: '2px 8px',
                backgroundColor: currentMode === 'Dark' ? '#33373E' : '#f0f0f0',
                marginRight: 8,
                borderRadius: 6,
                fontWeight: 'bold'
              }}
            >
              {unit}
            </span>
          );
        })}
      </div>

      <ChartComponent
        id={`chart-${parameters.join('-')}`}
        height={chartHeight}
        width="100%"
        primaryXAxis={{
          title: "วันที่บันทึก",
          valueType: 'DateTime',
          labelFormat: xLabelFormat,
          intervalType: xIntervalType as any,
          interval: xInterval as any,
          edgeLabelPlacement: 'Shift',
          majorGridLines: { width: 0 },
          labelIntersectAction: 'Rotate45',
          enableTrim: false,
        }}
        primaryYAxis={{
          title: 'ค่าที่ได้จากการตรวจวัด',
          labelFormat: '{value}',
          minimum: 0, // ถ้าอยาก auto ให้ลบออก
          rangePadding: 'None',
          lineStyle: { width: 0 },
          majorTickLines: { width: 0 },
          minorTickLines: { width: 0 },
        }}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        tooltipRender={(args) => {
          if (args.point && typeof (args.point as any).y === 'number') {
            const y = (args.point as any).y.toFixed(2);
            const d: Date = (args.point as any).x;
            let when = '';
            if (timeRangeType === 'hour') {
              when = d.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
            } else if (timeRangeType === 'day' || timeRangeType === 'month') {
              when = d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' });
            } else {
              when = d.toLocaleDateString('th-TH', { month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' });
            }
            args.text = `${when} : ${y}`;
          }
        }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        legendSettings={{ background: 'white' }}
      >
        <Inject services={[LineSeries, DateTime, Legend, Tooltip]} />
        <SeriesCollectionDirective>
          {seriesData.map((item) => (
            <SeriesDirective key={`${item.name}-${item.type}`} {...item} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default LineChart;
