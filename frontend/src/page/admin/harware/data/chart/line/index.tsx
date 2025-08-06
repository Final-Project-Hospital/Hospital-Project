import React, { useState, useEffect } from 'react';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import LineChart from './linear';
import { useStateContext } from '../../../../../../contexts/ContextProvider';
import TimeRangeSelector from './TimeRangeSelector';
import { Modal, Button } from 'antd';

const dropdownData = [
  { Id: 'day', Time: 'Day(s)' },
  { Id: 'month', Time: 'Month' },
  { Id: 'year', Time: 'Year(s)' },
];

interface ChartdataProps {
  hardwareID: number;
  parameters: string[];
  colors?: string[];
  reloadKey?: number;
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
}) => {
  const { currentMode } = useStateContext();
  const [timeRangeType, setTimeRangeType] = useState<'day' | 'month' | 'year'>('day');
  const [selectedRange, setSelectedRange] = useState<any>(null);
  const [lineChartParameters, setLineChartParameters] = useState<LineParamWithColor[]>([]);
  const [showFullChart, setShowFullChart] = useState(false);

  const [modalTimeRangeType, setModalTimeRangeType] = useState<'day' | 'month' | 'year'>('day');
  const [modalSelectedRange, setModalSelectedRange] = useState<any>(null);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  const isTablet = typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 1200 : false;
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1200 : false;

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

  useEffect(() => {
    if (showFullChart) {
      setModalTimeRangeType(timeRangeType);
      setModalSelectedRange(selectedRange);
    }
  }, [showFullChart]);

  useEffect(() => {
    if (modalTimeRangeType === 'day') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      setModalSelectedRange([sevenDaysAgo, today]);
    } else if (modalTimeRangeType === 'month') {
      const now = new Date();
      setModalSelectedRange({
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        year: now.getFullYear().toString(),
      });
    } else if (modalTimeRangeType === 'year') {
      const y = new Date().getFullYear();
      setModalSelectedRange([y, y]);
    }
  }, [modalTimeRangeType]);

  return (
    <div className="w-full">
      <div className="w-full mx-auto px-2 py-2">
        <div className="bg-white rounded-2xl dark:bg-secondary-dark-bg dark:text-gray-200 p-3 sm:p-4 shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
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

              {/* ปุ่มขยายกราฟเฉพาะมือถือ */}
              {isMobile && (
                <Button
                  onClick={() => setShowFullChart(true)}
                  className="text-sm font-semibold border border-teal-500 text-teal-700 hover:bg-teal-50 transition px-4 py-1 rounded-lg w-full sm:w-auto"
                >
                  ขยายกราฟ
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <LineChart
              hardwareID={hardwareID}
              timeRangeType={timeRangeType}
              selectedRange={selectedRange}
              parameters={lineChartParameters.map(p => p.parameter)}
              colors={lineChartParameters.map(p => p.color)}
              chartHeight={isMobile ? "300px" : "420px"}
              reloadKey={reloadKey}
            />
          </div>

          {/* ปุ่มขยายกราฟสำหรับ Tablet และ Desktop */}
          {(isTablet || isDesktop) && (
            <div className="flex justify-end mt-2">
              <Button
                onClick={() => setShowFullChart(true)}
                className="text-sm font-semibold border border-teal-500 text-teal-700 hover:bg-teal-50 transition px-4 py-1 rounded-lg w-full sm:w-auto max-w-[160px] ml-auto"
              >
                ขยายกราฟ
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal ขยายกราฟ */}
      <Modal
        open={showFullChart}
        onCancel={() => setShowFullChart(false)}
        footer={null}
        width="100%"
        style={{ top: 0, padding: 0 }}
        bodyStyle={{
          padding: isMobile ? 8 : 24,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: currentMode === 'Dark' ? '#1e1e2f' : '#fff',
        }}
        centered
      >
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
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

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="w-full sm:w-40 rounded-xl transition bg-white dark:bg-gray-800 border border-teal-500 dark:border-teal-400 px-2 py-1 shadow-sm">
                <DropDownListComponent
                  id="modal-time"
                  fields={{ text: 'Time', value: 'Id' }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 500,
                    padding: '4px 0',
                    color: currentMode === 'Dark' ? 'white' : '#0f766e',
                  }}
                  value={modalTimeRangeType}
                  dataSource={dropdownData}
                  popupHeight="220px"
                  popupWidth="160px"
                  change={(e) => setModalTimeRangeType(e.value)}
                />
              </div>

              <TimeRangeSelector
                timeRangeType={modalTimeRangeType}
                onChange={setModalSelectedRange}
                selectedValue={modalSelectedRange}
              />
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <LineChart
              hardwareID={hardwareID}
              timeRangeType={modalTimeRangeType}
              selectedRange={modalSelectedRange}
              parameters={lineChartParameters.map((p) => p.parameter)}
              colors={lineChartParameters.map((p) => p.color)}
              chartHeight={isMobile ? "370px" : "600px"}
              reloadKey={reloadKey}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LineChartIndex;
