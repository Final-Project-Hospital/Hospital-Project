import {
  ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, LineSeries, DateTime, Legend, Tooltip,
} from '@syncfusion/ej2-react-charts';
import { useEffect, useState } from 'react';
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID
} from '../../../../../../services/hardware';
import { useStateContext } from '../../../../../../contexts/ContextProvider';

interface LineChartProps {
  hardwareID: number;
  timeRangeType: 'day' | 'month' | 'year';
  colors?: string[];
  selectedRange: any;
  parameters: string[];
  chartHeight?: string; // <--- เพิ่มตรงนี้
}

// Group functions
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

const LineChart: React.FC<LineChartProps> = ({
  hardwareID,
  timeRangeType,
  selectedRange,
  parameters,
  colors,
  chartHeight = "420px", // <--- default
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [hasData, setHasData] = useState<boolean>(true);

  const getXAxis = () => {
    if (timeRangeType === 'year' && selectedRange?.[0] !== selectedRange?.[1]) {
      return {
        valueType: 'DateTime' as const,
        labelFormat: 'yyyy' as const,
        intervalType: 'Years' as const,
        edgeLabelPlacement: 'Shift' as const,
        majorGridLines: { width: 0 },
        background: 'white',
      };
    } else if (timeRangeType === 'year') {
      return {
        valueType: 'DateTime' as const,
        labelFormat: 'MMM' as const,
        intervalType: 'Months' as const,
        edgeLabelPlacement: 'Shift' as const,
        majorGridLines: { width: 0 },
        background: 'white',
      };
    } else if (timeRangeType === 'day') {
      return {
        valueType: 'DateTime' as const,
        labelFormat: 'dd/MM' as const,
        intervalType: 'Days' as const,
        edgeLabelPlacement: 'Shift' as const,
        majorGridLines: { width: 0 },
        background: 'white',
      };
    }
    // month
    return {
      valueType: 'DateTime' as const,
      labelFormat: 'dd/MM' as const,
      intervalType: 'Days' as const,
      edgeLabelPlacement: 'Shift' as const,
      majorGridLines: { width: 0 },
      background: 'white',
    };
  };

  const LinePrimaryYAxis = {
    labelFormat: '{value}',
    rangePadding: 'None' as const,
    lineStyle: { width: 0 },
    majorTickLines: { width: 0 },
    minorTickLines: { width: 0 },
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!hardwareID || !parameters?.length) return;

      const raw = await GetSensorDataByHardwareID(hardwareID);
      if (!Array.isArray(raw)) { setSeriesData([]); setHasData(false); return; }

      const parameterMap: Record<string, { x: Date; y: number }[]> = {};

      for (const sensor of raw) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (!Array.isArray(params)) continue;

        for (const param of params) {
          const name = param.HardwareParameter?.Parameter;
          const value = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
          const date = new Date(param.Date);

          const include = name && parameters.includes(name) && !isNaN(value) && !isNaN(date.getTime());
          if (!include) continue;

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

          parameterMap[name] ??= [];
          parameterMap[name].push({ x: date, y: value });
        }
      }

      let series;
      if (timeRangeType === 'year') {
        const [start, end] = selectedRange;
        if (+start === +end) {
          series = Object.entries(parameterMap).map(([name, data]) => ({
            dataSource: groupByMonthAvg(data.filter(d => d.x.getFullYear() === +start)),
            xName: 'x',
            yName: 'y',
            name,
            width: 2,
            marker: { visible: true, width: 8, height: 8 },
            type: 'Line' as const,
          }));
        } else {
          series = Object.entries(parameterMap).map(([name, data]) => ({
            dataSource: groupByYearAvg(data.filter(d => d.x.getFullYear() >= +start && d.x.getFullYear() <= +end)),
            xName: 'x',
            yName: 'y',
            name,
            width: 2,
            marker: { visible: true, width: 8, height: 8 },
            type: 'Line' as const,
          }));
        }
      } else {
        series = Object.entries(parameterMap).map(([name, data]) => ({
          dataSource: data.sort((a, b) => a.x.getTime() - b.x.getTime()),
          xName: 'x',
          yName: 'y',
          name,
          width: 2,
          marker: { visible: true, width: 8, height: 8 },
          type: 'Line' as const,
        }));
      }

      setSeriesData(series);
      setHasData(series.length > 0 && series.some(s => (s.dataSource?.length || 0) > 0));
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

  return (
    <ChartComponent
      id="line-chart"
      height={chartHeight}
      width="100%"
      primaryXAxis={getXAxis()}
      primaryYAxis={LinePrimaryYAxis}
      chartArea={{ border: { width: 0 } }}
      tooltip={{ enable: true }}
      background={currentMode === 'Dark' ? '#33373E' : '#fff'}
      legendSettings={{ background: 'white' }}
    >
      <Inject services={[LineSeries, DateTime, Legend, Tooltip]} />
      <SeriesCollectionDirective>
        {seriesData.map((item, idx) => (
          <SeriesDirective
            key={idx}
            {...item}
            fill={Array.isArray(colors) && colors[idx] ? colors[idx] : undefined}
          />
        ))}
      </SeriesCollectionDirective>
    </ChartComponent>
  );
};

export default LineChart;
