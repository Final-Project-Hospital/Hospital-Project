import React, { useEffect, useState } from 'react';
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
} from '@syncfusion/ej2-react-charts';
import ChartsHeader from '../ChartsHeader';
import { useStateContext } from '../../../contexts/ContextProvider';
import {
  GetSensorDataByHardwareID,
  GetSensorDataParametersBySensorDataID,
} from '../../../services/hardware';

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  timeRangeType: 'day' | 'month' | 'year';
  selectedRange: any;
}

const Stacked: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors,
  timeRangeType,
  selectedRange,
}) => {
  const { currentMode } = useStateContext();
  const [stackedData, setStackedData] = useState<{ [key: string]: { x: string; y: number }[] }>({});

  const primaryXAxis: AxisModel = {
    valueType: 'Category',
    majorGridLines: { width: 0 },
    labelIntersectAction: 'Rotate45',
    labelRotation: 0,
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

      const paramDataMap: { [param: string]: { x: string; y: number }[] } = {};

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

          const label =
            timeRangeType === 'year'
              ? date.toLocaleString('default', { month: 'short' }) // e.g., "Jan"
              : date.toLocaleDateString(); // e.g., "7/11/2025"

          if (!paramDataMap[name]) paramDataMap[name] = [];
          paramDataMap[name].push({ x: label, y: value });
        }
      }

      setStackedData(paramDataMap);
    };

    fetchData();
  }, [hardwareID, parameters, timeRangeType, selectedRange]);

  const hasData = Object.keys(stackedData).length > 0;

  if (!hasData) return null;

  return (
    <div className="bg-white dark:bg-secondary-dark-bg rounded-2xl p-4 h-[540px]">
      <ChartsHeader category="Stacked" title="Sensor Stacked Chart" />
      <ChartComponent
        id="stacked-chart"
        width="100%"
        height="370px"
        primaryXAxis={primaryXAxis}
        primaryYAxis={primaryYAxis}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        legendSettings={{ background: 'white' }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
      >
        <Inject services={[StackingColumnSeries, Category, Legend, Tooltip]} />
        <SeriesCollectionDirective>
          {Object.entries(stackedData).map(([param, data], index) => (
            <SeriesDirective
              key={index}
              dataSource={data}
              xName="x"
              yName="y"
              name={param}
              type="StackingColumn"
              fill={colors && colors[index] ? colors[index] : undefined}
            />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Stacked;
