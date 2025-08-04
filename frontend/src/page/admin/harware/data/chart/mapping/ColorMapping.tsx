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
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
} from '../../../../../../services/hardware';

interface ColorMappingBarChartProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  timeRangeType: 'day' | 'month' | 'year';
  selectedRange: any;
  chartHeight?: string;
  reloadKey?: number;
}

const ColorMappingBarChart: React.FC<ColorMappingBarChartProps> = ({
  hardwareID,
  parameters,
  colors = [],
  timeRangeType,
  selectedRange,
  chartHeight = '420px',
  reloadKey,
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const mounted = useRef(true);

  const parameterInfo = parameters.reduce((acc, param, idx) => {
    acc[param] = colors[idx] || '#999999';
    return acc;
  }, {} as Record<string, string>);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, [reloadKey]);

  const isRangeReady = useMemo(() => {
    if (!selectedRange) return false;
    if (timeRangeType === 'day') return Array.isArray(selectedRange) && selectedRange.length === 2;
    if (timeRangeType === 'month') return selectedRange?.month && selectedRange?.year;
    if (timeRangeType === 'year') return Array.isArray(selectedRange) && selectedRange.length === 2;
    return false;
  }, [selectedRange, timeRangeType]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setNoData(false);
      setSeriesData([]);
      setUnitMap({});

      if (!hardwareID || parameters.length === 0) {
        setLoading(false);
        return;
      }
      //@ts-ignore
      let forcedXLabels: string[] = [];

      if (timeRangeType === 'day' && selectedRange?.length === 2) {
        const [start, end] = selectedRange;
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate.toDateString() === endDate.toDateString()) {
          const oneDayBefore = new Date(startDate.getTime() - 86400000);
          const oneDayAfter = new Date(startDate.getTime() + 86400000);
          forcedXLabels = [
            oneDayBefore.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
            startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
            oneDayAfter.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
          ];
        }
      }

      const raw = await GetSensorDataByHardwareID(hardwareID);
      if (!mounted.current || !Array.isArray(raw) || raw.length === 0) {
        setLoading(false);
        setNoData(true);
        return;
      }

      const dataMap: Record<string, { x: string; y: number }[]> = {};
      const standardMap: Record<string, number> = {};
      const unitMapping: Record<string, string> = {};

      for (const sensor of raw) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (!Array.isArray(params)) continue;

        for (const param of params) {
          const name = param.HardwareParameter?.Parameter;
          const value = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
          const standard = param.HardwareParameter?.StandardHardware?.Standard;
          const unit = param.HardwareParameter?.UnitHardware?.Unit;
          const date = new Date(param.Date);
          if (!name || !parameters.includes(name) || isNaN(value) || isNaN(date.getTime())) continue;

          let inRange = false;
          let label = '';

          if (timeRangeType === 'day') {
            const [start, end] = selectedRange || [];
            if (!start || !end) continue;
            const startDate = new Date(start);
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999);
            inRange = date >= startDate && date <= endDate;
            if (inRange) label = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          } else if (timeRangeType === 'month') {
            inRange = date.getMonth() + 1 === Number(selectedRange?.month) &&
              date.getFullYear() === Number(selectedRange?.year);
            if (inRange) label = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          } else if (timeRangeType === 'year') {
            const [start, end] = selectedRange || [];
            inRange = date.getFullYear() >= +start && date.getFullYear() <= +end;
            if (inRange) label = date.getFullYear().toString();
          }

          if (!inRange || !label) continue;

          dataMap[name] ??= [];
          dataMap[name].push({ x: label, y: value });

          if (standard && !standardMap[name]) {
            standardMap[name] = standard;
          }

          if (unit && !unitMapping[unit]) {
            unitMapping[unit] = name;
          }
        }
      }

      if (Object.keys(dataMap).length === 0) {
        setNoData(true);
        setLoading(false);
        return;
      }

      const series: any[] = [];

      for (const [name, values] of Object.entries(dataMap)) {
        const grouped: Record<string, number[]> = {};
        values.forEach(({ x, y }) => {
          grouped[x] ??= [];
          grouped[x].push(y);
        });

        const allX = Object.keys(grouped).sort((a, b) => {
          const da = new Date(a).getTime();
          const db = new Date(b).getTime();
          return da - db;
        });

        const averaged = allX.map(x => ({
          x,
          y: grouped[x] ? grouped[x].reduce((sum, val) => sum + val, 0) / grouped[x].length : null,
        }));

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

        if (standardMap[name]) {
          const stdData = allX.map(x => ({ x, y: standardMap[name] }));
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
    };

    if (!isRangeReady) return;
    fetchData();
  }, [hardwareID, timeRangeType, selectedRange, parameters, colors, reloadKey]);

  if (loading)
    return <div className="flex justify-center items-center h-80 text-gray-500 text-lg">Loading...</div>;
  if (noData)
    return <div className="flex justify-center items-center h-80 text-red-500 font-bold">ไม่มีข้อมูลในช่วงเวลาที่เลือก</div>;

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '40px' }}>
      <div style={{ position: 'absolute', top: '4px', zIndex: 10 }}>
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
          labelIntersectAction: 'Rotate45',
          interval: 1,
        }}
        primaryYAxis={{
          labelFormat: '{value}',
          lineStyle: { width: 0 },
          majorTickLines: { width: 0 },
          minorTickLines: { width: 0 },
        }}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
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

export default ColorMappingBarChart;
