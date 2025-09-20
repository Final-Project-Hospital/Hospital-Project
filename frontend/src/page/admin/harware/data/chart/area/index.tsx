import React, { useState, useEffect } from 'react';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import Area from './Area';
import TimeRangeSelector from './TimeRangeSelector';
import { useStateContext } from '../../../../../../contexts/ContextProvider';

const dropdownData = [
  { Id: 'hour', Time: 'Hour(s)' },
  { Id: 'day', Time: 'Day(s)' },
  { Id: 'month', Time: 'Month' },
  { Id: 'year', Time: 'Year(s)' },
];

interface AreaParamWithColor {
  parameter: string;
  color: string;
}

type ChartPoint = {
  parameter: string;
  date: string; // ISO
  value: number;
};
type ChartMetaMap = Record<string, { unit?: string; standard?: number; standardMin?: number }>;

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  reloadKey?: number;

  data?: ChartPoint[];
  meta?: ChartMetaMap;
  loading?: boolean;
}

const initRangeFor = (type: 'hour' | 'day' | 'month' | 'year') => {
  if (type === 'day') {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return [sevenDaysAgo, today] as [Date, Date];
  }
  if (type === 'month') {
    const now = new Date();
    return {
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      year: now.getFullYear().toString(),
    };
  }
  if (type === 'year') {
    const y = new Date().getFullYear();
    return [y, y] as [number, number];
  }
  // hour
  const end = new Date();
  const start = new Date(end.getTime() - 6 * 60 * 60 * 1000);
  return [start, end] as [Date, Date];
};

const AreaChartIndex: React.FC<ChartdataProps> = ({
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
  const [selectedRange, setSelectedRange] = useState<any>(() => initRangeFor('day'));
  const [areaChartParameters, setAreaChartParameters] = useState<AreaParamWithColor[]>([]);

  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const combined = parameters.map((param, index) => ({
        parameter: param,
        color: colors[index] || '#999999',
      }));
      setAreaChartParameters(combined);
    } else {
      setAreaChartParameters([]);
    }
  }, [parameters, colors]);

  const handleTimeChange = (t: 'hour' | 'day' | 'month' | 'year') => {
    // ตั้งทั้งสอง state พร้อมกันเพื่อกัน state ขัดกันชั่วคราว
    setTimeRangeType(t);
    setSelectedRange(initRangeFor(t));
  };

  return (
    <div className="w-full">
      <div className="w-full mx-auto px-2 py-2">
        <div className="bg-white rounded-2xl dark:bg-secondary-dark-bg dark:text-gray-200 p-3 sm:p-4 shadow">

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

            {/* Parameter Labels */}
            <div className="flex flex-wrap gap-2">
              {areaChartParameters.map((param, idx) => (
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

            {/* 📱 Mobile */}
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
                change={(e) => handleTimeChange(e.value)}
              />

              <TimeRangeSelector
                timeRangeType={timeRangeType}
                onChange={setSelectedRange}
                selectedValue={selectedRange}
              />
            </div>

            {/* 💻 Tablet / Desktop */}
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
                  change={(e) => handleTimeChange(e.value)}
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
            <Area
              hardwareID={hardwareID}
              parameters={areaChartParameters.map((p) => p.parameter)}
              colors={areaChartParameters.map((p) => p.color)}
              timeRangeType={timeRangeType}
              selectedRange={selectedRange}
              chartHeight="420px"
              reloadKey={reloadKey}
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

export default AreaChartIndex;
