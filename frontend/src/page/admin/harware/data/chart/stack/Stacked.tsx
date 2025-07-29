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
  AxisModel,
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
  timeRangeType: 'day' | 'month' | 'year';
  selectedRange: any;
  chartHeight?: string;
  reloadKey?: number;
}

function getMonthLabel(date: Date) {
  return date.toLocaleString('default', { month: 'short' });
}
function getDayLabel(date: Date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}
function groupByAvg(data: { x: string; y: number }[]) {
  const map: { [key: string]: number[] } = {};
  data.forEach(d => {
    if (!map[d.x]) map[d.x] = [];
    map[d.x].push(d.y);
  });
  return Object.entries(map).map(([x, ys]) => ({
    x,
    y: ys.reduce((a, b) => a + b, 0) / ys.length,
  }));
}

const MAX_ATTEMPTS = 10;
const RETRY_INTERVAL = 1200;

const Stacked: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors,
  timeRangeType,
  selectedRange,
  chartHeight = "420px",
  reloadKey,
}) => {
  const { currentMode } = useStateContext();
  const [stackedData, setStackedData] = useState<{ [key: string]: { x: string; y: number }[] }>({});
  const [standardLines, setStandardLines] = useState<any[]>([]);
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

  const primaryXAxis: AxisModel = {
    valueType: 'Category',
    majorGridLines: { width: 0 },
    labelIntersectAction: 'Rotate45',
    labelRotation: 0,
    interval: 1,
  };

  const primaryYAxis = {
    labelFormat: '{value}',
    lineStyle: { width: 0 },
    majorTickLines: { width: 0 },
    minorTickLines: { width: 0 },
  };

  useEffect(() => {
    let stop = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let fetchCount = 0;

    const fetchLoop = async () => {
      setLoading(true);
      setStackedData({});
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

      try {
        const raw = await fetchWithRetry(
          () => GetSensorDataByHardwareID(hardwareID),
          5,
          1000
        );
        if (!mounted.current || stop) return;
        if (!Array.isArray(raw)) throw new Error("No sensor data");

        const paramDataMap: { [param: string]: { x: string; y: number }[] } = {};
        const standardMap: { [param: string]: number } = {};
        const xCategorySet: Set<string> = new Set();
        const unitMapping: Record<string, string> = {};

        await Promise.all(
          raw.map(async (sensor) => {
            const params = await fetchWithRetry(
              () => GetSensorDataParametersBySensorDataID(sensor.ID),
              5,
              1000
            );
            if (!Array.isArray(params)) return;

            for (const param of params) {
              const name = param.HardwareParameter?.Parameter;
              const value = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
              const date = new Date(param.Date);
              const standard = param.HardwareParameter?.StandardHardware?.Standard;
              const unit = param.HardwareParameter?.UnitHardware?.Unit;

              if (!name || !parameters.includes(name)) continue;
              if (isNaN(value) || isNaN(date.getTime())) continue;

              let inRange = false;
              let label = "";
              if (timeRangeType === 'day') {
                if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
                const [start, end] = selectedRange;
                const endOfDay = new Date(end);
                endOfDay.setHours(23, 59, 59, 999);
                inRange = date >= new Date(start) && date <= endOfDay;
                if (inRange) label = getDayLabel(date);
              } else if (timeRangeType === 'month') {
                inRange = (date.getMonth() + 1 === Number(selectedRange.month)) &&
                  (date.getFullYear() === Number(selectedRange.year));
                if (inRange) label = getDayLabel(date);
              } else if (timeRangeType === 'year') {
                if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
                const [start, end] = selectedRange;
                inRange = date.getFullYear() >= +start && date.getFullYear() <= +end;
                if (inRange) label = getMonthLabel(date) + " " + date.getFullYear();
              }

              if (!inRange || !label) continue;

              if (!paramDataMap[name]) paramDataMap[name] = [];
              paramDataMap[name].push({ x: label, y: value });
              xCategorySet.add(label);

              if (standard && !standardMap[name]) {
                standardMap[name] = standard;
              }

              if (unit && !unitMapping[unit]) {
                unitMapping[unit] = name;
              }
            }
          })
        );

        const xCategoriesArr = Array.from(xCategorySet).sort((a, b) => {
          const parseDate = (str: string) => {
            const parts = str.split("/");
            if (parts.length === 2) {
              return new Date(new Date().getFullYear(), +parts[1] - 1, +parts[0]).getTime();
            }
            if (str.match(/^[A-Za-z]{3}\s\d{4}$/)) return new Date(str).getTime();
            return 0;
          };
          return parseDate(a) - parseDate(b);
        });

        for (const param of parameters) {
          if (!paramDataMap[param]) paramDataMap[param] = [];
          const averaged = groupByAvg(paramDataMap[param]);
          const existing = new Map(averaged.map(d => [d.x, d.y]));
          paramDataMap[param] = xCategoriesArr.map(cat => ({
            x: cat,
            y: existing.get(cat) ?? 0,
          }));
        }

        // ✅ Sort parameters by total value ascending (for proper stacked order)
        const paramTotalMap = Object.fromEntries(
          parameters.map(p => [
            p,
            paramDataMap[p]?.reduce((sum, d) => sum + d.y, 0) ?? 0
          ])
        );
        const sorted = [...parameters].sort(
          (a, b) => paramTotalMap[a] - paramTotalMap[b]
        );

        const standardSeries = Object.entries(standardMap).map(([param, std]) => {
          return {
            dataSource: xCategoriesArr.map(x => ({ x, y: std })),
            xName: 'x',
            yName: 'y',
            type: 'Line',
            name: `${param} (Standard)`,
            dashArray: '5,5',
            width: 2,
            marker: { visible: false },
            fill: '#888888',
          };
        });

        const hasSeries = Object.keys(paramDataMap).length > 0 && xCategoriesArr.length > 0 &&
          Object.values(paramDataMap).some(arr => arr.length > 0 && arr.some(d => d.y !== 0));
        if (hasSeries) {
          if (mounted.current && !stop) {
            setStackedData(paramDataMap);
            setCategories(xCategoriesArr);
            setStandardLines(standardSeries);
            setUnitMap(unitMapping);
            setSortedParams(sorted); // ✅ set sorted order
            setHasData(true);
            setLoading(false);
          }
        } else {
          fetchCount++;
          if (fetchCount < MAX_ATTEMPTS && mounted.current && !stop) {
            timeoutId = setTimeout(fetchLoop, RETRY_INTERVAL);
          } else {
            setStackedData({});
            setCategories([]);
            setHasData(false);
            setLoading(false);
          }
        }
      } catch (e) {
        fetchCount++;
        if (fetchCount < MAX_ATTEMPTS && mounted.current && !stop) {
          timeoutId = setTimeout(fetchLoop, RETRY_INTERVAL);
        } else {
          setStackedData({});
          setCategories([]);
          setHasData(false);
          setLoading(false);
        }
      }
    };

    fetchLoop();

    return () => {
      stop = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hardwareID, parameters, timeRangeType, selectedRange,reloadKey]);

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
      <div className="flex items-center justify-center h-80 text-lg text-gray-500">
        No Data
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm font-semibold text-gray-600 mb-2 ml-2">
        {Object.entries(unitMap).map(([unit, param]) => {
          const idx = parameters.indexOf(param);
          const color = colors?.[idx] ?? '#000';
          return (
            <span key={unit} style={{
              color,
              backgroundColor: currentMode === 'Dark' ? '#33373E' : '#f0f0f0',
              padding: '2px 8px',
              marginRight: 8,
              borderRadius: 6,
              fontWeight: 'bold'
            }}>
              {unit}
            </span>
          );
        })}
      </div>
      <ChartComponent
        id="stacked-chart"
        width="100%"
        height={chartHeight}
        primaryXAxis={primaryXAxis}
        primaryYAxis={primaryYAxis}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        legendSettings={{ background: 'white' }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
      >
        <Inject services={[StackingColumnSeries, Category, Legend, Tooltip, LineSeries]} />
        <SeriesCollectionDirective>
          {sortedParams.map((param, index) => (
            <SeriesDirective
              key={index}
              dataSource={stackedData[param]}
              xName="x"
              yName="y"
              name={param}
              type="StackingColumn"
              fill={colors && colors[parameters.indexOf(param)]}
            />
          ))}
          {standardLines.map((line, index) => (
            <SeriesDirective key={`std-${index}`} {...line} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Stacked;
