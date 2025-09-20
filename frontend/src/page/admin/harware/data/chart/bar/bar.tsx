import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  ColumnSeries,
  LineSeries,
  Tooltip,
  Legend,
  Category,
} from '@syncfusion/ej2-react-charts';
import { useStateContext } from '../../../../../../contexts/ContextProvider';

type ChartPoint = { parameter: string; date: string; value: number };
type ChartMetaMap = Record<string, { unit?: string; standard?: number; standardMin?: number }>;

interface ColorMappingBarChartProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  timeRangeType: 'hour' | 'day' | 'month' | 'year';
  selectedRange: any;
  chartHeight?: string;
  reloadKey?: number;

  // จากพ่อ
  data?: ChartPoint[];
  meta?: ChartMetaMap;
  loading?: boolean;
}

/* ---------- type guards ---------- */
const isDateRange = (v: any): v is [Date, Date] =>
  Array.isArray(v) && v.length === 2 && v.every((d) => d instanceof Date && !isNaN(d.getTime()));

const isYearRange = (v: any): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(n));

const isMonthSel = (v: any): v is { month: string; year: string } =>
  v && typeof v === 'object' && 'month' in v && 'year' in v;

const Bar: React.FC<ColorMappingBarChartProps> = ({
  parameters,
  colors = [],
  timeRangeType,
  selectedRange,
  chartHeight = '420px',
  reloadKey,
  data = [],
  meta = {},
  loading = false,
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});
  const [noData, setNoData] = useState(false);
  const mounted = useRef(true);

  const parameterInfo = useMemo(() => {
    return parameters.reduce((acc, param, idx) => {
      acc[param] = colors[idx] || '#999999';
      return acc;
    }, {} as Record<string, string>);
  }, [parameters, colors]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    // Guard: รอช่วงเวลาพร้อมและชนิดถูกต้องก่อน
    if (timeRangeType === 'hour' || timeRangeType === 'day') {
      if (!isDateRange(selectedRange)) {
        setSeriesData([]);
        setUnitMap({});
        setNoData(false);
        return;
      }
    } else if (timeRangeType === 'month') {
      if (!isMonthSel(selectedRange)) {
        setSeriesData([]);
        setUnitMap({});
        setNoData(false);
        return;
      }
    } else if (timeRangeType === 'year') {
      if (!isYearRange(selectedRange)) {
        setSeriesData([]);
        setUnitMap({});
        setNoData(false);
        return;
      }
    }

    if (loading) {
      setSeriesData([]);
      setUnitMap({});
      setNoData(false);
      return;
    }
    if (!parameters.length || !Array.isArray(data) || data.length === 0) {
      setSeriesData([]);
      setUnitMap({});
      setNoData(true);
      return;
    }

    // บังคับ label กรณีเลือกวันเดียวในโหมด day เพื่อไม่ให้กราฟว่าง
    const forcedXLabels: string[] = [];
    if (timeRangeType === 'day' && isDateRange(selectedRange)) {
      const [start, end] = selectedRange;
      const s = new Date(start);
      const e = new Date(end);
      if (s.toDateString() === e.toDateString()) {
        const prev = new Date(s.getTime() - 86400000);
        const next = new Date(s.getTime() + 86400000);
        const fmt = (d: Date) =>
          d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Bangkok' });
        forcedXLabels.push(fmt(prev), fmt(s), fmt(next));
      }
    }

    // meta → unit/standards
    const maxStandardMap: Record<string, number> = {};
    const minStandardMap: Record<string, number> = {};
    const unitMapping: Record<string, string> = {};
    for (const p of parameters) {
      const m = meta[p];
      if (m?.unit && !unitMapping[m.unit]) unitMapping[m.unit] = p;
      if (typeof m?.standard === 'number') maxStandardMap[p] = m.standard;
      if (typeof m?.standardMin === 'number') minStandardMap[p] = m.standardMin;
    }

    // Build buckets ตามแกน X (label เป็น string ที่สอดคล้องแต่ละโหมด)
    const dataMap: Record<string, { x: string; y: number }[]> = {};

    const pushPoint = (name: string, d: Date, value: number) => {
      let label = '';
      if (timeRangeType === 'hour') {
        const [start, end] = selectedRange as [Date, Date];
        if (d < start || d > end) return;
        const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Bangkok' });
        const timePart = d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Bangkok',
        });
        label = `${datePart} ${timePart}`; // dd/MM HH:mm
      } else if (timeRangeType === 'day') {
        const [start, end] = selectedRange as [Date, Date];
        const s = new Date(start);
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        if (d < s || d > e) return;
        label = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Bangkok' }); // dd/MM
      } else if (timeRangeType === 'month') {
        const { month, year } = selectedRange as { month: string; year: string };
        if ((d.getMonth() + 1) !== Number(month) || d.getFullYear() !== Number(year)) return;
        label = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Bangkok' }); // dd/MM
      } else {
        const [ys, ye] = selectedRange as [number, number];
        if (d.getFullYear() < +ys || d.getFullYear() > +ye) return;
        label = ys === ye
          ? d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'Asia/Bangkok' }) // Mon
          : d.getFullYear().toString(); // YYYY
      }
      if (!label) return;
      (dataMap[name] ??= []).push({ x: label, y: value });
    };

    for (const pt of data) {
      const { parameter, date, value } = pt;
      if (!parameters.includes(parameter)) continue;
      if (typeof value !== 'number') continue;
      const d = new Date(date);
      if (isNaN(d.getTime())) continue;
      pushPoint(parameter, d, value);
    }

    if (Object.keys(dataMap).length === 0) {
      setSeriesData([]);
      setUnitMap(unitMapping);
      setNoData(true);
      return;
    }

    // รวม & จัดเรียง labels แกน X
    const allXSet = new Set<string>();
    Object.values(dataMap).forEach(arr => arr.forEach(p => allXSet.add(p.x)));
    forcedXLabels.forEach(x => allXSet.add(x));

    const toDateForSort = (label: string): Date | string => {
      // รองรับ "dd/MM", "dd/MM HH:mm", "Mon", "YYYY"
      const m2 = /^(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/.exec(label); // dd/MM HH:mm
      if (m2) {
        const [, dd, MM, hh, mm] = m2;
        const y = new Date().getFullYear();
        return new Date(y, +MM - 1, +dd, +hh, +mm);
      }
      const m1 = /^(\d{2})\/(\d{2})$/.exec(label); // dd/MM
      if (m1) {
        const [, dd, MM] = m1;
        const y = new Date().getFullYear();
        return new Date(y, +MM - 1, +dd);
      }
      const y4 = /^\d{4}$/.test(label); // YYYY
      if (y4) return new Date(+label, 0, 1);
      // Mon (Jan..Dec)
      const mon = Date.parse(label + ' 1, 2000');
      if (!isNaN(mon)) return new Date(mon);
      return label; // fallback compare string
    };

    const allX = Array.from(allXSet).sort((a, b) => {
      const da = toDateForSort(a);
      const db = toDateForSort(b);
      if (da instanceof Date && db instanceof Date) return da.getTime() - db.getTime();
      return String(a).localeCompare(String(b));
    });

    // ทำค่าเฉลี่ยต่อ bucket และสร้างซีรีส์
    const series: any[] = [];
    for (const [name, values] of Object.entries(dataMap)) {
      const grouped: Record<string, number[]> = {};
      values.forEach(({ x, y }) => {
        (grouped[x] ??= []).push(y);
      });
      const averaged = allX.map((x) => ({
        x,
        y: grouped[x] ? grouped[x].reduce((s, v) => s + v, 0) / grouped[x].length : null,
      }));

      // แท่งจริง
      series.push({
        dataSource: averaged,
        xName: 'x',
        yName: 'y',
        name,
        type: 'Column',
        fill: parameterInfo[name],
        columnSpacing: 0.1,
        width: 0.5,
        cornerRadius: { topLeft: 5, topRight: 5 },
        animation: { enable: false },
      });

      // เส้น Max (รองรับค่า 0 ด้วย hasOwnProperty)
      if (Object.prototype.hasOwnProperty.call(maxStandardMap, name)) {
        const stdDataMax = allX.map((x) => ({ x, y: maxStandardMap[name] }));
        series.push({
          dataSource: stdDataMax,
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

      // เส้น Min
      if (Object.prototype.hasOwnProperty.call(minStandardMap, name)) {
        const stdDataMin = allX.map((x) => ({ x, y: minStandardMap[name] }));
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

    if (!mounted.current) return;
    setSeriesData(series);
    setUnitMap(unitMapping);
    setNoData(series.length === 0);
  }, [parameters, colors, timeRangeType, selectedRange, reloadKey, loading, data, meta, parameterInfo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80 text-gray-500 text-lg">
        Loading...
      </div>
    );
  }
  if (noData) {
    return (
      <div className="flex justify-center items-center h-80 text-red-500 font-bold">
        ไม่มีข้อมูลในช่วงเวลาที่เลือก
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '40px' }}>
      <div style={{ position: 'absolute', top: '4px', zIndex: 10 }}>
        <span className="text-black font-bold">หน่วย : </span>
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
                fontWeight: 'bold',
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
          valueType: 'Category',
          title: 'วันที่บันทึก',
          labelIntersectAction: 'Rotate45',
          interval: 1,
        }}
        primaryYAxis={{
          labelFormat: '{value}',
          title: 'ค่าที่ได้จากการตรวจวัด',
          // ถ้าต้องการ auto scale ให้คอมเมนต์ minimum ออก
          minimum: 0,
          rangePadding: 'None',
          lineStyle: { width: 0 },
          majorTickLines: { width: 0 },
          minorTickLines: { width: 0 },
        }}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        tooltipRender={(args) => {
          if (args.point && typeof (args.point as any).y === 'number') {
            const formattedValue = (args.point as any).y.toFixed(2);
            args.text = `${args.series.name} — ${(args.point as any).x} : ${formattedValue}`;
          }
        }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        legendSettings={{ background: 'white' }}
      >
        <Inject services={[ColumnSeries, LineSeries, Tooltip, Legend, Category]} />
        <SeriesCollectionDirective>
          {seriesData.map((s) => (
            <SeriesDirective key={`${s.name}-${s.type}`} {...s} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Bar;
