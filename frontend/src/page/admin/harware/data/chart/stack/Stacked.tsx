import React, { useEffect, useState, useRef } from 'react';
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
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
} from '../../../../../../services/hardware';
import { fetchWithRetry } from '../untils/fetchWithRetry';

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  timeRangeType: 'hour' | 'day' | 'month' | 'year';
  selectedRange: any;
  chartHeight?: string;
  reloadKey?: number;
}

function labelHour(date: Date) {
  const d = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
  const t = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${d} ${t}`; // dd/MM HH:mm
}
function labelDay(date: Date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }); // dd/MM
}
function labelMonth(date: Date) {
  return date.toLocaleDateString('en-GB', { month: 'short' }); // Jan..Dec
}

function groupAvgByLabel(data: { x: string; y: number }[], categories: string[]) {
  const map: Record<string, number[]> = {};
  data.forEach(d => {
    map[d.x] ??= [];
    map[d.x].push(d.y);
  });
  const existing = new Map(Object.entries(map).map(([x, ys]) => [x, ys.reduce((a,b)=>a+b,0) / ys.length]));
  return categories.map(x => ({ x, y: existing.get(x) ?? 0 }));
}

const Stacked: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors = [],
  timeRangeType,
  selectedRange,
  chartHeight = '420px',
  reloadKey,
}) => {
  const { currentMode } = useStateContext();
  const [seriesDataByParam, setSeriesDataByParam] = useState<Record<string, { x: string; y: number }[]>>({});
  const [standardLines, setStandardLines] = useState<any[]>([]);//@ts-ignore
  const [categories, setCategories] = useState<string[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});
  const [sortedParams, setSortedParams] = useState<string[]>([]);
  const [hasData, setHasData] = useState(true);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, [reloadKey]);



  useEffect(() => {
    (async () => {
      setLoading(true);
      setSeriesDataByParam({});
      setStandardLines([]);
      setCategories([]);
      setUnitMap({});
      setSortedParams([]);
      setHasData(true);

      if (!hardwareID || !parameters?.length || !selectedRange) {
        setLoading(false);
        setHasData(false);
        return;
      }

      // กรณีเลือกวันเดียว: เติม label ก่อน/ถัดไป
      const forcedXLabels: string[] = [];
      if (timeRangeType === 'day' && Array.isArray(selectedRange) && selectedRange.length === 2) {
        const s = new Date(selectedRange[0]);
        const e = new Date(selectedRange[1]);
        if (s.toDateString() === e.toDateString()) {
          const prev = new Date(s.getTime() - 86400000);
          const next = new Date(s.getTime() + 86400000);
          forcedXLabels.push(labelDay(prev), labelDay(s), labelDay(next));
        }
      }

      try {
        const raw = await fetchWithRetry(() => GetSensorDataByHardwareID(hardwareID), 5, 1000);

        const paramPoints: Record<string, { x: string; y: number }[]> = {};
        const stdMaxMap: Record<string, number> = {};
        const stdMinMap: Record<string, number> = {};
        const unitMapping: Record<string, string> = {};
        const xSet = new Set<string>(forcedXLabels);

        if (!Array.isArray(raw) || raw.length === 0) {
          setHasData(false);
          setLoading(false);
          return;
        }

        await Promise.all(
          raw.map(async sensor => {
            const params = await fetchWithRetry(
              () => GetSensorDataParametersBySensorDataID(sensor.ID),
              5,
              1000
            );
            if (!Array.isArray(params)) return;

            for (const param of params) {
              const name: string | undefined = param.HardwareParameter?.Parameter;
              const unit: string | undefined = param.HardwareParameter?.UnitHardware?.Unit;
              const maxStd: number | undefined = param.HardwareParameter?.StandardHardware?.MaxValueStandard;
              const minStd: number | undefined = param.HardwareParameter?.StandardHardware?.MinValueStandard;
              const vRaw = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
              const value: number = Number(vRaw);
              const date = new Date(param.Date);

              if (!name || !parameters.includes(name)) continue;
              if (isNaN(value) || isNaN(date.getTime())) continue;

              let inRange = false;
              let label = '';

              if (timeRangeType === 'hour') {
                const [start, end] = selectedRange || [];
                if (!start || !end) continue;
                const s = new Date(start);
                const e = new Date(end);
                inRange = date >= s && date <= e;
                if (inRange) label = labelHour(date);
              } else if (timeRangeType === 'day') {
                const [start, end] = selectedRange || [];
                if (!start || !end) continue;
                const s = new Date(start);
                const e = new Date(end);
                s.setHours(0,0,0,0);
                e.setHours(23,59,59,999);
                inRange = date >= s && date <= e;
                if (inRange) label = labelDay(date);
              } else if (timeRangeType === 'month') {
                inRange =
                  date.getMonth() + 1 === Number(selectedRange?.month) &&
                  date.getFullYear() === Number(selectedRange?.year);
                if (inRange) label = labelDay(date); // แสดงเป็นวันในเดือน
              } else if (timeRangeType === 'year') {
                const [ys, ye] = selectedRange || [];
                const sameYear = +ys === +ye;
                inRange = date.getFullYear() >= +ys && date.getFullYear() <= +ye;
                if (inRange) label = sameYear ? labelMonth(date) : date.getFullYear().toString();
              }

              if (!inRange || !label) continue;

              paramPoints[name] ??= [];
              paramPoints[name].push({ x: label, y: value });
              xSet.add(label);

              if (typeof maxStd === 'number' && maxStd > 0 && !stdMaxMap[name]) stdMaxMap[name] = maxStd;
              if (typeof minStd === 'number' && minStd > 0 && !stdMinMap[name]) stdMinMap[name] = minStd;
              if (unit && !unitMapping[unit]) unitMapping[unit] = name;
            }
          })
        );

        // เรียงแกน X ให้ถูกลำดับเวลา
        const parseKey = (s: string): number | string => {
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
        };

        const xCats = Array.from(xSet).sort((a, b) => {
          const ka = parseKey(a);
          const kb = parseKey(b);
          if (typeof ka === 'number' && typeof kb === 'number') return ka - kb;
          return String(a).localeCompare(String(b));
        });

        // ทำค่าเฉลี่ย/เติม 0 ให้ครบทุก category
        const seriesByParam: Record<string, { x: string; y: number }[]> = {};
        for (const p of parameters) {
          const arr = paramPoints[p] ?? [];
          seriesByParam[p] = groupAvgByLabel(arr, xCats);
        }

        // sort legend/stack โดยยอดรวมรวมจากน้อยไปมาก (อ่าน layer ง่าย)
        const totals = Object.fromEntries(
          parameters.map(p => [p, seriesByParam[p].reduce((s, d) => s + d.y, 0)])
        );
        const sorted = [...parameters].sort((a, b) => totals[a] - totals[b]);

        // เส้นมาตรฐาน
        const stdSeries: any[] = [];
        Object.entries(stdMaxMap).forEach(([p, std]) => {
          stdSeries.push({
            dataSource: xCats.map(x => ({ x, y: std })),
            xName: 'x',
            yName: 'y',
            type: 'Line',
            name: `${p} (Max)`,
            dashArray: '5,5',
            width: 2,
            marker: { visible: false },
            fill: 'red',
          });
        });
        Object.entries(stdMinMap).forEach(([p, std]) => {
          stdSeries.push({
            dataSource: xCats.map(x => ({ x, y: std })),
            xName: 'x',
            yName: 'y',
            type: 'Line',
            name: `${p} (Min)`,
            dashArray: '5,5',
            width: 2,
            marker: { visible: false },
            fill: '#f59e0b',
          });
        });

        const hasSeries =
          xCats.length > 0 &&
          sorted.some(p => seriesByParam[p]?.some(d => d.y !== 0));

        if (mounted.current) {
          if (hasSeries) {
            setSeriesDataByParam(seriesByParam);
            setCategories(xCats);
            setStandardLines(stdSeries);
            setUnitMap(unitMapping);
            setSortedParams(sorted);
            setHasData(true);
          } else {
            setSeriesDataByParam({});
            setCategories([]);
            setHasData(false);
          }
          setLoading(false);
        }
      } catch (e) {
        if (mounted.current) {
          setHasData(false);
          setLoading(false);
        }
      }
    })();
  }, [hardwareID, parameters, timeRangeType, selectedRange, reloadKey]);

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
        {Object.entries(unitMap).map(([unit, param]) => {
          const idx = parameters.indexOf(param);
          const color = colors?.[idx] ?? (currentMode === 'Dark' ? '#fff' : '#000');
          return (
            <span
              key={unit}
              style={{
                color,
                backgroundColor: currentMode === 'Dark' ? '#33373E' : '#f0f0f0',
                padding: '2px 8px',
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
        id={`stacked-${parameters.join('-')}`}
        width="100%"
        height={chartHeight}
        primaryXAxis={{
          valueType: 'Category',
          title: "วันที่บันทึก",
          majorGridLines: { width: 0 },
          labelIntersectAction: 'Rotate45',
          interval: 1,
        }}
        primaryYAxis={{
          labelFormat: '{value}',
          title: 'ค่าที่ได้จากการตรวจวัด',
          lineStyle: { width: 0 },
          majorTickLines: { width: 0 },
          minorTickLines: { width: 0 },
        }}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        tooltipRender={(args) => {
          if (args.point && typeof (args.point as any).y === 'number') {
            const y = (args.point as any).y.toFixed(2);
            args.text = `${(args.point as any).x} : ${y}`;
          }
        }}
        legendSettings={{ background: 'white' }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
      >
        <Inject services={[StackingColumnSeries, Category, Legend, Tooltip, LineSeries]} />
        <SeriesCollectionDirective>
          {sortedParams.map((param, index) => (
            <SeriesDirective
              key={index}
              dataSource={seriesDataByParam[param]}
              xName="x"
              yName="y"
              name={param}
              type="StackingColumn"
              // @ts-ignore Syncfusion accepts cornerRadius on column/stacking column
              cornerRadius={{ topLeft: 5, topRight: 5 }}
              fill={colors[parameters.indexOf(param)]}
            />
          ))}
          {standardLines.map((line, i) => (
            <SeriesDirective key={`std-${i}`} {...line} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Stacked;
