// Stacked.tsx
import React from 'react';
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  StackingColumnSeries,
  Category,
  Legend,
  Tooltip,
  ValueType,
  LabelIntersectAction,
  AxisModel,
} from '@syncfusion/ej2-react-charts';
import ChartsHeader from '../ChartsHeader';

interface ChartdataProps {
  hardwareID: number;
}

const stackedPrimaryXAxis: AxisModel = {
  valueType: 'Category' as ValueType,
  majorGridLines: { width: 0 },
  labelIntersectAction: 'Rotate45' as LabelIntersectAction,
  labelRotation: 0,
};

const stackedPrimaryYAxis = {
  labelFormat: '{value}',
  lineStyle: { width: 0 },
  majorTickLines: { width: 0 },
  minorTickLines: { width: 0 },
};

const stackedSeries = [
  {
    dataSource: [
      { x: 'Jan', y: 111.1 },
      { x: 'Feb', y: 127.3 },
      { x: 'Mar', y: 143.4 },
    ],
    xName: 'x',
    yName: 'y',
    name: 'Product A',
    type: 'StackingColumn',
  },
  {
    dataSource: [
      { x: 'Jan', y: 76.9 },
      { x: 'Feb', y: 99.5 },
      { x: 'Mar', y: 121.7 },
    ],
    xName: 'x',
    yName: 'y',
    name: 'Product B',
    type: 'StackingColumn',
  },
];

const Stacked: React.FC<ChartdataProps> = ({ hardwareID }) => (
  <div className="bg-white dark:bg-secondary-dark-bg rounded-2xl p-4 h-[540px]">
    <ChartsHeader category="Stacked" title="Revenue Breakdown" />
    <ChartComponent
      id="stacked-chart"
      width="100%"
      height="370px"
      primaryXAxis={stackedPrimaryXAxis}
      primaryYAxis={stackedPrimaryYAxis}
      chartArea={{ border: { width: 0 } }}
      tooltip={{ enable: true }}
      legendSettings={{ background: 'white' }}
    >
      <Inject services={[StackingColumnSeries, Category, Legend, Tooltip]} />
      <SeriesCollectionDirective>
        {stackedSeries.map((item, index) => (
          <SeriesDirective key={index} {...item} />
        ))}
      </SeriesCollectionDirective>
    </ChartComponent>
  </div>
);

export default Stacked;
