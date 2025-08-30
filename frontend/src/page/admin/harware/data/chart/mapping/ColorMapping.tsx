import React, { useEffect, useState, useRef, useMemo } from 'react';
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

  // ✅ รับจากพ่อ
  data?: ChartPoint[];
  meta?: ChartMetaMap;
  loading?: boolean;
}

const ColorMapping: React.FC<ColorMappingBarChartProps> = ({
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
    return () => { mounted.current = false; };
  }, [reloadKey]);

  const isRangeReady = useMemo(() => {
    if (!selectedRange) return false;
    if (timeRangeType === 'hour') return Array.isArray(selectedRange) && selectedRange.length === 2;
    if (timeRangeType === 'day') return Array.isArray(selectedRange) && selectedRange.length === 2;
    if (timeRangeType === 'month') return selectedRange?.month && selectedRange?.year;
    if (timeRangeType === 'year') return Array.isArray(selectedRange) && selectedRange.length === 2;
    return false;
  }, [selectedRange, timeRangeType]);

  useEffect(() => {
    if (!isRangeReady) return;

    // ใช้ state จากพ่อ
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

    // สำหรับกรณีเลือก “วันเดียว” (โหมด day) → เพิ่ม label วันก่อน/ถัดไปให้กราฟไม่ว่าง
    const forcedXLabels: string[] = [];
    if (timeRangeType === 'day' && Array.isArray(selectedRange) && selectedRange.length === 2) {
      const [start, end] = selectedRange;
      const s = new Date(start);
      const e = new Date(end);
      if (s.toDateString() === e.toDateString()) {
        const prev = new Date(s.getTime() - 86400000);
        const next = new Date(s.getTime() + 86400000);
        forcedXLabels.push(
          prev.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
          s.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
          next.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        );
      }
    }

    // unit/standard จาก meta
    const maxStandardMap: Record<string, number> = {};
    const minStandardMap: Record<string, number> = {};
    const unitMapping: Record<string, string> = {};
    for (const p of parameters) {
      const m = meta[p];
      if (m?.unit && !unitMapping[m.unit]) unitMapping[m.unit] = p;
      if (typeof m?.standard === 'number') maxStandardMap[p] = m.standard;
      if (typeof m?.standardMin === 'number') minStandardMap[p] = m.standardMin;
    }

    // แปลงเป็น bucket ตาม label x
    const dataMap: Record<string, { x: string; y: number }[]> = {};

    const pushPoint = (name: string, d: Date, value: number) => {
      let label = '';
      if (timeRangeType === 'hour') {
        const [start, end] = selectedRange || [];
        if (!start || !end) return;
        const s = new Date(start); const e = new Date(end);
        if (d < s || d > e) return;
        const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        label = `${datePart} ${timePart}`;
      } else if (timeRangeType === 'day') {
        const [start, end] = selectedRange || [];
        if (!start || !end) return;
        const s = new Date(start); const e = new Date(end); e.setHours(23,59,59,999);
        if (d < s || d > e) return;
        label = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      } else if (timeRangeType === 'month') {
        const m = Number(selectedRange?.month);
        const y = Number(selectedRange?.year);
        if ((d.getMonth()+1) !== m || d.getFullYear() !== y) return;
        label = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      } else if (timeRangeType === 'year') {
        const [ys, ye] = selectedRange || [];
        if (d.getFullYear() < +ys || d.getFullYear() > +ye) return;
        label = (ys === ye) ? d.toLocaleDateString('en-GB', { month: 'short' }) : d.getFullYear().toString();
      }
      if (!label) return;

      (dataMap[name] ??= []).push({ x: label, y: value });
    };

    for (const pt of data) {
      const { parameter, date, value } = pt;
      if (!parameters.includes(parameter)) continue;
      const d = new Date(date);
      if (isNaN(d.getTime()) || typeof value !== 'number') continue;
      pushPoint(parameter, d, value);
    }

    if (Object.keys(dataMap).length === 0) {
      setSeriesData([]);
      setUnitMap(unitMapping);
      setNoData(true);
      return;
    }

    // รวม label แกน X ทั้งหมด + บังคับ label ที่ต้องมี
    const allXSet = new Set<string>();
    Object.values(dataMap).forEach(arr => arr.forEach(p => allXSet.add(p.x)));
    forcedXLabels.forEach(x => allXSet.add(x));

    const toDateForSort = (label: string): Date | string => {
      // รองรับ "dd/MM", "dd/MM HH:mm", "Mon", "YYYY"
      const generic = new Date(label);
      if (!isNaN(generic.getTime())) return generic;

      const m1 = /^(\d{2})\/(\d{2})$/.exec(label); // dd/MM
      if (m1) {
        const [, dd, MM] = m1;
        const y = new Date().getFullYear();
        return new Date(+y, +MM - 1, +dd);
      }

      const m2 = /^(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/.exec(label); // dd/MM HH:mm
      if (m2) {
        const [, dd, MM, hh, mm] = m2;
        const y = new Date().getFullYear();
        return new Date(+y, +MM - 1, +dd, +hh, +mm);
      }

      return label; // ถ้า parse ไม่ได้ ให้เทียบเป็น string
    };

    const allX = Array.from(allXSet).sort((a, b) => {
      const da = toDateForSort(a);
      const db = toDateForSort(b);
      if (da instanceof Date && db instanceof Date) return da.getTime() - db.getTime();
      return String(a).localeCompare(String(b));
    });

    // ทำค่าเฉลี่ยต่อ bucket
    const series: any[] = [];
    for (const [name, values] of Object.entries(dataMap)) {
      const grouped: Record<string, number[]> = {};
      values.forEach(({ x, y }) => {
        grouped[x] ??= [];
        grouped[x].push(y);
      });

      const averaged = allX.map((x: string) => ({
        x,
        y: grouped[x] ? grouped[x].reduce((sum, val) => sum + val, 0) / grouped[x].length : null,
      }));

      // ค่าจริง (แท่ง)
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
      });

      // Max (แดง)
      if (maxStandardMap[name]) {
        const stdDataMax = allX.map((x: string) => ({ x, y: maxStandardMap[name] }));
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
        });
      }

      // Min (ทอง)
      if (minStandardMap[name]) {
        const stdDataMin = allX.map((x: string) => ({ x, y: minStandardMap[name] }));
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

    if (!mounted.current) return;
    setSeriesData(series);
    setUnitMap(unitMapping);
    setNoData(series.length === 0);
  }, [parameters, colors, timeRangeType, selectedRange, reloadKey, loading, data, meta, isRangeReady, parameterInfo]);

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
          title: "วันที่บันทึก",
          labelIntersectAction: 'Rotate45',
          interval: 1,
        }}
        primaryYAxis={{
          labelFormat: '{value}',
          title: 'ค่าที่ได้จากการตรวจวัด',
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
          {seriesData.map((s, idx) => (
            <SeriesDirective key={idx} {...s} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default ColorMapping;
