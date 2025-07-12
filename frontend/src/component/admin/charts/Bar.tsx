import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  Legend,
  Category,
  Tooltip,
  ColumnSeries,
  DataLabel,
  DateTime,
} from '@syncfusion/ej2-react-charts';
import ChartsHeader from '../ChartsHeader';
import { useStateContext } from '../../../contexts/ContextProvider';
import { useEffect, useState } from 'react';
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
} from '../../../services/hardware';

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[]; // เพิ่ม colors
  timeRangeType: 'day' | 'month' | 'year';
  selectedRange: any;
}

const Bar: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors, // รับเข้ามาด้วย!
  timeRangeType,
  selectedRange,
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);

  const primaryXAxis = {
    valueType: 'DateTime' as const,
    labelFormat: timeRangeType === 'year' ? 'MMM' : 'dd/MM',
    intervalType: timeRangeType === 'year' ? 'Months' as const : 'Days' as const,
    majorGridLines: { width: 0 },
    edgeLabelPlacement: 'Shift' as const,
  };

  const primaryYAxis = {
    labelFormat: '{value}',
    lineStyle: { width: 0 },
    majorTickLines: { width: 0 },
    minorTickLines: { width: 0 },
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!hardwareID || !parameters?.length || !selectedRange) return;

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

          if (!name || !parameters.includes(name)) continue;
          if (isNaN(value) || isNaN(date.getTime())) continue;

          const inRange = (() => {
            if (timeRangeType === 'day') {
              const [start, end] = selectedRange;
              return date >= new Date(start) && date <= new Date(end);
            } else if (timeRangeType === 'month') {
              return (
                date.getMonth() + 1 === Number(selectedRange.month) &&
                date.getFullYear() === Number(selectedRange.year)
              );
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
        type: 'Column' as const,
        marker: {
          dataLabel: {
            visible: false,
            position: 'Top',
            font: { fontWeight: '600' },
          },
        },
      }));

      setSeriesData(series);
    };

    fetchData();
  }, [hardwareID, timeRangeType, selectedRange, parameters]);

  if (!selectedRange || !parameters?.length) return null;

  return (
    <div className="bg-white dark:bg-secondary-dark-bg rounded-2xl p-4 h-[540px]">
      <ChartsHeader category="Sensor Data" />
      <ChartComponent
        id="bar-chart"
        primaryXAxis={primaryXAxis}
        primaryYAxis={primaryYAxis}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        legendSettings={{ background: 'white' }}
        width="100%"
        height="370px"
      >
        <Inject
          services={[
            ColumnSeries,
            Legend,
            Tooltip,
            Category,
            DataLabel,
            DateTime,
          ]}
        />
        <SeriesCollectionDirective>
          {seriesData.map((item, index) => (
            <SeriesDirective
              key={index}
              {...item}
              fill={colors && colors[index] ? colors[index] : undefined}
            />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Bar;
