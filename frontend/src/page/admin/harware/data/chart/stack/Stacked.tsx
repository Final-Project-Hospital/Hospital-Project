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
}

function getMonthLabel(date: Date) {
  return date.toLocaleString('default', { month: 'short' });
}
function getDayLabel(date: Date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
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
}) => {
  const { currentMode } = useStateContext();
  const [stackedData, setStackedData] = useState<{ [key: string]: { x: string; y: number }[] }>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [hasData, setHasData] = useState(true);
  const [loading, setLoading] = useState(false);

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

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
      setCategories([]);
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
        const xCategorySet: Set<string> = new Set();

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

              if (!name || !parameters.includes(name)) continue;
              if (isNaN(value) || isNaN(date.getTime())) continue;

              let inRange = false;
              let label = "";
              if (timeRangeType === 'day') {
                if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
                const [start, end] = selectedRange;
                inRange = date >= new Date(start) && date <= new Date(end);
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
            }
          })
        );

        const xCategoriesArr = Array.from(xCategorySet).sort((a, b) => {
          // parse label to date for sort
          const parseDate = (str: string) => {
            const parts = str.split("/");
            if (parts.length === 2) {
              // "15/07"
              return new Date(new Date().getFullYear(), +parts[1] - 1, +parts[0]).getTime();
            }
            if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
            if (str.match(/^[A-Za-z]{3}\s\d{4}$/)) return new Date(str).getTime();
            return 0;
          };
          return parseDate(a) - parseDate(b);
        });

        for (const param of parameters) {
          if (!paramDataMap[param]) paramDataMap[param] = [];
          const existing = new Map(paramDataMap[param].map(d => [d.x, d.y]));
          paramDataMap[param] = xCategoriesArr.map(cat => ({
            x: cat,
            y: existing.get(cat) ?? 0,
          }));
        }

        const hasSeries = Object.keys(paramDataMap).length > 0 && xCategoriesArr.length > 0 &&
          Object.values(paramDataMap).some(arr => arr.length > 0 && arr.some(d => d.y !== 0));
        if (hasSeries) {
          if (mounted.current && !stop) {
            setStackedData(paramDataMap);
            setCategories(xCategoriesArr);
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
  }, [hardwareID, parameters, timeRangeType, selectedRange]);

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
      <Inject services={[StackingColumnSeries, Category, Legend, Tooltip]} />
      <SeriesCollectionDirective>
        {parameters.map((param, index) => (
          <SeriesDirective
            key={index}
            dataSource={stackedData[param]}
            xName="x"
            yName="y"
            name={param}
            type="StackingColumn"
            fill={colors && colors[index] ? colors[index] : undefined}
          />
        ))}
      </SeriesCollectionDirective>
    </ChartComponent>
  );
};

export default Stacked;
