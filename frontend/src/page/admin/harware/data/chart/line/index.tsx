import React, { useState, useEffect } from 'react';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import LineChart from './linear';
import { useStateContext } from '../../../../../../contexts/ContextProvider';
import TimeRangeSelector from './TimeRangeSelector';

const dropdownData = [
  { Id: 'day', Time: 'Day(s)' },
  { Id: 'month', Time: 'Month' },
  { Id: 'year', Time: 'Year(s)' },
];

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
}

const Index: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors = [],
}) => {
  const { currentMode } = useStateContext();
  const [timeRangeType, setTimeRangeType] = useState<'day' | 'month' | 'year'>('day');
  const [selectedRange, setSelectedRange] = useState<any>(null);

  useEffect(() => {
    if (timeRangeType === 'day') {
      const today = new Date();
      today.setHours(23,59,59,999);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0,0,0,0);
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
    }
  }, [timeRangeType]);

  // Detect mobile (window width < 640px)
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 640 : false;

  return (
    <div className="w-full">
      <div className="w-full mx-auto px-2 py-2">
        <div className="
          bg-white rounded-2xl dark:bg-secondary-dark-bg dark:text-gray-200
          p-3 sm:p-4
          flex flex-col gap-4
          shadow
        ">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <p className="text-2xl md:text-3xl font-semibold">Sensor Data</p>
            <div className="flex flex-col sm:flex-row gap-2 md:items-center">
              <div className="w-full sm:w-32 border border-gray-300 px-2 py-1 rounded-md">
                <DropDownListComponent
                  id="time"
                  fields={{ text: 'Time', value: 'Id' }}
                  style={{
                    border: 'none',
                    color: currentMode === 'Dark' ? 'white' : undefined,
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
          {/* Chart area: always full width, responsive height */}
          <div className="w-full flex justify-center">
            <div className="w-full">
              <LineChart
                hardwareID={hardwareID}
                timeRangeType={timeRangeType}
                selectedRange={selectedRange}
                parameters={parameters}
                colors={colors}
                chartHeight={isMobile ? "300px" : "420px"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
