import React, { useState, useEffect, useMemo } from 'react';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import ColorMapping from './ColorMapping';
import TimeRangeSelector from './TimeRangeSelector';
import { useStateContext } from '../../../../../../contexts/ContextProvider';

const dropdownData = [
  { Id: 'hour', Time: 'Hour(s)' },
  { Id: 'day',  Time: 'Day(s)'  },
  { Id: 'month', Time: 'Month'  },
  { Id: 'year', Time: 'Year(s)' },
];

interface ColorMappingIndexProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  reloadKey?: number;
}

interface ColorParamWithColor {
  parameter: string;
  color: string;
}

const ColorMappingIndex: React.FC<ColorMappingIndexProps> = ({
  hardwareID,
  parameters,
  colors = [],
  reloadKey,
}) => {
  const { currentMode } = useStateContext();
  const [timeRangeType, setTimeRangeType] = useState<'hour' | 'day' | 'month' | 'year'>('day');
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [colorMappingParameters, setColorMappingParameters] = useState<ColorParamWithColor[]>([]);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;

  const isRangeReady = useMemo(() => {
    if (!selectedRange) return false;
    if (timeRangeType === 'hour')  return Array.isArray(selectedRange) && selectedRange.length === 2;
    if (timeRangeType === 'day')   return Array.isArray(selectedRange) && selectedRange.length === 2;
    if (timeRangeType === 'month') return selectedRange?.month && selectedRange?.year;
    if (timeRangeType === 'year')  return Array.isArray(selectedRange) && selectedRange.length === 2;
    return false;
  }, [selectedRange, timeRangeType]);

  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const mapped = parameters.map((param, index) => ({
        parameter: param,
        color: colors[index] || '#999999',
      }));
      setColorMappingParameters(mapped);
    } else {
      setColorMappingParameters([]);
    }
  }, [parameters, colors]);

  useEffect(() => {
    const now = new Date();
    if (timeRangeType === 'hour') {
      // default ย้อนหลัง 6 ชั่วโมง
      const end = new Date();
      const start = new Date(end.getTime() - 6 * 60 * 60 * 1000);
      setSelectedRange([start, end]);
    } else if (timeRangeType === 'day') {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      setSelectedRange([start, end]);
    } else if (timeRangeType === 'month') {
      setSelectedRange({
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        year: now.getFullYear().toString(),
      });
    } else if (timeRangeType === 'year') {
      const year = now.getFullYear();
      setSelectedRange([year, year]);
    }
  }, [timeRangeType]);

  return (
    <div className="w-full">
      <div className="w-full mx-auto px-2 py-2">
        <div className="bg-white rounded-2xl dark:bg-secondary-dark-bg dark:text-gray-200 p-3 sm:p-4 shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {colorMappingParameters.map((param, idx) => (
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

            <div className="flex flex-col sm:flex-row gap-2 md:items-center">
              <div className="w-full sm:w-40 rounded-xl transition bg-white dark:bg-gray-800 border border-teal-500 dark:border-teal-400 px-2 py-1 shadow-sm">
                <DropDownListComponent
                  id="time"
                  fields={{ text: 'Time', value: 'Id' }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 500,
                    padding: '4px 0',
                    color: currentMode === 'Dark' ? 'white' : '#0f766e',
                  }}
                  value={timeRangeType}
                  dataSource={dropdownData}
                  popupHeight="220px"
                  popupWidth="160px"
                  change={(e) => setTimeRangeType(e.value)}
                />
              </div>

              <TimeRangeSelector
                timeRangeType={timeRangeType}
                onChange={setSelectedRange}
                selectedValue={selectedRange}
              />
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {isRangeReady ? (
              <ColorMapping
                hardwareID={hardwareID}
                parameters={colorMappingParameters.map((p) => p.parameter)}
                colors={colorMappingParameters.map((p) => p.color)}
                timeRangeType={timeRangeType}
                selectedRange={selectedRange}
                chartHeight={isMobile ? '300px' : '420px'}
                reloadKey={reloadKey}
              />
            ) : (
              <div className="text-center text-gray-500 p-10">Loading data...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorMappingIndex;
