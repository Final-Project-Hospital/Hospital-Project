// LineChart.tsx
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
import { useEffect, useState } from 'react';
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID
} from '../../../../../services/hardware';
import { useStateContext } from '../../../../../contexts/ContextProvider';

interface LineChartProps {
  hardwareID: number;
  timeRangeType: 'day' | 'month' | 'year';
  selectedRange: any;
  parameters: string[];
}

const LineChart: React.FC<LineChartProps> = ({ hardwareID, timeRangeType, selectedRange, parameters }) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);

  const LinePrimaryXAxis = {
    valueType: 'DateTime' as const,
    labelFormat: timeRangeType === 'year' ? 'MMM' : 'dd/MM',
    intervalType: timeRangeType === 'year' ? 'Months' as const : 'Days' as const,
    edgeLabelPlacement: 'Shift' as const,
    majorGridLines: { width: 0 },
    background: 'white',
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
      if (!Array.isArray(raw)) return;

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

          const inRange = (() => {
            if (timeRangeType === 'day') {
              const [start, end] = selectedRange;
              return date >= new Date(start) && date <= new Date(end);
            } else if (timeRangeType === 'month') {
              return date.getMonth() + 1 === Number(selectedRange.month) &&
                     date.getFullYear() === Number(selectedRange.year);
            } else if (timeRangeType === 'year') {
              return date.getFullYear() === Number(selectedRange);
            }
            return false;
          })();

          if (!inRange) continue;

          if (!parameterMap[name]) parameterMap[name] = [];
          parameterMap[name].push({ x: date, y: value });
        }
      }

      const series = Object.entries(parameterMap).map(([name, data]) => ({
        dataSource: data.sort((a, b) => a.x.getTime() - b.x.getTime()),
        xName: 'x',
        yName: 'y',
        name,
        width: 2,
        marker: { visible: true, width: 8, height: 8 },
        type: 'Line' as const,
      }));

      setSeriesData(series);
    };

    fetchData();
  }, [hardwareID, timeRangeType, selectedRange, parameters]);

  return (
    <ChartComponent
      id="line-chart"
      height="420px"
      width="100%"
      primaryXAxis={LinePrimaryXAxis}
      primaryYAxis={LinePrimaryYAxis}
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
  );
};

export default LineChart;
