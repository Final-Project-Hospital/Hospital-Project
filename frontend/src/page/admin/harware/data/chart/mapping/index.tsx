import React, { useState, useEffect } from 'react';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import ColorMapping from './ColorMapping';
import TimeRangeSelector from './TimeRangeSelector';
import { useStateContext } from '../../../../../../contexts/ContextProvider';
import { ListHardwareParameterIDsByHardwareID } from '../../../../../../services/hardware';

const dropdownData = [
  { Id: 'day', Time: 'Day(s)' },
  { Id: 'month', Time: 'Month' },
  { Id: 'year', Time: 'Year(s)' },
];


interface ColorMappingIndexProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
}

interface ColorParamWithColor {
  parameter: string;
  color: string;
}

const ColorMappingIndex: React.FC<ColorMappingIndexProps> = ({
  hardwareID,
  parameters,
  colors = [],
}) => {
  const { currentMode } = useStateContext();
  const [timeRangeType, setTimeRangeType] = useState<'day' | 'month' | 'year'>('day');
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [colorMappingParameters, setColorMappingParameters] = useState<ColorParamWithColor[]>([]);
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 640 : false;

  const getDefaultRange = (type: 'day' | 'month' | 'year') => {
    const now = new Date();
    if (type === 'day') {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return [start, end];
    } else if (type === 'month') {
      return {
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        year: now.getFullYear().toString(),
      };
    } else if (type === 'year') {
      const year = now.getFullYear();
      return [year, year];
    }
    return null;
  };

  useEffect(() => {
    const loadColorMappingParameters = async () => {
      if (!hardwareID) return;

      const response = await ListHardwareParameterIDsByHardwareID(hardwareID);
      if (response && Array.isArray(response.parameters)) {
        const colorParams = (response.parameters as any[])
          .filter((item) => item.graph_id === 3)
          .map((item) => ({ parameter: item.parameter, color: item.color }));
        setColorMappingParameters(colorParams);
      }
    };

    loadColorMappingParameters();
  }, [hardwareID]);

  // 🛠 อัปเดต default range ทันทีที่ timeRangeType เปลี่ยน
  useEffect(() => {
    const defaultRange = getDefaultRange(timeRangeType);
    setSelectedRange(defaultRange);
  }, [timeRangeType]);

  return (
    <div className="w-full">
      <div className="w-full mx-auto px-2 py-2">
        <div className="
          bg-white rounded-2xl dark:bg-secondary-dark-bg dark:text-gray-200
          p-3 sm:p-4
          flex flex-col gap-4
          shadow
        ">
          {/* Header & Parameter Tags */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              {colorMappingParameters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
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
              )}
            </div>

            {/* DropDown + Time Selector */}
            <div className="flex flex-col sm:flex-row gap-2 md:items-center">
              <div className={`
                w-full sm:w-40 rounded-xl transition
                bg-white dark:bg-gray-800
                border border-teal-500 dark:border-teal-400
                focus-within:ring-2 focus-within:ring-teal-400
                px-2 py-1
                shadow-sm
              `}>
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
                  change={(e) => {
                    const newType = e.value;
                    setTimeRangeType(newType);
                    const defaultRange = getDefaultRange(newType);
                    setSelectedRange(defaultRange);
                  }}
                />
              </div>

              <TimeRangeSelector
                timeRangeType={timeRangeType}
                onChange={setSelectedRange}
                selectedValue={selectedRange}
              />
            </div>
          </div>

          {/* Chart */}
          <div className="w-full flex justify-center">
            <div className="w-full">
              <ColorMapping
                hardwareID={hardwareID}
                parameters={parameters}
                colors={colors}
                timeRangeType={timeRangeType}
                selectedRange={selectedRange}
                chartHeight={isMobile ? "300px" : "420px"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorMappingIndex;
