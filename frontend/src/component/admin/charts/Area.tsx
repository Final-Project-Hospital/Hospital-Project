// Area.tsx
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  DateTime,
  SplineAreaSeries,
  Legend,
  Tooltip
} from '@syncfusion/ej2-react-charts';
import ChartsHeader from '../ChartsHeader';
import { useStateContext } from '../../../contexts/ContextProvider';
import { useEffect, useState } from 'react';
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID
} from '../../../services/hardware';

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  timeRangeType: 'day' | 'month' | 'year';
  selectedRange: any;
}

const Area: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  timeRangeType,
  selectedRange
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);

  const primaryXAxis = {
    valueType: 'DateTime' as const,
    labelFormat: timeRangeType === 'year' ? 'MMM' : 'dd/MM',
    intervalType: timeRangeType === 'year' ? 'Months' as const : 'Days' as const,
    edgeLabelPlacement: 'Shift' as const,
    majorGridLines: { width: 0 },
    background: 'white',
  };

  const primaryYAxis = {
    labelFormat: '{value}',
    rangePadding: 'None' as const,
    lineStyle: { width: 0 },
    majorTickLines: { width: 0 },
    minorTickLines: { width: 0 },
  };

  useEffect(() => {
    const fetchData = async () => {
      console.log("Parameters:", parameters);
      console.log("Selected Range:", selectedRange);

      if (!hardwareID || !parameters?.length) return;

      const raw = await GetSensorDataByHardwareID(hardwareID);
      console.log("Raw sensor data:", raw);
      if (!Array.isArray(raw)) return;

      const parameterMap: Record<string, { x: Date; y: number }[]> = {};

      for (const sensor of raw) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        console.log("Sensor params:", params);
        if (!Array.isArray(params)) continue;

        for (const param of params) {
          const name = param.HardwareParameter?.Parameter;
          const value = typeof param.Data === 'string' ? parseFloat(param.Data) : param.Data;
          const date = new Date(param.Date);

          const include = name && parameters.includes(name) && !isNaN(value) && !isNaN(date.getTime());
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

          console.log("Checking param", { name, value, date });
          console.log("Included?", include);
          console.log("In range?", inRange);

          if (!include || !inRange) continue;

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
        marker: { visible: true, width: 6, height: 6 },
        type: 'SplineArea' as const,
        opacity: 0.4,
      }));

      console.log("Final series data", series);
      setSeriesData(series);
    };

    fetchData();
  }, [hardwareID, timeRangeType, selectedRange, parameters]);

  return (
    <div className="bg-white dark:bg-secondary-dark-bg rounded-2xl p-4 h-[540px]">
      <ChartsHeader category="Area" title="Sensor Area Chart" />
      <ChartComponent
        id="area-chart"
        primaryXAxis={primaryXAxis}
        primaryYAxis={primaryYAxis}
        chartArea={{ border: { width: 0 } }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        legendSettings={{ background: 'white' }}
        tooltip={{ enable: true }}
        width="100%"
        height="370px"
      >
        <Inject services={[SplineAreaSeries, DateTime, Legend, Tooltip]} />
        <SeriesCollectionDirective>
          {seriesData.map((item, index) => (
            <SeriesDirective key={index} {...item} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Area;
