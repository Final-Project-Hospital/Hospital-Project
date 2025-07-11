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
}

const LineChart: React.FC<LineChartProps> = ({ hardwareID, timeRangeType, selectedRange }) => {
  const { currentMode } = useStateContext();
  const [seriesData, setSeriesData] = useState<any[]>([]);

  const LinePrimaryXAxis = {
    valueType: 'DateTime' as const,
    labelFormat:
      timeRangeType === 'year'
        ? 'MMM'
        : 'dd/MM',
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
      if (!hardwareID) return;

      // Validate selectedRange
      if (timeRangeType === 'day') {
        if (!selectedRange || !Array.isArray(selectedRange) || selectedRange.length !== 2) return;
      } else if (timeRangeType === 'month') {
        if (!selectedRange?.month || !selectedRange?.year) return;
      } else if (timeRangeType === 'year') {
        if (!selectedRange) return;
      }

      const raw = await GetSensorDataByHardwareID(hardwareID);
      if (!Array.isArray(raw)) return;

      let minDate: Date | null = null;
      let maxDate: Date | null = null;

      for (const sensor of raw) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (!Array.isArray(params)) continue;

        params.forEach(param => {
          const date = new Date(param.Date);
          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;
        });
      }

      if (!minDate || !maxDate) return;

      const getNormalizedDayRange = () => {
        let start = new Date(selectedRange[0]);
        start.setHours(0, 0, 0, 0);
        let end = new Date(selectedRange[1]);
        end.setHours(23, 59, 59, 999);

        if (start > maxDate!) start = new Date(maxDate!);
        if (end < minDate!) end = new Date(minDate!);
        return { start, end };
      };

      const filterDate = (date: Date) => {
        if (timeRangeType === 'day') {
          const { start, end } = getNormalizedDayRange();
          return date >= start && date <= end;
        } else if (timeRangeType === 'month') {
          return date.getMonth() + 1 === Number(selectedRange.month)
            && date.getFullYear() === Number(selectedRange.year);
        } else if (timeRangeType === 'year') {
          return date.getFullYear() === Number(selectedRange);
        }
        return false;
      };

      const parameterMap: Record<string, { x: Date; y: number }[]> = {};

      for (const sensor of raw) {
        const params = await GetSensorDataParametersBySensorDataID(sensor.ID);
        if (!Array.isArray(params)) continue;

        for (const param of params) {
          const name = param.HardwareParameter?.Parameter;
          const dataRaw = param.Data;
          const dateRaw = param.Date;

          const value = typeof dataRaw === 'string' ? parseFloat(dataRaw) : typeof dataRaw === 'number' ? dataRaw : NaN;
          const date = new Date(dateRaw);

          if (name && !isNaN(value) && !isNaN(date.getTime()) && filterDate(date)) {
            if (!parameterMap[name]) parameterMap[name] = [];
            parameterMap[name].push({ x: date, y: value });
          }
        }
      }

      if (timeRangeType === 'month') {
        for (const name in parameterMap) {
          const groupedByDay: Record<string, { sum: number; count: number }> = {};
          parameterMap[name].forEach(({ x, y }) => {
            const dayStr = x.toISOString().slice(0, 10);
            if (!groupedByDay[dayStr]) groupedByDay[dayStr] = { sum: 0, count: 0 };
            groupedByDay[dayStr].sum += y;
            groupedByDay[dayStr].count++;
          });
          parameterMap[name] = Object.entries(groupedByDay).map(([day, { sum, count }]) => ({
            x: new Date(day),
            y: sum / count,
          })).sort((a, b) => a.x.getTime() - b.x.getTime());
        }
      } else if (timeRangeType === 'year') {
        for (const name in parameterMap) {
          const groupedByMonth: Record<string, { sum: number; count: number }> = {};
          parameterMap[name].forEach(({ x, y }) => {
            const monthStr = x.toISOString().slice(0, 7);
            if (!groupedByMonth[monthStr]) groupedByMonth[monthStr] = { sum: 0, count: 0 };
            groupedByMonth[monthStr].sum += y;
            groupedByMonth[monthStr].count++;
          });
          parameterMap[name] = Object.entries(groupedByMonth).map(([month, { sum, count }]) => {
            const date = new Date(month + '-01');
            return { x: date, y: sum / count };
          }).sort((a, b) => a.x.getTime() - b.x.getTime());
        }
      }

      const newSeries = Object.keys(parameterMap).map((name) => ({
        dataSource: parameterMap[name],
        xName: 'x',
        yName: 'y',
        name,
        width: 2,
        marker: { visible: true, width: 8, height: 8 },
        type: 'Line' as const,
      }));

      setSeriesData(newSeries);
    };

    fetchData();
  }, [hardwareID, timeRangeType, selectedRange]);

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
        {seriesData.map((item, index) => (
          <SeriesDirective key={index} {...item} />
        ))}
      </SeriesCollectionDirective>
    </ChartComponent>
  );
};

export default LineChart;
