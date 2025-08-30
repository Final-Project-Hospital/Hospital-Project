import React, { useState, useEffect, useRef } from 'react';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import LineChart from './linear';
import { useStateContext } from '../../../../../../contexts/ContextProvider';
import TimeRangeSelector from './TimeRangeSelector';

const dropdownData = [
  { Id: 'hour', Time: 'Hour(s)' },
  { Id: 'day', Time: 'Day(s)' },
  { Id: 'month', Time: 'Month' },
  { Id: 'year', Time: 'Year(s)' },
];

interface ChartPoint {
  parameter: string;
  date: string; // ISO
  value: number;
}
type ChartMetaMap = Record<string, { unit?: string; standard?: number; standardMin?: number }>;

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  reloadKey?: number;

  // ✅ รับจากพ่อ
  data?: ChartPoint[];
  meta?: ChartMetaMap;
  loading?: boolean;
}

interface LineParamWithColor {
  parameter: string;
  color: string;
}

const LineChartIndex: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors = [],
  reloadKey,
  data,
  meta,
  loading,
}) => {
  const { currentMode } = useStateContext();
  const [timeRangeType, setTimeRangeType] = useState<'hour' | 'day' | 'month' | 'year'>('day');
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [lineChartParameters, setLineChartParameters] = useState<LineParamWithColor[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // ✅ Detect resize dynamically
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const combined = parameters.map((param, index) => ({
        parameter: param,
        color: colors[index] || '#0f766e',
      }));
      setLineChartParameters(combined);
    } else {
      setLineChartParameters([]);
    }
  }, [parameters, colors]);

  // ✅ Default selectedRange by type
  useEffect(() => {
    if (timeRangeType === 'day') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      setSelectedRange([sevenDaysAgo, today]);
    } else if (timeRangeType === 'month') {
      const now = new Date();
      setSelectedRange({
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        year: now.getFullYear().toString(),
      });
    } else if (timeRangeType === 'year') {
      const y = new Date().getFullYear();
      setSelectedRange([y, y]);
    } else if (timeRangeType === 'hour') {
      const end = new Date();
      const start = new Date(end.getTime() - 6 * 60 * 60 * 1000);
      setSelectedRange([start, end]);
    }
  }, [timeRangeType]);

  return (
    <div className="w-full" ref={containerRef}>
      <div className="w-full mx-auto px-2 py-2">
        <div className="bg-white rounded-2xl dark:bg-secondary-dark-bg dark:text-gray-200 p-3 sm:p-4 shadow">

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

            {/* Parameter Labels */}
            <div className="flex flex-wrap gap-2">
              {lineChartParameters.map((param, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded-full"
                  style={{
                    backgroundColor: param.color,
                    color: '#fff',
                    boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                  }}
                >
                  {param.parameter}
                </span>
              ))}
            </div>

            {/* ✅ Responsive selector row */}
            {/* 📱 Mobile (stacked) */}
            <div className="flex flex-col gap-2 w-full sm:hidden">
              <DropDownListComponent
                id="time-mobile"
                fields={{ text: 'Time', value: 'Id' }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  padding: '2px 0',
                  color: currentMode === 'Dark' ? 'white' : '#0f766e',
                }}
                value={timeRangeType}
                dataSource={dropdownData}
                popupHeight="220px"
                popupWidth="140px"
                change={(e) => setTimeRangeType(e.value)}
              />

              <TimeRangeSelector
                timeRangeType={timeRangeType}
                onChange={setSelectedRange}
                selectedValue={selectedRange}
              />
            </div>

            {/* 💻 Tablet / Desktop (row) */}
            <div className="hidden sm:flex flex-nowrap gap-2 w-full md:w-auto items-center">
              <div className="flex-shrink min-w-[90px] max-w-[120px] text-xs">
                <DropDownListComponent
                  id="time"
                  fields={{ text: 'Time', value: 'Id' }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    padding: '2px 0',
                    color: currentMode === 'Dark' ? 'white' : '#0f766e',
                  }}
                  value={timeRangeType}
                  dataSource={dropdownData}
                  popupHeight="220px"
                  popupWidth="140px"
                  change={(e) => setTimeRangeType(e.value)}
                />
              </div>

              <div className="flex-1 min-w-[140px] max-w-[220px] text-xs">
                <TimeRangeSelector
                  timeRangeType={timeRangeType}
                  onChange={setSelectedRange}
                  selectedValue={selectedRange}
                />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex flex-col gap-8">
            <LineChart
              hardwareID={hardwareID}
              timeRangeType={timeRangeType}
              selectedRange={selectedRange}
              parameters={lineChartParameters.map(p => p.parameter)}
              colors={lineChartParameters.map(p => p.color)}
              chartHeight="420px"
              reloadKey={reloadKey}
              key={containerWidth}
              // ส่งต่อจากพ่อ
              data={data}
              meta={meta}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineChartIndex;
