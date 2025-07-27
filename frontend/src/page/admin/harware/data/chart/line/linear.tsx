import { useEffect, useState, useRef } from 'react';
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
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID
} from '../../../../../../services/hardware';

interface LineChartProps {
  hardwareID: number;
  timeRangeType: 'day' | 'month' | 'year';
  colors?: string[];
  selectedRange: any;
  parameters: string[];
  chartHeight?: string;
}

function getMonthStartDate(year: number, month: number) {
  return new Date(year, month, 1);
}
function getYearStartDate(year: number) {
  return new Date(year, 0, 1);
}
function groupByMonthAvg(data: { x: Date, y: number }[]) {
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
function groupByYearAvg(data: { x: Date, y: number }[]) {
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

const LineChart: React.FC<LineChartProps> = ({
  hardwareID,
  timeRangeType,
  selectedRange,
  parameters,
  colors,
  chartHeight = "420px",
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [noData, setNoData] = useState<boolean>(false);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({}); // unit -> parameter

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

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
        setLoading(true);
        return;
      }

      try {
        const raw = await GetSensorDataByHardwareID(hardwareID);
        if (!mounted.current || stop) return;
        if (!Array.isArray(raw) || raw.length === 0) throw new Error("No sensor");

        const parameterMap: Record<string, { x: Date; y: number }[]> = {};
        const standardMap: Record<string, number> = {};
        const unitMapping: Record<string, string> = {};
        let foundData = false;

        for (const sensor of raw) {
          const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
          if (!Array.isArray(params)) continue;

          for (const param of params) {
            const name = param.HardwareParameter?.Parameter;
            const value = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
            const standard = param.HardwareParameter?.StandardHardware?.Standard;
            const unit = param.HardwareParameter?.UnitHardware?.Unit;
            const date = new Date(param.Date);
            const include = name && parameters.includes(name) && !isNaN(value) && !isNaN(date.getTime());
            if (!include) continue;

            let inRange = false;
            if (timeRangeType === 'day') {
              if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
              const [start, end] = selectedRange;
              inRange = date >= new Date(start) && date <= new Date(end);
            } else if (timeRangeType === 'month') {
              inRange = (date.getMonth() + 1 === Number(selectedRange.month)) && (date.getFullYear() === Number(selectedRange.year));
            } else if (timeRangeType === 'year') {
              if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
              const [start, end] = selectedRange;
              inRange = date.getFullYear() >= +start && date.getFullYear() <= +end;
            }
            if (!inRange) continue;

            foundData = true;
            parameterMap[name] ??= [];
            parameterMap[name].push({ x: date, y: value });

            if (standard && !standardMap[name]) {
              standardMap[name] = standard;
            }

            if (unit && name && !unitMapping[unit]) {
              unitMapping[unit] = name; // map unit -> parameter
            }
          }
        }

        let series: any[] = [];//@ts-ignore
        const createStandardLine = (name: string, standard: number, data: { x: Date }[]) => {
          const sorted = [...data].sort((a, b) => a.x.getTime() - b.x.getTime());
          return sorted.map(d => ({ x: d.x, y: standard }));
        };

        if (foundData) {
          for (const [name, data] of Object.entries(parameterMap)) {
            const sortedData = data.sort((a, b) => a.x.getTime() - b.x.getTime());
            const fillColor = colors && colors[parameters.indexOf(name)] ? colors[parameters.indexOf(name)] : undefined;
            const dataSource =
              timeRangeType === 'year'
                ? (selectedRange[0] === selectedRange[1]
                    ? groupByMonthAvg(sortedData.filter(d => d.x.getFullYear() === +selectedRange[0]))
                    : groupByYearAvg(sortedData))
                : sortedData;

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

            if (standardMap[name]) {
              const stdData = createStandardLine(name, standardMap[name], sortedData);
              series.push({
                dataSource: stdData,
                xName: 'x',
                yName: 'y',
                name: `${name} (Standard)`,
                width: 2,
                dashArray: '5,5',
                marker: { visible: false },
                type: 'Line',
                fill: '#888',
              });
            }
          }

          if (mounted.current && !stop) {
            setSeriesData(series);
            setUnitMap(unitMapping);
            setLoading(false);
            setNoData(false);
          }
        } else {
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
  }, [hardwareID, timeRangeType, selectedRange, parameters]);

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
      <div className="flex items-center justify-center h-80 text-lg text-gray-500">
        No Data
      </div>
    );
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
        id="line-chart"
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
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
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
