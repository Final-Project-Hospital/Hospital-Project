import React, { useEffect, useMemo, useState } from 'react';
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

interface ChartPoint { parameter: string; date: string; value: number; }
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

interface LineParamWithColor { parameter: string; color: string; }

/* ---------- type guards ---------- */
const isDateRange = (v: any): v is [Date, Date] =>
  Array.isArray(v) && v.length === 2 && v.every((d) => d instanceof Date && !isNaN(d.getTime()));
const isYearRange = (v: any): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(n));
const isMonthSel = (v: any): v is { month: string; year: string } =>
  v && typeof v === 'object' && 'month' in v && 'year' in v;

/* ---------- init selectedRange ให้ตรงชนิดทันที ---------- */
const initRangeFor = (type: 'hour' | 'day' | 'month' | 'year') => {
  if (type === 'day') {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return [start, end] as [Date, Date];
  }
  if (type === 'month') {
    const now = new Date();
    return { month: (now.getMonth() + 1).toString().padStart(2, '0'), year: now.getFullYear().toString() };
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
  const [selectedRange, setSelectedRange] = useState<any>(() => initRangeFor('day'));
  const [lineChartParameters, setLineChartParameters] = useState<LineParamWithColor[]>([]);

  useEffect(() => {
    if (parameters?.length) {
      setLineChartParameters(parameters.map((param, index) => ({
        parameter: param,
        color: colors[index] || '#0f766e',
      })));
    } else {
      setLineChartParameters([]);
    }
  }, [parameters, colors]);

  // เปลี่ยนชนิดช่วงเวลาแบบ atomic: ตั้งทั้ง type และ selectedRange ใน tick เดียว
  const handleTimeChange = (t: 'hour' | 'day' | 'month' | 'year') => {
    setTimeRangeType(t);
    setSelectedRange(initRangeFor(t));
  };

  // พร้อมหรือยัง (ป้องกันส่งค่า value ผิดชนิดลงไป)
  const isRangeReady = useMemo(() => {
    if (!selectedRange) return false;
    if (timeRangeType === 'hour' || timeRangeType === 'day') return isDateRange(selectedRange);
    if (timeRangeType === 'month') return isMonthSel(selectedRange);
    if (timeRangeType === 'year') return isYearRange(selectedRange);
    return false;
  }, [selectedRange, timeRangeType]);

  return (
    <div className="w-full">
      <div className="w-full mx-auto px-2 py-2">
        <div className="bg-white rounded-2xl dark:bg-secondary-dark-bg dark:text-gray-200 p-3 sm:p-4 shadow">

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

            {/* Parameter Labels */}
            <div className="flex flex-wrap gap-2">
              {lineChartParameters.map((param) => (
                <span
                  key={param.parameter}
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ backgroundColor: param.color, color: '#fff', boxShadow: '0 0 4px rgba(0,0,0,0.2)' }}
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

            {/* 💻 Desktop */}
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
            {isRangeReady ? (
              <LineChart
                hardwareID={hardwareID}
                timeRangeType={timeRangeType}
                selectedRange={selectedRange}
                parameters={lineChartParameters.map(p => p.parameter)}
                colors={lineChartParameters.map(p => p.color)}
                chartHeight="420px"
                reloadKey={reloadKey}
                data={data}
                meta={meta}
                loading={loading}
              />
            ) : (
              <div className="text-center text-gray-500 p-10">กำลังปรับช่วงเวลา…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineChartIndex;
