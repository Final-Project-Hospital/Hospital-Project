// Area.tsx
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  DateTime,
  SplineAreaSeries,
  Legend,
} from '@syncfusion/ej2-react-charts';
import ChartsHeader from '../ChartsHeader';
import { areaCustomSeries, areaPrimaryXAxis, areaPrimaryYAxis } from '../../../data/dummy';
import { useStateContext } from '../../../contexts/ContextProvider';

interface ChartdataProps {
  hardwareID: number;
}

const Area: React.FC<ChartdataProps> = ({ hardwareID }) => {
  const { currentMode } = useStateContext();

  return (
    <div className="bg-white dark:bg-secondary-dark-bg rounded-2xl p-4 h-[540px]">
      <ChartsHeader category="Area" title="Inflation Rate in percentage" />
      <ChartComponent
        id="area-chart"
        primaryXAxis={areaPrimaryXAxis}
        primaryYAxis={areaPrimaryYAxis}
        chartArea={{ border: { width: 0 } }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        legendSettings={{ background: 'white' }}
        width="100%"
        height="370px"
      >
        <Inject services={[SplineAreaSeries, DateTime, Legend]} />
        <SeriesCollectionDirective>
          {areaCustomSeries.map((item, index) => (
            <SeriesDirective key={index} {...item} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Area;