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
  timeRangeType: 'day' | 'month' | 'year';
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

const RETRY_INTERVAL = 1500;
const MAX_RETRIES = 10;

const Area: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors,
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
        const standardMap: Record<string, number> = {};
        const unitMapping: Record<string, string> = {};

        for (const sensor of raw) {
          const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
          for (const param of params!) {
            const name = param.HardwareParameter?.Parameter;
            const value = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
            const date = new Date(param.Date);
            const standard = param.HardwareParameter?.StandardHardware?.Standard;
            const unit = param.HardwareParameter?.UnitHardware?.Unit;
            if (!name || !parameters.includes(name) || isNaN(value) || isNaN(date.getTime())) continue;

            let inRange = false;
            if (timeRangeType === 'day') {
              const [start, end] = selectedRange || [];
              if (!start || !end) continue;
              const startDate = new Date(start);
              const endDate = new Date(end);
              endDate.setHours(23, 59, 59, 999); // แก้ไขตรงนี้

              inRange = date >= startDate && date <= endDate;
            } else if (timeRangeType === 'month') {
              inRange = date.getMonth() + 1 === +selectedRange?.month &&
                date.getFullYear() === +selectedRange?.year;
            } else if (timeRangeType === 'year') {
              const [start, end] = selectedRange || [];
              inRange = date.getFullYear() >= +start && date.getFullYear() <= +end;
            }

            if (!inRange) continue;
            parameterMap[name] ??= [];
            parameterMap[name].push({ x: date, y: value });

            if (standard && !standardMap[name]) standardMap[name] = standard;
            if (unit && !unitMapping[unit]) unitMapping[unit] = name;
          }
        }

        const series: any[] = [];
        const createStandardLine = (standard: number, data: { x: Date }[]) => {
          const sorted = data.sort((a, b) => a.x.getTime() - b.x.getTime());

          if (sorted.length === 1) {
            const d = sorted[0];
            const prev = new Date(d.x.getTime() - 1000 * 60 * 60); // -1 ชั่วโมง
            const next = new Date(d.x.getTime() + 1000 * 60 * 60); // +1 ชั่วโมง

            return [
              { x: prev, y: standard },
              { x: next, y: standard },
            ];
          }

          return sorted.map(d => ({ x: d.x, y: standard }));
        };

        for (const [name, data] of Object.entries(parameterMap)) {
          const sorted = data.sort((a, b) => a.x.getTime() - b.x.getTime());
          const fillColor = colors?.[parameters.indexOf(name)] || '#999999';

          const dataSource =
            timeRangeType === 'year'
              ? (selectedRange?.[0] === selectedRange?.[1]
                ? groupByMonthAvg(groupByDayAvg(sorted.filter(d => d.x.getFullYear() === +selectedRange[0])))
                : groupByYearAvg(sorted))
              : timeRangeType === 'month'
                ? groupByDayAvg(sorted)
                : groupByDayAvg(sorted);

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

          if (standardMap[name]) {
            const stdData = createStandardLine(standardMap[name], dataSource);
            series.push({
              dataSource: stdData,
              xName: 'x',
              yName: 'y',
              name: `${name} (Standard)`,
              width: 2,
              dashArray: '5,5',
              marker: { visible: false },
              type: 'Line',
              fill: 'red',
            });
          }
        }

        setSeriesData(series);
        setUnitMap(unitMapping);
        setLoading(false);
        setNoData(series.length === 0);
      } catch (err) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          setLoading(false);
          setNoData(true);
        } else {
          timeoutId = setTimeout(fetchLoop, RETRY_INTERVAL);
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
    return <div className="flex justify-center items-center h-80">Loading...</div>;
  }
  if (noData) {
    return <div className="flex items-center justify-center h-80 text-lg text-red-500 font-bold">ไม่มีข้อมูลในช่วงเวลาที่เลือก</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '40px' }}>
      <div style={{ position: 'absolute', top: '4px', zIndex: 10 }}>
        {Object.entries(unitMap).map(([unit, param]) => {
          const colorIndex = parameters.indexOf(param);
          const color = colors?.[colorIndex] || (currentMode === 'Dark' ? '#fff' : '#000');
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
          valueType: 'DateTime',
          labelFormat: timeRangeType === 'year'
            ? (selectedRange?.[0] !== selectedRange?.[1] ? 'yyyy' : 'MMM')
            : 'dd/MM',
          intervalType: timeRangeType === 'year'
            ? (selectedRange?.[0] !== selectedRange?.[1] ? 'Years' : 'Months')
            : 'Days',
          edgeLabelPlacement: 'Shift',
          majorGridLines: { width: 0 },
        }}
        primaryYAxis={{
          labelFormat: '{value}',
          rangePadding: 'None',
          lineStyle: { width: 0 },
          majorTickLines: { width: 0 },
          minorTickLines: { width: 0 },
        }}
        tooltip={{ enable: true }}
        chartArea={{ border: { width: 0 } }}
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
