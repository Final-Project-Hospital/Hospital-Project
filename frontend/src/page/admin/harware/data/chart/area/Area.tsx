import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  DateTime,
  SplineAreaSeries,
  Legend,
  Tooltip,
  LineSeries
} from '@syncfusion/ej2-react-charts';
import { useStateContext } from '../../../../../../contexts/ContextProvider';
import { useEffect, useState, useRef } from 'react';
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID
} from '../../../../../../services/hardware';

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  timeRangeType: 'hour' | 'day' | 'month' | 'year';
  selectedRange: any;
  chartHeight?: string;
  reloadKey?: number;
}

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
  const groups: Record<string, number[]> = {};
  data.forEach(d => {
    const key = d.x.toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(d.y);
  });
  return Object.entries(groups)
    .map(([day, values]) => ({
      x: new Date(day),
      y: values.reduce((sum, val) => sum + val, 0) / values.length,
    }))
    .sort((a, b) => a.x.getTime() - b.x.getTime());
}
function groupByMonthAvg(data: { x: Date; y: number }[]) {
  const groups: Record<string, number[]> = {};
  data.forEach(d => {
    const key = `${d.x.getFullYear()}-${d.x.getMonth() + 1}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d.y);
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
    if (!groups[key]) groups[key] = [];
    groups[key].push(d.y);
  });
  return Object.entries(groups)
    .map(([year, values]) => ({
      x: getYearStartDate(Number(year)),
      y: values.reduce((sum, val) => sum + val, 0) / values.length,
    }))
    .sort((a, b) => a.x.getTime() - b.x.getTime());
}

const RETRY_INTERVAL = 1500;
const MAX_RETRIES = 10;

const Area: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors = [],
  timeRangeType,
  selectedRange,
  chartHeight = "420px",
  reloadKey,
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});

  const parameterColor: Record<string, string> = parameters.reduce((acc, p, i) => {
    acc[p] = colors[i] || '#999999';
    return acc;
  }, {} as Record<string, string>);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, [reloadKey]);

  useEffect(() => {
    let stop = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;

    async function fetchLoop() {
      setLoading(true);
      setNoData(false);
      setSeriesData([]);
      setUnitMap({});

      if (!hardwareID || !parameters?.length) {
        setLoading(false);
        setNoData(true);
        return;
      }

      try {
        const raw = await GetSensorDataByHardwareID(hardwareID);
        if (!mounted.current || stop) return;
        if (!Array.isArray(raw) || raw.length === 0) throw new Error("No sensor");

        const parameterMap: Record<string, { x: Date; y: number }[]> = {};
        const maxStandardMap: Record<string, number> = {};
        const minStandardMap: Record<string, number> = {};
        const unitMapping: Record<string, string> = {};

        for (const sensor of raw) {
          const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
          if (!Array.isArray(params)) continue;

          for (const param of params) {
            const name = param.HardwareParameter?.Parameter;
            const val = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
            const date = new Date(param.Date);
            const maxStd = param.HardwareParameter?.StandardHardware?.MaxValueStandard;
            const minStd = param.HardwareParameter?.StandardHardware?.MinValueStandard;
            const unit = param.HardwareParameter?.UnitHardware?.Unit;

            if (!name || !parameters.includes(name) || isNaN(val) || isNaN(date.getTime())) continue;

            let inRange = false;
            if (timeRangeType === 'hour') {
              const [start, end] = selectedRange || [];
              if (!start || !end) continue;
              const s = new Date(start);
              const e = new Date(end);
              inRange = date >= s && date <= e;
            } else if (timeRangeType === 'day') {
              const [start, end] = selectedRange || [];
              if (!start || !end) continue;
              const s = new Date(start);
              const e = new Date(end);
              e.setHours(23, 59, 59, 999);
              inRange = date >= s && date <= e;
            } else if (timeRangeType === 'month') {
              inRange = date.getMonth() + 1 === Number(selectedRange?.month) &&
                        date.getFullYear() === Number(selectedRange?.year);
            } else if (timeRangeType === 'year') {
              const [ys, ye] = selectedRange || [];
              if (ys == null || ye == null) continue;
              inRange = date.getFullYear() >= +ys && date.getFullYear() <= +ye;
            }

            if (!inRange) continue;

            parameterMap[name] ??= [];
            parameterMap[name].push({ x: date, y: val });

            if (typeof maxStd === 'number' && maxStd > 0 && !maxStandardMap[name]) {
              maxStandardMap[name] = maxStd;
            }
            if (typeof minStd === 'number' && minStd > 0 && !minStandardMap[name]) {
              minStandardMap[name] = minStd;
            }
            if (unit && name && !unitMapping[unit]) {
              unitMapping[unit] = name;
            }
          }
        }

        const createStandardLine = (standard: number, data: { x: Date }[]) => {
          const sorted = data.slice().sort((a, b) => a.x.getTime() - b.x.getTime());
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

        const series: any[] = [];

        for (const [name, data] of Object.entries(parameterMap)) {
          const sorted = data.slice().sort((a, b) => a.x.getTime() - b.x.getTime());
          const fillColor = parameterColor[name] || '#999999';

          const dataSource =
            timeRangeType === 'hour' ? groupByHourAvg(sorted)
            : timeRangeType === 'year'
              ? (selectedRange?.[0] === selectedRange?.[1]
                  ? groupByMonthAvg(groupByDayAvg(sorted.filter(d => d.x.getFullYear() === +selectedRange[0])))
                  : groupByYearAvg(sorted))
              : timeRangeType === 'month'
                ? groupByDayAvg(sorted)
                : groupByDayAvg(sorted);

          // ค่าแท้จริง (SplineArea)
          series.push({
            dataSource,
            xName: 'x',
            yName: 'y',
            name,
            type: 'SplineArea',
            width: 2,
            marker: { visible: true, width: 6, height: 6 },
            opacity: 0.4,
            fill: fillColor,
          });

          // เส้น Max
          if (maxStandardMap[name]) {
            const stdData = createStandardLine(maxStandardMap[name], dataSource);
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

          // เส้น Min
          if (minStandardMap[name]) {
            const stdMin = createStandardLine(minStandardMap[name], dataSource);
            series.push({
              dataSource: stdMin,
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

        if (mounted.current && !stop) {
          const filteredUnitMap = Object.fromEntries( //@ts-ignore
            Object.entries(unitMapping).filter(([unit, param]) => parameters.includes(param))
          );
          setSeriesData(series);
          setUnitMap(filteredUnitMap);
          setLoading(false);
          setNoData(series.length === 0);
        }
      } catch (err) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          if (mounted.current && !stop) {
            setLoading(false);
            setNoData(true);
          }
        } else {
          if (mounted.current && !stop) {
            timeoutId = setTimeout(fetchLoop, RETRY_INTERVAL);
          }
        }
      }
    }

    fetchLoop();
    return () => {
      stop = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hardwareID, parameters, colors, timeRangeType, selectedRange, reloadKey]);

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
          const color = parameterColor[param] || (currentMode === 'Dark' ? '#fff' : '#000');
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
        id={`area-${parameters.join('-')}`}
        height={chartHeight}
        width="100%"
        primaryXAxis={{
          valueType: 'DateTime',
          title: "วันที่บันทึก",
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
            args.text = `${args.series.name} — ${when} : ${y}`;
          }
        }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        legendSettings={{ background: 'white' }}
      >
        <Inject services={[SplineAreaSeries, DateTime, Legend, Tooltip, LineSeries]} />
        <SeriesCollectionDirective>
          {seriesData.map((item, idx) => (
            <SeriesDirective key={idx} {...item} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Area;
