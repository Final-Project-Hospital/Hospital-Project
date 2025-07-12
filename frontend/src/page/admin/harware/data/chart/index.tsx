import React, { useState, useEffect } from 'react';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import LineChart from './linear';
import { dropdownData } from '../../../../../data/dummy';
import TimeRangeSelector from './TimeRangeSelector';
import { useStateContext } from '../../../../../contexts/ContextProvider';

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];                     // ← เพิ่ม prop colors
  timeRangeType?: 'day' | 'month' | 'year';  
  selectedRange?: any;                       
}

const Index: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors = [],                         // ← กำหนด default ให้เป็น array ว่าง
}) => {
  const { currentMode } = useStateContext();
  const [timeRangeType, setTimeRangeType] = useState<'day' | 'month' | 'year'>('day');
  const [selectedRange, setSelectedRange] = useState<any>(null);

  // log ค่า props และ state ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    console.log('📥 LineChart Props:', {
      hardwareID,
      parameters,
      colors,
      timeRangeType,
      selectedRange,
    });
  }, [hardwareID, parameters, colors, timeRangeType, selectedRange]);

  useEffect(() => {
    if (timeRangeType === 'day') {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      setSelectedRange([sevenDaysAgo, today]);
    } else if (timeRangeType === 'month') {
      const now = new Date();
      setSelectedRange({
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        year: now.getFullYear().toString(),
      });
    } else if (timeRangeType === 'year') {
      setSelectedRange(new Date().getFullYear().toString());
    }
  }, [timeRangeType]);

  return (
    <div className="w-full bg-white p-6 rounded-2xl dark:bg-secondary-dark-bg dark:text-gray-200">
      <div className="flex justify-between items-center gap-2 mb-6">
        <p className="text-3xl font-semibold">Sensor Data</p>

        <div className="flex gap-2 items-center">
          <div className="w-28 border border-gray-300 px-2 py-1 rounded-md">
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
              popupWidth="120px"
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

      <div className="w-full">
        <LineChart
          hardwareID={hardwareID}
          timeRangeType={timeRangeType}
          selectedRange={selectedRange}
          parameters={parameters}
          colors={colors}            
        />
      </div>
    </div>
  );
};

export default Index;
