// Bar.tsx
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  Legend,
  Category,
  Tooltip,
  ColumnSeries,
  DataLabel,
} from '@syncfusion/ej2-react-charts';
import { barCustomSeries, barPrimaryXAxis, barPrimaryYAxis } from '../../../data/dummy';
import ChartsHeader from '../ChartsHeader';
import { useStateContext } from '../../../contexts/ContextProvider';

interface ChartdataProps {
  hardwareID: number;
}

const Bar: React.FC<ChartdataProps> = ({ hardwareID }) => {
  const { currentMode } = useStateContext();

  return (
    <div className="bg-white dark:bg-secondary-dark-bg rounded-2xl p-4 h-[540px]">
      <ChartsHeader category="Bar" title="Olympic Medal Counts - RIO" />
      <ChartComponent
        id="bar-chart"
        primaryXAxis={barPrimaryXAxis}
        primaryYAxis={barPrimaryYAxis}
        chartArea={{ border: { width: 0 } }}
        tooltip={{ enable: true }}
        background={currentMode === 'Dark' ? '#33373E' : '#fff'}
        legendSettings={{ background: 'white' }}
        width="100%"
        height="370px"
      >
        <Inject services={[ColumnSeries, Legend, Tooltip, Category, DataLabel]} />
        <SeriesCollectionDirective>
          {barCustomSeries.map((item, index) => (
            <SeriesDirective key={index} {...item} />
          ))}
        </SeriesCollectionDirective>
      </ChartComponent>
    </div>
  );
};

export default Bar;