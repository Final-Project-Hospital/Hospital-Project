import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  ColumnSeries,
  Category,
  Tooltip,
  Legend,
  DateTime,
  RangeColorSettingsDirective,
  RangeColorSettingDirective,
  LineSeries,
} from '@syncfusion/ej2-react-charts';

import { useStateContext } from '../../../../../../contexts/ContextProvider';
import { useEffect, useState, useRef } from 'react';
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
} from '../../../../../../services/hardware';

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  timeRangeType: 'day' | 'month' | 'year';
  selectedRange: any;
  chartHeight?: string;
}

function getMonthStartDate(year: number, month: number) {
  return new Date(year, month, 1);
}
function getYearStartDate(year: number) {
  return new Date(year, 0, 1);
}

function groupByMonthAvg(data: { x: Date, y: number, param: string }[]) {
  const groups: { [key: string]: { param: string, y: number[] }[] } = {};
  data.forEach(d => {
    const key = `${d.param}_${d.x.getFullYear()}-${d.x.getMonth() + 1}`;
    if (!groups[key]) groups[key] = [];
    if (!groups[key][0]) groups[key][0] = { param: d.param, y: [] };
    groups[key][0].y.push(d.y);
  });
  return Object.entries(groups).map(([key, arr]) => {
    const [param, ym] = key.split('_');
    const [year, month] = ym.split('-').map(Number);
    const values = arr[0].y;
    return {
      x: getMonthStartDate(year, month - 1),
      y: values.reduce((sum, val) => sum + val, 0) / values.length,
      param,
    };
  }).sort((a, b) => a.x.getTime() - b.x.getTime());
}

function groupByYearAvg(data: { x: Date, y: number, param: string }[]) {
  const groups: { [key: string]: { param: string, y: number[] }[] } = {};
  data.forEach(d => {
    const key = `${d.param}_${d.x.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    if (!groups[key][0]) groups[key][0] = { param: d.param, y: [] };
    groups[key][0].y.push(d.y);
  });
  return Object.entries(groups).map(([key, arr]) => {
    const [param, year] = key.split('_');
    const values = arr[0].y;
    return {
      x: getYearStartDate(Number(year)),
      y: values.reduce((sum, val) => sum + val, 0) / values.length,
      param,
    };
  }).sort((a, b) => a.x.getTime() - b.x.getTime());
}

function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

const ColorMapping: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors,
  timeRangeType,
  selectedRange,
  chartHeight = "420px"
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [paramRange, setParamRange] = useState<Record<string, { min: number, max: number }>>({});
  const [standardLines, setStandardLines] = useState<any[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let stop = false;

    const fetchData = async () => {
      setLoading(true);
      setHasData(true);
      setSeriesData([]);
      setParamRange({});
      setStandardLines([]);
      setUnitMap({});

      if (!hardwareID || !parameters?.length) {
        setLoading(false);
        setHasData(false);
        return;
      }

      const raw = await GetSensorDataByHardwareID(hardwareID);
      if (!mounted.current || stop || !Array.isArray(raw) || raw.length === 0) {
        setLoading(false);
        setHasData(false);
        return;
      }

      const allData: { x: Date; y: number; param: string }[] = [];
      const standards: Record<string, number> = {};
      const unitMapping: Record<string, string> = {};

      for (const sensor of raw) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (!Array.isArray(params)) continue;

        for (const param of params) {
          const name = param.HardwareParameter?.Parameter;
          const value = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
          const date = new Date(param.Date);
          const standard = param.HardwareParameter?.StandardHardware?.Standard;
          const unit = param.HardwareParameter?.UnitHardware?.Unit;

          if (!name || !parameters.includes(name)) continue;
          if (isNaN(value) || isNaN(date.getTime())) continue;

          let inRange = false;
          if (timeRangeType === 'day') {
            if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
            const [start, end] = selectedRange;
            inRange = date >= new Date(start) && date <= new Date(end);
          } else if (timeRangeType === 'month') {
            if (!selectedRange?.month || !selectedRange?.year) continue;
            inRange = (date.getMonth() + 1 === Number(selectedRange.month))
              && (date.getFullYear() === Number(selectedRange.year));
          } else if (timeRangeType === 'year') {
            if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
            const [start, end] = selectedRange;
            inRange = date.getFullYear() >= +start && date.getFullYear() <= +end;
          }

          if (!inRange) continue;

          allData.push({ x: date, y: value, param: name });
          if (standard && !standards[name]) standards[name] = standard;
          if (unit && !unitMapping[unit]) unitMapping[unit] = name;
        }
      }

      let grouped: { x: Date; y: number; param: string }[] = [];
      if (timeRangeType === 'year') {
        const [start, end] = selectedRange;
        if (+start === +end) {
          grouped = groupByMonthAvg(allData.filter(d => d.x.getFullYear() === +start));
        } else {
          grouped = groupByYearAvg(allData.filter(d => d.x.getFullYear() >= +start && d.x.getFullYear() <= +end));
        }
      } else {
        grouped = allData.sort((a, b) => a.x.getTime() - b.x.getTime());
      }

      if (grouped.length === 0) {
        setLoading(false);
        setHasData(false);
        return;
      }

      const rangeMap: Record<string, { min: number, max: number }> = {};
      grouped.forEach(d => {
        if (!rangeMap[d.param]) rangeMap[d.param] = { min: d.y, max: d.y };
        else {
          rangeMap[d.param].min = Math.min(rangeMap[d.param].min, d.y);
          rangeMap[d.param].max = Math.max(rangeMap[d.param].max, d.y);
        }
      });

      let standardSeries: any[] = [];
      if (timeRangeType === 'day') {
        const [start, end] = selectedRange;
        const dateList = getDateRange(new Date(start), new Date(end));
        standardSeries = Object.entries(standards).map(([param, value]) => {
          const data = dateList.map(d => ({ x: d, y: value }));
          return {
            dataSource: data,
            xName: 'x',
            yName: 'y',
            type: 'Line',
            name: `${param} (Standard)`,
            width: 2,
            dashArray: '5,5',
            marker: { visible: false },
            fill: '#999999',
          };
        });
      } else {
        const xListByParam: Record<string, Date[]> = {};
        grouped.forEach(d => {
          if (!xListByParam[d.param]) xListByParam[d.param] = [];
          xListByParam[d.param].push(d.x);
        });

        standardSeries = Object.entries(standards).map(([param, value]) => {
          const xList = xListByParam[param] || [];
          const data = xList.map(x => ({ x, y: value }));
          return {
            dataSource: data,
            xName: 'x',
            yName: 'y',
            type: 'Line',
            name: `${param} (Standard)`,
            width: 2,
            dashArray: '5,5',
            marker: { visible: false },
            fill: '#999999',
          };
        });
      }

      setSeriesData(grouped);
      setParamRange(rangeMap);
      setStandardLines(standardSeries);
      setUnitMap(unitMapping);
      setLoading(false);
      setHasData(true);
    };

    fetchData();
    return () => { stop = true; };
  }, [hardwareID, timeRangeType, selectedRange, parameters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80 text-lg text-gray-500">
        Loading...
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex justify-center items-center h-80 text-lg text-gray-500">
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
              padding: '2px 8px',
              backgroundColor: currentMode === 'Dark' ? '#33373E' : '#f0f0f0',
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
        id="color-mapping-chart"
        primaryXAxis={{
          valueType: 'DateTime',
          labelFormat: (timeRangeType === 'year' ? 'MMM' : 'dd/MM'),
          intervalType: (timeRangeType === 'year' ? 'Months' : 'Days'),
          majorGridLines: { width: 0 },
          edgeLabelPlacement: 'Shift',
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
        <Inject services={[ColumnSeries, Tooltip, Category, Legend, DateTime, LineSeries]} />
        <SeriesCollectionDirective>
          <SeriesDirective
            dataSource={seriesData}
            xName="x"
            yName="y"
            type="Column"
            name="Sensor"
            cornerRadius={{ topLeft: 10, topRight: 10 }}
          />
          {standardLines.map((line, i) => (
            <SeriesDirective key={i} {...line} />
          ))}
        </SeriesCollectionDirective>
        <RangeColorSettingsDirective>
          {parameters.map((param, idx) => (
            <RangeColorSettingDirective
              key={param}
              start={paramRange[param]?.min ?? 0}
              end={paramRange[param]?.max ?? 99999}
              colors={[colors && colors[idx] ? colors[idx] : '#40BFB4']}
              label={param}
            />
          ))}
        </RangeColorSettingsDirective>
      </ChartComponent>
    </div>
  );
};

export default ColorMapping;
