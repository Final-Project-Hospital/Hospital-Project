import React, { useState, useEffect } from 'react';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import Stacked from './Stacked';
import TimeRangeSelector from './TimeRangeSelector';
import { useStateContext } from '../../../../../../contexts/ContextProvider';
import { ListHardwareParameterIDsByHardwareID } from '../../../../../../services/hardware';

const dropdownData = [
  { Id: 'day', Time: 'Day(s)' },
  { Id: 'month', Time: 'Month' },
  { Id: 'year', Time: 'Year(s)' },
];

interface StackedChartIndexProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
}

interface ParamWithColor {
  parameter: string;
  color: string;
}

const StackedChartIndex: React.FC<StackedChartIndexProps> = ({ //@ts-ignore
  hardwareID,//@ts-ignore
  parameters,//@ts-ignore
  colors = [],
}) => {
  const { currentMode } = useStateContext();
  const [timeRangeType, setTimeRangeType] = useState<'day' | 'month' | 'year'>('day');
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [stackedParameters, setStackedParameters] = useState<ParamWithColor[]>([]);

  const isMobile = typeof window !== "undefined" ? window.innerWidth < 640 : false;

  useEffect(() => {
    const loadStackedParams = async () => {
      if (!hardwareID) return;

      const response = await ListHardwareParameterIDsByHardwareID(hardwareID);
      console.log("Stacked Raw response:", response);

      if (response && Array.isArray(response.parameters)) {
        const filteredParams = (response.parameters as any[])
          .filter((item) => item.graph_id === 4)
          .map((item) => ({
            parameter: item.parameter,
            color: item.color,
          }));

        setStackedParameters(filteredParams);
      } else {
        console.warn("response.parameters is not an array");
      }
    };

    loadStackedParams();
  }, [hardwareID]);

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
              {stackedParameters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {stackedParameters.map((param, idx) => (
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
                    color: currentMode === 'Dark' ? 'white' : '#0f766e', // teal-700
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
              <Stacked
                hardwareID={hardwareID}
                parameters={stackedParameters.map(p => p.parameter)}
                colors={stackedParameters.map(p => p.color)}
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

export default StackedChartIndex;
