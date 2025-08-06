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

const Stacked: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors,
  timeRangeType,
  selectedRange,
  chartHeight = '420px',
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
    interval: 1,
  };

  const primaryYAxis = {
    labelFormat: '{value}',
    lineStyle: { width: 0 },
    majorTickLines: { width: 0 },
    minorTickLines: { width: 0 },
  };

  useEffect(() => {
    const fetchData = async () => {
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

      let forcedXLabels: string[] = [];

      if (
        timeRangeType === 'day' &&
        selectedRange?.length === 2 &&
        new Date(selectedRange[0]).toDateString() === new Date(selectedRange[1]).toDateString()
      ) {
        const baseDate = new Date(selectedRange[0]);
        const oneDayBefore = new Date(baseDate.getTime() - 86400000);
        const oneDayAfter = new Date(baseDate.getTime() + 86400000);
        forcedXLabels = [
          getDayLabel(oneDayBefore),
          getDayLabel(baseDate),
          getDayLabel(oneDayAfter),
        ];
      }

      try {
        const raw = await fetchWithRetry(
          () => GetSensorDataByHardwareID(hardwareID),
          5,
          1000
        );

        const paramDataMap: { [param: string]: { x: string; y: number }[] } = {};
        const standardMap: { [param: string]: number } = {};
        const xCategorySet: Set<string> = new Set();
        const unitMapping: Record<string, string> = {};

        // Add forced labels to xCategorySet
        forcedXLabels.forEach(x => xCategorySet.add(x));

        if (!raw || !Array.isArray(raw)) {
          setHasData(false);
          setLoading(false);
          return;
        }

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
              let label = '';
              if (timeRangeType === 'day') {
                const [start, end] = selectedRange;
                const startDate = new Date(start);
                const endDate = new Date(end);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                inRange = date >= startDate && date <= endDate;
                if (inRange) label = getDayLabel(date);
              } else if (timeRangeType === 'month') {
                inRange = date.getMonth() + 1 === Number(selectedRange?.month) &&
                  date.getFullYear() === Number(selectedRange?.year);
                if (inRange) label = getDayLabel(date);
              } else if (timeRangeType === 'year') {
                const [start, end] = selectedRange;
                const startYear = parseInt(start);
                const endYear = parseInt(end);
                const yearLabel = startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`;
                inRange = date.getFullYear() >= startYear && date.getFullYear() <= endYear;

                if (inRange) label = yearLabel;
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
          const getSortKey = (val: string) => {
            if (val.includes('-')) {
              return parseInt(val.split('-')[0]);
            } else if (/^\d+$/.test(val)) {
              return parseInt(val);
            } else {
              const [d, m] = val.split('/');
              return new Date(new Date().getFullYear(), +m - 1, +d).getTime();
            }
          };
          return getSortKey(a) - getSortKey(b);
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
            fill: 'red',
          };
        });

        const hasSeries = Object.keys(paramDataMap).length > 0 && xCategoriesArr.length > 0 &&
          Object.values(paramDataMap).some(arr => arr.length > 0 && arr.some(d => d.y !== 0));

        if (hasSeries && mounted.current) {
          setStackedData(paramDataMap);
          setCategories(xCategoriesArr);
          setStandardLines(standardSeries);
          setUnitMap(unitMapping);
          setSortedParams(sorted);
          setHasData(true);
        } else {
          setStackedData({});
          setCategories([]);
          setHasData(false);
        }
        setLoading(false);
      } catch (e) {
        setHasData(false);
        setLoading(false);
      }
    };

    fetchData();
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
      <div className="flex justify-center items-center h-80 text-red-500 font-bold">ไม่มีข้อมูลในช่วงเวลาที่เลือก</div>
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
        id={`chart-${parameters.join('-')}`}
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
