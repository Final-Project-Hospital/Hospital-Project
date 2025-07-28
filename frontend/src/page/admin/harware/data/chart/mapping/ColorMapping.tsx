import React, { useEffect, useState, useRef } from 'react';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  ColumnSeries,
  Legend,
  Tooltip,
  LineSeries,
  Category,
  RangeColorSettingsDirective,
  RangeColorSettingDirective,
} from '@syncfusion/ej2-react-charts';
import { useStateContext } from '../../../../../../contexts/ContextProvider';
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
  ListHardwareParameterIDsByHardwareID,
} from '../../../../../../services/hardware';

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  timeRangeType: 'day' | 'month' | 'year';
  selectedRange: any;
  chartHeight?: string;
}

function getDayLabel(date: Date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}
function getMonthLabel(date: Date) {
  return date.toLocaleString('default', { month: 'short' });
}

function groupByDay(data: { x: Date; y: number; param: string }[]) {
  const map: { [key: string]: number[] } = {};
  const labelMap: { [key: string]: string } = {};

  data.forEach(d => {
    const label = getDayLabel(d.x);
    const key = `${d.param}_${label}`;
    map[key] ??= [];
    map[key].push(d.y);
    labelMap[key] = label;
  });

  return Object.entries(map).map(([key, values]) => {
    const [param] = key.split('_');
    return {
      param,
      x: labelMap[key],
      y: values.reduce((sum, val) => sum + val, 0) / values.length,
    };
  });
}

function groupByMonth(data: { x: Date; y: number; param: string }[]) {
  const map: { [key: string]: number[] } = {};
  const labelMap: { [key: string]: string } = {};

  data.forEach(d => {
    const label = getMonthLabel(d.x);
    const key = `${d.param}_${label}`;
    map[key] ??= [];
    map[key].push(d.y);
    labelMap[key] = label;
  });

  return Object.entries(map).map(([key, values]) => {
    const [param] = key.split('_');
    return {
      param,
      x: labelMap[key],
      y: values.reduce((sum, val) => sum + val, 0) / values.length,
    };
  });
}

const ColorMappingBarChart: React.FC<ChartdataProps> = ({
  hardwareID,
  timeRangeType,
  selectedRange,
  colors = [],
  chartHeight = '420px',
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [standardLines, setStandardLines] = useState<any[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});
  const [parameterInfo, setParameterInfo] = useState<Record<string, string>>({});
  const [barParameters, setBarParameters] = useState<string[]>([]);
  const [paramRange, setParamRange] = useState<Record<string, { min: number; max: number }>>({});
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchBarParameters = async () => {
      const result = await ListHardwareParameterIDsByHardwareID(hardwareID);
      if (!result || !result.parameters) return;
      const filtered = (result.parameters as any[]).filter((p) => p.graph_id === 3);
      const names = filtered.map((p: any) => p.parameter);
      const info: Record<string, string> = {};
      filtered.forEach(p => {
        info[p.parameter] = p.color || '#999999';
      });
      setBarParameters(names);
      setParameterInfo(info);
    };

    if (hardwareID) fetchBarParameters();
  }, [hardwareID]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setNoData(false);
      setSeriesData([]);
      setStandardLines([]);
      setUnitMap({});
      setParamRange({});

      if (!hardwareID || !barParameters.length) {
        setLoading(false);
        return;
      }

      const raw = await GetSensorDataByHardwareID(hardwareID);
      if (!mounted.current || !Array.isArray(raw) || raw.length === 0) {
        setLoading(false);
        setNoData(true);
        return;
      }

      const allData: { x: Date; y: number; param: string }[] = [];
      const standardMap: Record<string, number> = {};
      const unitMapping: Record<string, string> = {};
      const rangeMap: Record<string, number[]> = {};

      for (const sensor of raw) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (!Array.isArray(params)) continue;

        for (const param of params) {
          const name = param.HardwareParameter?.Parameter;
          const value = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
          const standard = param.HardwareParameter?.StandardHardware?.Standard;
          const unit = param.HardwareParameter?.UnitHardware?.Unit;
          const date = new Date(param.Date);

          if (!name || !barParameters.includes(name) || isNaN(value) || isNaN(date.getTime())) continue;

          let include = false;
          if (timeRangeType === 'day') {
            const [start, end] = selectedRange || [];
            include = date >= new Date(start) && date <= new Date(end);
          } else if (timeRangeType === 'month') {
            include =
              date.getMonth() + 1 === Number(selectedRange?.month) &&
              date.getFullYear() === Number(selectedRange?.year);
          } else if (timeRangeType === 'year') {
            const [start, end] = selectedRange || [];
            include = date.getFullYear() >= +start && date.getFullYear() <= +end;
          }

          if (!include) continue;

          allData.push({ x: date, y: value, param: name });
          if (standard && !standardMap[name]) standardMap[name] = standard;
          if (unit && name && !unitMapping[unit]) unitMapping[unit] = name;

          rangeMap[name] ??= [];
          rangeMap[name].push(value);
        }
      }

      let grouped: { x: string; y: number; param: string }[] = [];
      if (timeRangeType === 'month') {
        grouped = groupByDay(allData);
      } else if (timeRangeType === 'year') {
        grouped = groupByMonth(allData);
      } else {
        grouped = groupByDay(allData);
      }

      if (grouped.length === 0) {
        setLoading(false);
        setNoData(true);
        return;
      }

      const groupedByParam: Record<string, { x: string; y: number }[]> = {};
      grouped.forEach(d => {
        groupedByParam[d.param] ??= [];
        groupedByParam[d.param].push({ x: d.x, y: d.y });
      });

      const series: any[] = [];
      const standards: any[] = [];
      const rangeResult: Record<string, { min: number; max: number }> = {};

      Object.entries(groupedByParam).forEach(([param, data]) => {
        const color = parameterInfo[param] || '#999999';
        series.push({
          dataSource: data,
          xName: 'x',
          yName: 'y',
          name: param,
          type: 'Column',
          fill: color,
          columnSpacing: 0.1,
          width: 0.5,
          cornerRadius: { topLeft: 5, topRight: 5 },
        });

        const values = rangeMap[param];
        if (values?.length) {
          rangeResult[param] = {
            min: Math.min(...values),
            max: Math.max(...values),
          };
        }

        if (standardMap[param]) {
          const std = data.map(d => ({ x: d.x, y: standardMap[param] }));
          standards.push({
            dataSource: std,
            xName: 'x',
            yName: 'y',
            name: `${param} (Standard)`,
            type: 'Line',
            dashArray: '5,5',
            width: 2,
            fill: '#888',
            marker: { visible: false },
          });
        }
      });

      setSeriesData(series);
      setStandardLines(standards);
      setUnitMap(unitMapping);
      setParamRange(rangeResult);
      setLoading(false);
    };

    fetchData();
  }, [hardwareID, timeRangeType, selectedRange, barParameters]);

  if (loading) return <div className="flex justify-center items-center h-80 text-gray-500 text-lg">Loading...</div>;
  if (noData) return <div className="flex justify-center items-center h-80 text-gray-500 text-lg">No Data</div>;

  return (
    <div>
      <div className="text-sm font-semibold text-gray-600 mb-2 ml-2">
        {Object.entries(unitMap).map(([unit, param]) => {
          const idx = barParameters.indexOf(param);
          const color = colors?.[idx] ?? '#000';
          return (
            <span key={unit} style={{
              color,
              padding: '2px 8px',
              backgroundColor: currentMode === 'Dark' ? '#33373E' : '#f0f0f0',
              marginRight: 8,
              borderRadius: 6,
              fontWeight: 'bold'
            }}>{unit}</span>
          );
        })}
      </div>
      <ChartComponent
        id="color-mapping-chart"
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
        legendSettings={{ background: 'white' }}
        tooltip={{ enable: true }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        width="100%"
        height={chartHeight}
      >
        <Inject services={[ColumnSeries, Tooltip, Category, Legend, LineSeries]} />
        <SeriesCollectionDirective>
          {seriesData.map((series, idx) => (
            <SeriesDirective key={idx} {...series} />
          ))}
          {standardLines.map((line, i) => (
            <SeriesDirective key={`std-${i}`} {...line} />
          ))}
        </SeriesCollectionDirective>
        <RangeColorSettingsDirective>
          {barParameters.map((param: string, idx: number) => (
            <RangeColorSettingDirective
              key={param}
              start={paramRange[param]?.min ?? 0}
              end={paramRange[param]?.max ?? 100}
              colors={[colors?.[idx] ?? '#40BFB4']}
              label={param}
            />
          ))}
        </RangeColorSettingsDirective>
      </ChartComponent>
    </div>
  );
};

export default ColorMappingBarChart;
