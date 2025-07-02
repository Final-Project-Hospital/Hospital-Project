import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import LineChart from './linear'; // เรียกใช้งานไฟล์ LineChart ด้านล่าง
import { dropdownData } from '../../../../../data/dummy';
import { useStateContext } from '../../../../../contexts/ContextProvider';
import "./chart.css";

const DropDown = ({ currentMode }: any) => (
  <div className="w-28 border-1 border-color px-2 py-1 rounded-md">
    <DropDownListComponent
      id="time"
      fields={{ text: 'Time', value: 'Id' }}
      style={{
        border: 'none',
        color: currentMode === 'Dark' ? 'white' : undefined,
      }}
      value="1"
      dataSource={dropdownData}
      popupHeight="220px"
      popupWidth="120px"
    />
  </div>
);

const Index = () => { //@ts-ignore
  const { currentColor, currentMode } = useStateContext();

  return (
    <div className="bg-white dark:text-gray-200 dark:bg-secondary-dark-bg p-6 rounded-2xl w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center gap-2 mb-10">
        <p className="text-xl font-semibold">Sales Overview</p>
        <DropDown currentMode={currentMode} />
      </div>
      <div className="w-full overflow-auto">
        <LineChart />
      </div>
    </div>
  );
};

export default Index;
