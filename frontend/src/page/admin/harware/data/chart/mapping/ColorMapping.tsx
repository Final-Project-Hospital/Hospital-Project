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
} from '@syncfusion/ej2-react-charts';

import { useStateContext } from '../../../../../../contexts/ContextProvider';
import { useEffect, useState } from 'react';
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

const ColorMapping: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors,
  timeRangeType,
  selectedRange,
  chartHeight = "420px"
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<{ x: Date; y: number; param: string }[]>([]);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!hardwareID || !parameters?.length) return;
      const raw = await GetSensorDataByHardwareID(hardwareID);
      if (!Array.isArray(raw)) { setSeriesData([]); setHasData(false); return; }
      const allData: { x: Date; y: number; param: string }[] = [];
      for (const sensor of raw) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (!Array.isArray(params)) continue;
        for (const param of params) {
          const name = param.HardwareParameter?.Parameter;
          const value = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
          const date = new Date(param.Date);
          if (!name || !parameters.includes(name)) continue;
          if (isNaN(value) || isNaN(date.getTime())) continue;
          let inRange = false;
          if (timeRangeType === 'day') {
            if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
            const [start, end] = selectedRange;
            inRange = date >= new Date(start) && date <= new Date(end);
          } else if (timeRangeType === 'month') {
            inRange = (date.getMonth() + 1 === Number(selectedRange.month))
              && (date.getFullYear() === Number(selectedRange.year));
          } else if (timeRangeType === 'year') {
            if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
            const [start, end] = selectedRange;
            inRange = date.getFullYear() >= +start && date.getFullYear() <= +end;
          }
          if (!inRange) continue;
          allData.push({ x: date, y: value, param: name });
        }
      }

      let grouped: { x: Date; y: number; param: string }[];
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

      setSeriesData(grouped);
      setHasData(grouped.length > 0);
    };
    fetchData();
  }, [hardwareID, timeRangeType, selectedRange, parameters]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-80 text-lg text-gray-500">
        No Data
      </div>
    );
  }

  const paramRange: Record<string, { min: number, max: number }> = {};
  seriesData.forEach(d => {
    if (!paramRange[d.param]) paramRange[d.param] = { min: d.y, max: d.y };
    else {
      paramRange[d.param].min = Math.min(paramRange[d.param].min, d.y);
      paramRange[d.param].max = Math.max(paramRange[d.param].max, d.y);
    }
  });

  return (
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
      legendSettings={{ mode: 'Range', background: 'white' }}
      tooltip={{ enable: true }}
      background={currentMode === 'Dark' ? '#33373E' : '#fff'}
      width="100%"
      height={chartHeight}
    >
      <Inject services={[ColumnSeries, Tooltip, Category, Legend, DateTime]} />
      <SeriesCollectionDirective>
        <SeriesDirective
          dataSource={seriesData}
          xName="x"
          yName="y"
          type="Column"
          name="Sensor"
          cornerRadius={{ topLeft: 10, topRight: 10 }}
        />
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
  );
};

export default ColorMapping;
