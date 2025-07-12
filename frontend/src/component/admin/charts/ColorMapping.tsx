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
  colors?: string[]; // รับสี
  timeRangeType: 'day' | 'month' | 'year';
  selectedRange: any;
}

const ColorMapping: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors,
  timeRangeType,
  selectedRange,
}) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<{ x: Date; y: number }[]>([]);

  const primaryXAxis = {
    valueType: 'DateTime' as const,
    labelFormat: timeRangeType === 'year' ? 'MMM' : 'dd/MM',
    intervalType: (timeRangeType === 'year' ? 'Months' : 'Days') as 'Days' | 'Months',
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
      const dataPoints: { x: Date; y: number }[] = [];
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
          dataPoints.push({ x: date, y: value });
        }
      }
      dataPoints.sort((a, b) => a.x.getTime() - b.x.getTime());
      setSeriesData(dataPoints);
    };

    fetchData();
  }, [hardwareID, parameters, timeRangeType, selectedRange]);

  if (seriesData.length === 0) return null;

  return (
    <div className="bg-white dark:bg-secondary-dark-bg rounded-2xl p-4 h-[540px]">
      <ChartsHeader category="Sensor Data" />
      <ChartComponent
        id="color-mapping-chart"
        primaryXAxis={primaryXAxis}
        primaryYAxis={primaryYAxis}
        chartArea={{ border: { width: 0 } }}
        legendSettings={{ mode: 'Range', background: 'white' }}
        tooltip={{ enable: true }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        width="100%"
        height="370px"
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
              start={0}
              end={99999} // คุณอาจกำหนดช่วงตาม logic จริง
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
