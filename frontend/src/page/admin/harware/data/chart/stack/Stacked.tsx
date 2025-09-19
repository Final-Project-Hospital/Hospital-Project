import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  StackingColumnSeries,
  Category,
  Legend,
  Tooltip,
  LineSeries,
} from '@syncfusion/ej2-react-charts';
import { useStateContext } from '../../../../../../contexts/ContextProvider';

type ChartPoint = { parameter: string; date: string; value: number };
type ChartMetaMap = Record<string, { unit?: string; standard?: number; standardMin?: number }>;

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  timeRangeType: 'hour' | 'day' | 'month' | 'year';
  selectedRange: any;
  chartHeight?: string;
  reloadKey?: number;

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

/* ---------- label helpers ---------- */
const labelHour = (d: Date) =>
  `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
const labelDay = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
const labelMonth = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' });

/* ---------- group/avg helpers ---------- */
function groupAvgByLabel(data: { x: string; y: number }[], categories: string[]) {
  const bucket: Record<string, number[]> = {};
  for (const p of data) (bucket[p.x] ??= []).push(p.y);
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  return categories.map((x) => ({ x, y: bucket[x] ? avg(bucket[x]) : 0 }));
}

/* ---------- parse key to sort time-like labels ---------- */
function keyToSortValue(s: string): number | string {
  // dd/MM HH:mm
  let m = /^(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/.exec(s);
  if (m) {
    const [, dd, MM, hh, mm] = m;
    const y = new Date().getFullYear();
    return new Date(+y, +MM - 1, +dd, +hh, +mm).getTime();
  }
  // dd/MM
  m = /^(\d{2})\/(\d{2})$/.exec(s);
  if (m) {
    const [, dd, MM] = m;
    const y = new Date().getFullYear();
    return new Date(+y, +MM - 1, +dd).getTime();
  }
  // Mon (Jan..Dec)
  if (/^[A-Za-z]{3}$/.test(s)) {
    const y = new Date().getFullYear();
    const d = new Date(`${s} 1, ${y}`);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  // YYYY
  if (/^\d{4}$/.test(s)) return +s;
  return s;
}

const Stacked: React.FC<ChartdataProps> = ({
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

  const [seriesByParam, setSeriesByParam] = useState<Record<string, { x: string; y: number }[]>>({});
  const [stdLines, setStdLines] = useState<any[]>([]); //@ts-ignore
  const [xCats, setXCats] = useState<string[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});
  const [sortedParams, setSortedParams] = useState<string[]>([]);
  const [hasData, setHasData] = useState(true);

  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, [reloadKey]);

  // สี fallback
  const colorOf = useMemo(() => {
    const map: Record<string, string> = {};
    parameters.forEach((p, i) => { map[p] = colors[i] || '#999999'; });
    return map;
  }, [parameters, colors]);

  // กัน selectedRange ไม่ตรงชนิด (เฝ้าในตัวคอมโพเนนต์ด้วย)
  const rangeReady = useMemo(() => {
    if (timeRangeType === 'hour' || timeRangeType === 'day') return isDateRange(selectedRange);
    if (timeRangeType === 'month') return isMonthSel(selectedRange);
    if (timeRangeType === 'year') return isYearRange(selectedRange);
    return false;
  }, [timeRangeType, selectedRange]);

  useEffect(() => {
    if (!rangeReady) return;

    if (loading) {
      setSeriesByParam({}); setStdLines([]); setXCats([]); setUnitMap({});
      setSortedParams([]); setHasData(true);
      return;
    }

    if (!parameters.length || !Array.isArray(data) || data.length === 0) {
      setSeriesByParam({}); setXCats([]); setUnitMap({}); setSortedParams([]); setHasData(false);
      return;
    }

    // unit/standard
    const stdMax: Record<string, number> = {};
    const stdMin: Record<string, number> = {};
    const unitMapping: Record<string, string> = {};
    for (const p of parameters) {
      const m = meta[p];
      if (m?.unit && !unitMapping[m.unit]) unitMapping[m.unit] = p;
      if (typeof m?.standard === 'number') stdMax[p] = m.standard;
      if (typeof m?.standardMin === 'number') stdMin[p] = m.standardMin;
    }

    const forcedX: string[] = [];
    // ถ้าเลือก "วันเดียว" ในโหมด day → เติม label ก่อน/ถัดไปให้แกนไม่ว่าง
    if (timeRangeType === 'day' && isDateRange(selectedRange)) {
      const [s0, e0] = selectedRange;
      if (s0 && e0 && s0.toDateString() === e0.toDateString()) {
        const prev = new Date(s0.getTime() - 86400000);
        const next = new Date(s0.getTime() + 86400000);
        forcedX.push(labelDay(prev), labelDay(s0), labelDay(next));
      }
    }

    // กรอง & สร้าง label
    const pointsByParam: Record<string, { x: string; y: number }[]> = {};
    const xset = new Set<string>(forcedX);

    const pushPoint = (p: string, d: Date, v: number) => {
      let ok = false; let x = '';
      if (timeRangeType === 'hour' && isDateRange(selectedRange)) {
        const [s, e] = selectedRange; ok = d >= s && d <= e; if (ok) x = labelHour(d);
      } else if (timeRangeType === 'day' && isDateRange(selectedRange)) {
        const [s, e] = selectedRange; const s2 = new Date(s); const e2 = new Date(e);
        s2.setHours(0,0,0,0); e2.setHours(23,59,59,999);
        ok = d >= s2 && d <= e2; if (ok) x = labelDay(d);
      } else if (timeRangeType === 'month' && isMonthSel(selectedRange)) {
        const m = +selectedRange.month, y = +selectedRange.year;
        ok = (d.getMonth() + 1) === m && d.getFullYear() === y; if (ok) x = labelDay(d);
      } else if (timeRangeType === 'year' && isYearRange(selectedRange)) {
        const [ys, ye] = selectedRange; ok = d.getFullYear() >= +ys && d.getFullYear() <= +ye;
        if (ok) x = (ys === ye) ? labelMonth(d) : d.getFullYear().toString();
      }
      if (!ok || !x) return;
      (pointsByParam[p] ??= []).push({ x, y: v });
      xset.add(x);
    };

    for (const pt of data) {
      if (!parameters.includes(pt.parameter)) continue;
      const d = new Date(pt.date);
      if (isNaN(d.getTime()) || typeof pt.value !== 'number') continue;
      pushPoint(pt.parameter, d, pt.value);
    }

    const xCatsSorted = Array.from(xset).sort((a, b) => {
      const va = keyToSortValue(a); const vb = keyToSortValue(b);
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(a).localeCompare(String(b));
    });

    // รวม/เฉลี่ยและเติม 0 ให้ครบทุก bucket
    const byParam: Record<string, { x: string; y: number }[]> = {};
    for (const p of parameters) byParam[p] = groupAvgByLabel(pointsByParam[p] ?? [], xCatsSorted);

    // sort layer ตามยอดรวม (เล็ก→ใหญ่ อ่านซ้อนง่าย)
    const totals = Object.fromEntries(parameters.map(p => [p, byParam[p].reduce((s, d) => s + d.y, 0)]));
    const sorted = [...parameters].sort((a, b) => totals[a] - totals[b]);

    // เส้นมาตรฐาน (สร้างต่อเมื่อมีแกน X)
    const stds: any[] = [];
    if (xCatsSorted.length) {
      for (const [p, val] of Object.entries(stdMax)) {
        stds.push({
          dataSource: xCatsSorted.map(x => ({ x, y: val })),
          xName: 'x', yName: 'y', type: 'Line',
          name: `${p} (Max)`, dashArray: '5,5', width: 2,
          marker: { visible: false }, fill: 'red', animation: { enable: false },
        });
      }
      for (const [p, val] of Object.entries(stdMin)) {
        stds.push({
          dataSource: xCatsSorted.map(x => ({ x, y: val })),
          xName: 'x', yName: 'y', type: 'Line',
          name: `${p} (Min)`, dashArray: '5,5', width: 2,
          marker: { visible: false }, fill: '#f59e0b', animation: { enable: false },
        });
      }
    }

    const someData = xCatsSorted.length > 0 && sorted.some(p => byParam[p]?.some(d => d.y !== 0));

    if (mounted.current) {
      if (someData) {
        setSeriesByParam(byParam);
        setXCats(xCatsSorted);
        setStdLines(stds);
        setUnitMap(unitMapping);
        setSortedParams(sorted);
        setHasData(true);
      } else {
        setSeriesByParam({});
        setXCats([]);
        setHasData(false);
      }
    }
  }, [parameters, colors, timeRangeType, selectedRange, reloadKey, loading, data, meta, rangeReady]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 text-lg text-gray-500">
        <span className="animate-spin border-4 border-teal-300 rounded-full border-t-transparent w-10 h-10 mr-4" />
        Loading...
      </div>
    );
  }
  if (!hasData) {
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
        {Object.entries(unitMap).map(([unit, param]) => (
          <span
            key={unit}
            style={{
              color: colorOf[param] || (currentMode === 'Dark' ? '#fff' : '#000'),
              backgroundColor: currentMode === 'Dark' ? '#33373E' : '#f0f0f0',
              padding: '2px 8px', marginRight: 8, borderRadius: 6, fontWeight: 'bold',
            }}
          >
            {unit}
          </span>
        ))}
      </div>

      <ChartComponent
        id={`stacked-${parameters.length ? parameters.join('-') : 'none'}`}
        width="100%"
        height={chartHeight}
        primaryXAxis={{
          valueType: 'Category',
          title: "วันที่บันทึก",
          labelIntersectAction: 'Rotate45',
          interval: 1,
          majorGridLines: { width: 0 },
        }}
        primaryYAxis={{
          title: 'ค่าที่ได้จากการตรวจวัด',
          labelFormat: '{value}',
          lineStyle: { width: 0 },
          majorTickLines: { width: 0 },
          minorTickLines: { width: 0 },
        }}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        tooltipRender={(args) => {
          const pt: any = args.point;
          if (pt && typeof pt.y === 'number') {
            args.text = `${pt.x} : ${pt.y.toFixed(2)}`;
          }
        }}
        legendSettings={{ background: 'white' }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
      >
        <Inject services={[StackingColumnSeries, Category, Legend, Tooltip, LineSeries]} />
        <SeriesCollectionDirective>
          {sortedParams.map((p) => (
            <SeriesDirective
              key={`stack-${p}`}
              dataSource={seriesByParam[p]}
              xName="x"
              yName="y"
              name={p}
              type="StackingColumn"
              // @ts-ignore cornerRadius supported at runtime
              cornerRadius={{ topLeft: 5, topRight: 5 }}
              fill={colorOf[p]}
              animation={{ enable: false }}
            />
          ))}
          {stdLines.map((s, i) => (
            <SeriesDirective key={`std-${i}`} {...s} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Stacked;
