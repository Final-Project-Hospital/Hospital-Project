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
import { useStateContext } from '../../../../../../contexts/ContextProvider';
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

function getMonthLabel(date: Date) {
  return date.toLocaleString('default', { month: 'short' });
}

// ------ ตรงนี้เปลี่ยนใหม่! -------
function getDayLabel(date: Date) {
  // แสดงแค่ วัน/เดือน เช่น "15/07"
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}
// ----------------------------------

const Stacked: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors,
  timeRangeType,
  selectedRange,
  chartHeight = "420px",
}) => {
  const { currentMode } = useStateContext();
  const [stackedData, setStackedData] = useState<{ [key: string]: { x: string; y: number }[] }>({}); //@ts-ignore
  const [categories, setCategories] = useState<string[]>([]);
  const [hasData, setHasData] = useState(true);

  const primaryXAxis: AxisModel = {
    valueType: 'Category',
    majorGridLines: { width: 0 },
    labelIntersectAction: 'Rotate45',
    labelRotation: 0,
    interval: 1,
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
      if (!Array.isArray(raw)) { setStackedData({}); setCategories([]); setHasData(false); return; }

      const paramDataMap: { [param: string]: { x: string; y: number }[] } = {};
      const xCategorySet: Set<string> = new Set();

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
          let label = "";
          if (timeRangeType === 'day') {
            if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
            const [start, end] = selectedRange;
            inRange = date >= new Date(start) && date <= new Date(end);
            if (inRange) label = getDayLabel(date);
          } else if (timeRangeType === 'month') {
            inRange = (date.getMonth() + 1 === Number(selectedRange.month)) &&
                      (date.getFullYear() === Number(selectedRange.year));
            if (inRange) label = getDayLabel(date);
          } else if (timeRangeType === 'year') {
            if (!selectedRange || !selectedRange[0] || !selectedRange[1]) continue;
            const [start, end] = selectedRange;
            inRange = date.getFullYear() >= +start && date.getFullYear() <= +end;
            if (inRange) label = getMonthLabel(date) + " " + date.getFullYear();
          }

          if (!inRange || !label) continue;

          if (!paramDataMap[name]) paramDataMap[name] = [];
          paramDataMap[name].push({ x: label, y: value });
          xCategorySet.add(label);
        }
      }

      const xCategoriesArr = Array.from(xCategorySet).sort((a, b) => {
        const parseDate = (str: string) => {
          // สำหรับ label แบบ "dd/MM"
          const parts = str.split("/");
          if (parts.length === 2) {
            // สมมติปีนี้ เช่น "15/07" => "2025-07-15"
            return new Date(new Date().getFullYear(), +parts[1] - 1, +parts[0]).getTime();
          }
          if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
          // สำหรับ label แบบ "Jul 2025"
          if (str.match(/^[A-Za-z]{3}\s\d{4}$/)) return new Date(str).getTime();
          return 0;
        };
        return parseDate(a) - parseDate(b);
      });

      for (const param of parameters) {
        if (!paramDataMap[param]) paramDataMap[param] = [];
        const existing = new Map(paramDataMap[param].map(d => [d.x, d.y]));
        paramDataMap[param] = xCategoriesArr.map(cat => ({
          x: cat,
          y: existing.get(cat) ?? 0,
        }));
      }

      setStackedData(paramDataMap);
      setCategories(xCategoriesArr);
      setHasData(Object.keys(paramDataMap).length > 0 && xCategoriesArr.length > 0);
    };

    fetchData();
  }, [hardwareID, parameters, timeRangeType, selectedRange]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-80 text-lg text-gray-500">
        No Data
      </div>
    );
  }

  return (
    <ChartComponent
      id="stacked-chart"
      width="100%"
      height={chartHeight}
      primaryXAxis={primaryXAxis}
      primaryYAxis={primaryYAxis}
      chartArea={{ border: { width: 0 } }}
      tooltip={{ enable: true }}
      legendSettings={{ background: 'white' }}
      background={currentMode === 'Dark' ? '#33373E' : '#fff'}
    >
      <Inject services={[StackingColumnSeries, Category, Legend, Tooltip]} />
      <SeriesCollectionDirective>
        {parameters.map((param, index) => (
          <SeriesDirective
            key={index}
            dataSource={stackedData[param]}
            xName="x"
            yName="y"
            name={param}
            type="StackingColumn"
            fill={colors && colors[index] ? colors[index] : undefined}
          />
        ))}
      </SeriesCollectionDirective>
    </ChartComponent>
  );
};

export default Stacked;
