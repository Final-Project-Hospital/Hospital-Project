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

  // ✅ รับจากพ่อ
  data?: ChartPoint[];
  meta?: ChartMetaMap;
  loading?: boolean;
}

function getMonthStartDate(year: number, month: number) {
  return new Date(year, month, 1);
}
function getYearStartDate(year: number) {
  return new Date(year, 0, 1);
}
function groupByHourAvg(data: { x: Date; y: number }[]) {
  const groups: { [hourKey: string]: number[] } = {};
  data.forEach(d => {
    const dt = new Date(d.x);
    const key = `${dt.getFullYear()}-${(dt.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')} ${dt
      .getHours()
      .toString()
      .padStart(2, '0')}:00`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d.y);
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
  const groups: { [day: string]: number[] } = {};
  data.forEach(d => {
    const key = d.x.toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(d.y);
  });
  return Object.entries(groups).map(([day, values]) => ({
    x: new Date(day),
    y: values.reduce((sum, val) => sum + val, 0) / values.length,
  })).sort((a, b) => a.x.getTime() - b.x.getTime());
}
function groupByMonthAvg(data: { x: Date; y: number }[]) {
  const groups: { [month: string]: number[] } = {};
  data.forEach(d => {
    const key = `${d.x.getFullYear()}-${d.x.getMonth() + 1}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d.y);
  });
  return Object.entries(groups).map(([key, values]) => {
    const [year, month] = key.split('-').map(Number);
    return {
      x: getMonthStartDate(year, month - 1),
      y: values.reduce((sum, val) => sum + val, 0) / values.length,
    };
  }).sort((a, b) => a.x.getTime() - b.x.getTime());
}
function groupByYearAvg(data: { x: Date; y: number }[]) {
  const groups: { [year: string]: number[] } = {};
  data.forEach(d => {
    const key = `${d.x.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d.y);
  });
  return Object.entries(groups).map(([year, values]) => ({
    x: getYearStartDate(Number(year)),
    y: values.reduce((sum, val) => sum + val, 0) / values.length,
  })).sort((a, b) => a.x.getTime() - b.x.getTime());
}

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

  // คำนวณจาก data+meta แทนการเรียก service
  useEffect(() => {
    // ถ้าพ่อยังโหลดอยู่ ให้โชว์สถานะโหลดใน component นี้
    if (loading) {
      setSeriesData([]);
      setNoData(false);
      return;
    }

    // เมื่อไม่ได้ส่ง data มาเลย
    if (!Array.isArray(data) || data.length === 0 || parameters.length === 0) {
      setSeriesData([]);
      setNoData(true);
      return;
    }

    // สร้าง map ตาม parameter ที่เลือก
    const parameterMap: Record<string, { x: Date; y: number }[]> = {};
    const maxStandardMap: Record<string, number> = {};
    const minStandardMap: Record<string, number> = {};

    // unitMap: unit -> parameter (แสดงบน UI)
    const localUnitMap: Record<string, string> = {};
    for (const p of parameters) {
      const m = meta[p];
      if (m?.unit && !localUnitMap[m.unit]) {
        localUnitMap[m.unit] = p;
      }
      if (typeof m?.standard === 'number') {
        maxStandardMap[p] = m.standard;
      }
      if (typeof m?.standardMin === 'number') {
        minStandardMap[p] = m.standardMin;
      }
    }

    // คัดตามช่วงเวลา
    for (const pt of data) {
      const { parameter, value, date } = pt;
      if (!parameters.includes(parameter) || typeof value !== 'number' || !date) continue;

      const d = new Date(date);
      if (isNaN(d.getTime())) continue;

      let inRange = false;
      if (timeRangeType === 'hour') {
        const [start, end] = selectedRange || [];
        if (!start || !end) continue;
        const s = new Date(start);
        const e = new Date(end);
        inRange = d >= s && d <= e;
      } else if (timeRangeType === 'day') {
        const [start, end] = selectedRange || [];
        if (!start || !end) continue;
        const s = new Date(start);
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        inRange = d >= s && d <= e;
      } else if (timeRangeType === 'month') {
        inRange = (d.getMonth() + 1) === Number(selectedRange?.month) &&
                  d.getFullYear() === Number(selectedRange?.year);
      } else if (timeRangeType === 'year') {
        const [startY, endY] = selectedRange || [];
        if (!startY || !endY) continue;
        inRange = d.getFullYear() >= +startY && d.getFullYear() <= +endY;
      }

      if (!inRange) continue;

      (parameterMap[parameter] ??= []).push({ x: d, y: value });
    }

    const createStandardLine = (
      standard: number,
      data: { x: Date; y: number }[]
    ) => {
      const sorted = [...data].sort((a, b) => a.x.getTime() - b.x.getTime());
      if (sorted.length === 0) return [];
      if (sorted.length === 1) {
        const d = sorted[0];
        const prev = new Date(d.x.getTime() - 1000 * 60 * 60);
        const next = new Date(d.x.getTime() + 1000 * 60 * 60);
        return [
          { x: prev, y: standard },
          { x: next, y: standard },
        ];
      }
      return sorted.map(d => ({ x: d.x, y: standard }));
    };

    // สร้าง series
    let series: any[] = [];

    Object.entries(parameterMap).forEach(([name, dataArray]) => {
      const sortedData = dataArray.sort((a, b) => a.x.getTime() - b.x.getTime());
      const fillColor = parameterInfo[name] || '#999999';

      const dataSource =
        timeRangeType === 'hour'
          ? groupByHourAvg(sortedData)
          : timeRangeType === 'year'
            ? (selectedRange?.[0] === selectedRange?.[1]
              ? groupByMonthAvg(groupByDayAvg(sortedData.filter(d => d.x.getFullYear() === +selectedRange[0])))
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
      });

      // เส้น Max Standard (สีแดง)
      if (maxStandardMap[name]) {
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
          });
        }
      }

      // เส้น Min Standard (สีทอง)
      if (minStandardMap[name]) {
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
          });
        }
      }
    });

    setSeriesData(series);
    setUnitMap(localUnitMap);
    setNoData(series.length === 0);
  }, [loading, data, meta, parameters, colors, timeRangeType, selectedRange, reloadKey]);

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

  // กำหนดฟอร์แมตรายแกน X ตามชนิดช่วงเวลา
  const xLabelFormat =
    timeRangeType === 'hour' ? 'HH:mm'
      : timeRangeType === 'year'
        ? (selectedRange?.[0] !== selectedRange?.[1] ? 'yyyy' : 'MMM')
        : 'dd/MM';

  const xIntervalType =
    timeRangeType === 'hour' ? 'Hours'
      : timeRangeType === 'year'
        ? (selectedRange?.[0] !== selectedRange?.[1] ? 'Years' : 'Months')
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
          minimum: 0,
          rangePadding: 'None',
          lineStyle: { width: 0 },
          majorTickLines: { width: 0 },
          minorTickLines: { width: 0 },
        }}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        tooltipRender={(args) => {
          if (args.point && typeof args.point.y === 'number') {
            const y = args.point.y.toFixed(2);
            const d: Date = args.point.x as any;
            let when = '';
            if (timeRangeType === 'hour') {
              when = d.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            } else if (timeRangeType === 'day') {
              when = d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
            } else if (timeRangeType === 'month') {
              when = d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
            } else {
              when = d.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' });
            }
            args.text = `${when} : ${y}`;
          }
        }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        legendSettings={{ background: 'white' }}
      >
        <Inject services={[LineSeries, DateTime, Legend, Tooltip]} />
        <SeriesCollectionDirective>
          {seriesData.map((item, idx) => (
            <SeriesDirective key={idx} {...item} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default LineChart;
