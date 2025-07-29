import React, { useState, useEffect } from 'react';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import LineChart from './linear';
import { useStateContext } from '../../../../../../contexts/ContextProvider';
import TimeRangeSelector from './TimeRangeSelector';
import { ListHardwareParameterIDsByHardwareID } from '../../../../../../services/hardware';

const dropdownData = [
  { Id: 'day', Time: 'Day(s)' },
  { Id: 'month', Time: 'Month' },
  { Id: 'year', Time: 'Year(s)' },
];

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  reloadKey?:number;
}

interface LineParamWithColor {
  parameter: string;
  color: string;
}

const Index: React.FC<ChartdataProps> = ({
  hardwareID,
  parameters,
  colors = [],
  reloadKey,
}) => {
  const { currentMode } = useStateContext();
  const [timeRangeType, setTimeRangeType] = useState<'day' | 'month' | 'year'>('day');
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [lineChartParameters, setLineChartParameters] = useState<LineParamWithColor[]>([]);
  const [reloadCharts, setReloadCharts] = useState(0);

  useEffect(() => {
    const loadLineChartParameters = async () => {
      if (!hardwareID) return;

      const response = await ListHardwareParameterIDsByHardwareID(hardwareID);

      if (response && Array.isArray(response.parameters)) {
        const lineParams = (response.parameters as any[])
          .filter((item) => item.graph_id === 1)
          .map((item) => ({ parameter: item.parameter, color: item.color }));

        setLineChartParameters(lineParams);
        setReloadCharts(prev => prev + 1); // Trigger reload after update
      } else {
        console.warn("response.parameters is not an array");
      }
    };

    loadLineChartParameters();
  }, [hardwareID,reloadKey]);

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
    }
  }, [timeRangeType]);

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
            <div>
              {lineChartParameters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
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
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:items-center">
              <div
                className={`
      w-full sm:w-40 rounded-xl transition
      bg-white dark:bg-gray-800
      border border-teal-500 dark:border-teal-400
      focus-within:ring-2 focus-within:ring-teal-400
      px-2 py-1
      shadow-sm
    `}
              >
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

          <div className="w-full flex justify-center">
            <div className="w-full">
              <LineChart
                hardwareID={hardwareID}
                timeRangeType={timeRangeType}
                selectedRange={selectedRange}
                parameters={parameters}
                colors={colors}
                chartHeight={isMobile ? "300px" : "420px"}
                reloadKey={reloadCharts}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;